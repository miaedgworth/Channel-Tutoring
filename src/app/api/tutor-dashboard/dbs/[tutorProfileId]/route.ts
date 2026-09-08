import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tutorProfileId: string }> },
) {
  const user = await requireUser();
  const { tutorProfileId } = await params;

  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { userId: true, dbsCheckUrl: true, dbsCheckFileName: true },
  });
  if (!profile || !profile.dbsCheckUrl) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // Only the tutor themselves, or an admin, can ever retrieve this file —
  // it's a criminal record check, so it's stored as a private blob and
  // only ever reachable through this authenticated proxy.
  const isOwner = user.role === "TUTOR" && user.id === profile.userId;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const result = await get(profile.dbsCheckUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Content-Disposition": `inline; filename="${(profile.dbsCheckFileName ?? "dbs-check").replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
