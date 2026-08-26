import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { TutorProfileForm } from "@/components/tutor-dashboard/profile-form";

export const metadata: Metadata = { title: "Edit Tutor Profile" };
export const dynamic = "force-dynamic";

export default async function AdminEditTutorPage({
  params,
}: PageProps<"/admin/tutors/[id]/edit">) {
  await requireUser("ADMIN");
  const { id } = await params;

  const profile = await prisma.tutorProfile.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) notFound();

  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">
          Edit {profile.user.name}&apos;s profile
        </h2>
        <p className="mt-1 text-sm text-navy/50">{profile.user.email}</p>
        <div className="mt-6">
          <TutorProfileForm profile={profile} adminTutorProfileId={profile.id} />
        </div>
      </CardContent>
    </Card>
  );
}
