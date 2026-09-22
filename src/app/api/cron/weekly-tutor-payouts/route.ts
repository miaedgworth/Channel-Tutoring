import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatCurrency, escapeHtml } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { region } from "@/lib/region";

// Runs every Monday (see vercel.json). Replaces the old "tutor clicks
// Request Payout" step with an automatic sweep: every tutor with a
// positive balance and no payout already in flight gets a PENDING payout
// queued for whatever they've earned up to this point, same as if they'd
// requested it themselves — it still shows up on Admin > Payouts for Mia
// to actually pay by bank transfer and mark done. This never moves real
// money on its own.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.tutorProfile.findMany({
    where: { balancePence: { gt: 0 } },
    include: { user: { select: { name: true, email: true } } },
  });

  let queued = 0;
  let skippedNoBankDetails = 0;
  let skippedAlreadyPending = 0;

  for (const tutor of candidates) {
    if (!tutor.bankAccountName || !tutor.bankSortCode || !tutor.bankAccountNumber) {
      skippedNoBankDetails++;
      await sendEmail({
        to: tutor.user.email,
        subject: "Add your bank details to get paid",
        html: baseEmailLayout(`
          <p>Hi ${escapeHtml(tutor.user.name)},</p>
          <p>You have ${formatCurrency(tutor.balancePence)} owed to you on ${region.brandName},
          but we don't have your bank details on file yet, so it couldn't be included in
          this week's payout.</p>
          <p>Add them in your dashboard and it'll be picked up automatically next Monday:</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tutor-dashboard/earnings" style="color:#C9A227;font-weight:bold;">Add bank details</a></p>
        `),
      }).catch(() => {});
      continue;
    }

    try {
      await prisma.payout.create({
        data: { tutorId: tutor.id, amountPence: tutor.balancePence, status: "PENDING" },
      });
      queued++;
      await logAudit({
        action: "TUTOR_PAYOUT_REQUESTED",
        targetType: "TutorProfile",
        targetId: tutor.id,
        metadata: { amountPence: tutor.balancePence, method: "bank_transfer", automatic: true },
      });
    } catch (err) {
      // The partial unique index (Payout_tutorId_one_pending) is what
      // actually guarantees this — a tutor who already has a pending
      // payout (e.g. from a previous sweep not yet paid) is just skipped.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        skippedAlreadyPending++;
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json({
    tutorsChecked: candidates.length,
    queued,
    skippedNoBankDetails,
    skippedAlreadyPending,
  });
}
