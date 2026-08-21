import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireUser("ADMIN");

  const bookings = await prisma.booking.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      tutor: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  const rows = bookings.map((b) => ({
    id: b.id,
    startsAt: b.startsAt.toISOString(),
    status: b.status,
    subject: b.subject,
    level: b.level,
    clientName: b.client.name,
    clientEmail: b.client.email,
    tutorName: b.tutor.user.name,
    tutorEmail: b.tutor.user.email,
    pricePence: b.pricePence,
    platformFeePence: b.platformFeePence,
    tutorPayoutPence: b.tutorPayoutPence,
  }));

  return csvResponse(
    toCsv(rows, [
      "id",
      "startsAt",
      "status",
      "subject",
      "level",
      "clientName",
      "clientEmail",
      "tutorName",
      "tutorEmail",
      "pricePence",
      "platformFeePence",
      "tutorPayoutPence",
    ]),
    "bookings.csv",
  );
}
