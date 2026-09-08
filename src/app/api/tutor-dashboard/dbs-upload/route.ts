import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_ATTACHMENT_TYPES } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads aren't configured in this environment yet." },
      { status: 503 },
    );
  }

  const user = await requireUser("TUTOR");

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json({ error: "That file is too large (max 15MB)." }, { status: 400 });
  }
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "That file type isn't supported. Try an image, PDF or Word file." },
      { status: 400 },
    );
  }

  // Kept private (unlike message attachments) since this is a criminal
  // record check — only ever reachable through the authenticated download
  // route below, never a bare public blob URL.
  const safeFileName = file.name.split(/[/\\]/).pop()?.replace(/[^\w.-]/g, "_") || "file";
  const blob = await put(`dbs-checks/${profile.id}/${crypto.randomUUID()}-${safeFileName}`, file, {
    access: "private",
  });

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      dbsCheckUrl: blob.url,
      dbsCheckFileName: file.name,
      dbsCheckUploadedAt: new Date(),
    },
  });

  await logAudit({
    actorId: user.id,
    action: "TUTOR_DBS_CHECK_UPLOADED",
    targetType: "TutorProfile",
    targetId: profile.id,
    metadata: { fileName: file.name },
  });

  return NextResponse.json({
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
  });
}
