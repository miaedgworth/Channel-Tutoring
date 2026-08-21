import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { TutorProfileForm } from "@/components/tutor-dashboard/profile-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";

export default async function TutorProfilePage() {
  const user = await requireUser("TUTOR");
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            We couldn&apos;t find your tutor profile. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl">
      <Card>
        <CardContent>
          <TutorProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
