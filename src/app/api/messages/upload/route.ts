import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/current-user";
import { assertParticipant } from "@/lib/actions/messages";
import { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_ATTACHMENT_TYPES } from "@/lib/constants";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File sharing isn't configured in this environment yet." },
      { status: 503 },
    );
  }

  const user = await requireUser();

  const formData = await request.formData();
  const conversationId = formData.get("conversationId");
  const file = formData.get("file");

  if (typeof conversationId !== "string" || !conversationId) {
    return NextResponse.json({ error: "Missing conversation." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const participant = await assertParticipant(conversationId, user.id);
  if (participant.error) {
    return NextResponse.json({ error: participant.error }, { status: 403 });
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return NextResponse.json(
      { error: "That file is too large (max 15MB)." },
      { status: 400 },
    );
  }
  if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "That file type isn't supported. Try an image, PDF, Word, Excel or PowerPoint file." },
      { status: 400 },
    );
  }

  const blob = await put(`messages/${conversationId}/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({
    url: blob.url,
    name: file.name,
    type: file.type,
    sizeBytes: file.size,
  });
}
