import type { Level } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

// Atomic conditional claim shared by every place that reserves tokens for a
// booking — the WHERE clause is re-checked against the row's committed
// value even under a concurrent transaction, so two simultaneous claims
// against an almost-exhausted balance can't both succeed.
export async function tryClaimTokens(
  tx: Tx,
  userId: string,
  level: Level,
  tokensUsed: number,
): Promise<boolean> {
  const claimed = await tx.tokenBalance.updateMany({
    where: { userId, level, balance: { gte: tokensUsed } },
    data: { balance: { decrement: tokensUsed } },
  });
  return claimed.count > 0;
}

// Called whenever a client's token balance goes up (a Stripe purchase, an
// admin grant) — walks their unpaid recurring-series bookings for that
// level, oldest first, claiming a token and completing the reservation
// (Payment + REDEEM TokenTransaction) for as many as the new balance
// covers. Stops at the first one it can't afford, since later ones are
// further away and no more urgent.
export async function reserveTokensForUnpaidBookings(
  tx: Tx,
  clientId: string,
  level: Level,
): Promise<void> {
  const unpaid = await tx.booking.findMany({
    where: {
      clientId,
      level,
      status: "CONFIRMED",
      tokensReserved: false,
    },
    orderBy: { startsAt: "asc" },
    include: { tutor: { include: { user: { select: { name: true } } } } },
  });

  for (const booking of unpaid) {
    const tokensUsed = Number(booking.tokensUsed);
    const claimed = await tryClaimTokens(tx, clientId, level, tokensUsed);
    if (!claimed) break;

    await tx.tokenTransaction.create({
      data: {
        userId: clientId,
        level,
        type: "REDEEM",
        quantity: -tokensUsed,
        bookingId: booking.id,
        description: `${booking.subject} session (recurring) with ${booking.tutor.user.name} on ${formatDate(booking.startsAt)}`,
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { tokensReserved: true },
    });
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amountPence: booking.pricePence,
        platformFeePence: booking.platformFeePence,
        tutorAmountPence: booking.tutorPayoutPence,
        status: "PENDING",
      },
    });
  }
}
