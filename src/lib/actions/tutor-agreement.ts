"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { TUTOR_AGREEMENT_VERSION } from "@/lib/constants";

export async function signTutorAgreement(
  fullName: string,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const name = fullName.trim();
  if (name.length < 2) {
    return { error: "Please type your full name." };
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { error: "We couldn't find your tutor profile. Please contact support." };
  }

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      agreementSignedAt: new Date(),
      agreementSignedName: name,
      agreementVersion: TUTOR_AGREEMENT_VERSION,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "TUTOR_AGREEMENT_SIGNED",
    targetType: "TutorProfile",
    targetId: profile.id,
    metadata: { name, version: TUTOR_AGREEMENT_VERSION },
  });

  revalidatePath("/tutor-dashboard");
  revalidatePath("/legal/tutor-agreement");
  revalidatePath("/admin/compliance");

  return {};
}

// Flags a single existing tutor to (re-)sign the agreement next time they
// enter their dashboard. This is deliberately never called in bulk — some
// existing tutors already signed the agreement a different way, so admin
// chooses who needs it, one tutor at a time. Doesn't touch any existing
// signature, so admin can still see what was previously signed until the
// tutor signs again.
export async function requestAgreementResign(
  tutorProfileId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const profile = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
  if (!profile) {
    return { error: "Tutor not found." };
  }

  await prisma.tutorProfile.update({
    where: { id: tutorProfileId },
    data: { agreementRequestedAt: new Date() },
  });

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_AGREEMENT_RESIGN_REQUESTED",
    targetType: "TutorProfile",
    targetId: tutorProfileId,
  });

  revalidatePath("/admin/compliance");

  return {};
}
