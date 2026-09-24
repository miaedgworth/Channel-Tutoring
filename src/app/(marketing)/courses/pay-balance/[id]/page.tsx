import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { GuestBalancePaymentForm } from "@/components/marketing/guest-balance-payment-form";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Pay Course Balance" };
export const dynamic = "force-dynamic";

// Guest-only page — a guest booking (no account) has no dashboard to pay
// its balance from, so this is where the balance-due reminder email and
// the deposit confirmation email both link to instead. Deliberately shows
// nothing about the child — just the course and the amount due — until
// the guest confirms their email in the form below.
export default async function PayCourseBalancePage({
  params,
  searchParams,
}: PageProps<"/courses/pay-balance/[id]">) {
  const { id } = await params;
  const search = await searchParams;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id },
    include: { course: { select: { title: true, balanceDueDate: true } } },
  });

  if (!enrollment || enrollment.clientId !== null) {
    notFound();
  }

  return (
    <Container className="max-w-md py-16">
      <Card>
        <CardContent>
          <h1 className="font-heading text-xl font-bold text-navy">Pay your course balance</h1>
          <p className="mt-1.5 text-sm text-navy/60">{enrollment.course.title}</p>

          {search.checkout === "deposit-success" && (
            <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Deposit received — your place is booked. Bookmark this page to pay the balance
              when it&apos;s due.
            </div>
          )}
          {search.checkout === "success" && (
            <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Payment received — this will update shortly.
            </div>
          )}

          {enrollment.balanceStatus === "PAID" ? (
            <p className="mt-4 text-sm text-navy/70">
              The balance for this booking has already been paid — thank you!
            </p>
          ) : enrollment.depositStatus !== "PAID" ? (
            <p className="mt-4 text-sm text-navy/70">
              The deposit for this booking hasn&apos;t been paid yet.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-navy/70">
                Balance due:{" "}
                <span className="font-semibold text-navy">
                  {formatCurrency(enrollment.balancePence)}
                </span>
                {enrollment.course.balanceDueDate &&
                  ` (due ${formatDate(enrollment.course.balanceDueDate)})`}
              </p>
              <p className="mt-1 text-sm text-navy/60">
                Enter the email you used when booking to continue to payment.
              </p>
              <div className="mt-4">
                <GuestBalancePaymentForm enrollmentId={enrollment.id} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
