import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireUser("ADMIN");

  const payments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          client: { select: { name: true } },
          tutor: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const rows = payments.map((p) => ({
    date: p.createdAt.toISOString(),
    bookingId: p.bookingId,
    clientName: p.booking.client.name,
    tutorName: p.booking.tutor.user.name,
    amountPence: p.amountPence,
    platformFeePence: p.platformFeePence,
    tutorAmountPence: p.tutorAmountPence,
    status: p.status,
  }));

  return csvResponse(
    toCsv(rows, [
      "date",
      "bookingId",
      "clientName",
      "tutorName",
      "amountPence",
      "platformFeePence",
      "tutorAmountPence",
      "status",
    ]),
    "revenue.csv",
  );
}
