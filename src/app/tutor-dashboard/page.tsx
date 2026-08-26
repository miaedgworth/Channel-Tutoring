import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyGBP } from "@/lib/utils";

export const metadata: Metadata = { title: "Tutor Overview" };
export const dynamic = "force-dynamic";

export default async function TutorOverviewPage() {
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

  const [upcomingBookings, unreadMessages] = await Promise.all([
    prisma.booking.count({
      where: { tutorId: profile.id, status: "CONFIRMED", startsAt: { gte: new Date() } },
    }),
    prisma.message.count({
      where: {
        conversation: { tutorProfileId: profile.id },
        readAt: null,
        senderId: { not: user.id },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {!profile.isPublished && (
        <Card className="border-gold-dark/40 bg-gold/5">
          <CardContent>
            <p className="text-sm text-navy">
              Your profile is not published yet.{" "}
              <Link href="/tutor-dashboard/profile" className="font-semibold underline">
                Complete your profile
              </Link>{" "}
              so clients can find and book you.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <h2 className="font-heading text-sm font-semibold text-navy">
            How it works
          </h2>
          <ol className="mt-2 space-y-1.5 text-sm text-navy/60">
            <li>
              1. A client messages you through Channel Tutoring to arrange
              a session — subject, level, session length and date.
            </li>
            <li>
              2. Go to{" "}
              <Link href="/tutor-dashboard/bookings/new" className="underline">
                Schedule a session
              </Link>{" "}
              for the agreed date and time. The client&apos;s tokens are
              reserved straight away and it shows up as an upcoming session
              on their dashboard.
            </li>
            <li>
              3. You teach the session, in person or online (see below for
              online sessions).
            </li>
            <li>
              4. Afterwards, open the session from your{" "}
              <Link href="/tutor-dashboard/bookings" className="underline">
                bookings
              </Link>{" "}
              and mark it as complete to get paid. If it doesn&apos;t go
              ahead, cancel it instead to refund the client in full.
            </li>
            <li>
              5. Taught a session you didn&apos;t schedule in advance? Use{" "}
              <Link href="/tutor-dashboard/bookings/new" className="underline">
                Log a past lesson
              </Link>{" "}
              to redeem the token and get paid in one step.
            </li>
            <li>
              6. Marked a session complete by mistake? You can undo it
              within 24 hours from the booking&apos;s page.
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Profile status</p>
            <div className="mt-2">
              <Badge variant={profile.isPublished ? "success" : "warning"}>
                {profile.isPublished ? "Live" : "Unpublished"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Upcoming confirmed sessions</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {upcomingBookings}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Unread messages</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {unreadMessages}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Available balance</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrencyGBP(profile.balancePence)}
            </p>
            <Link
              href="/tutor-dashboard/earnings"
              className="mt-3 inline-block text-sm font-semibold text-navy underline"
            >
              View earnings &amp; withdraw
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Total earned to date</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrencyGBP(profile.totalEarnedPence)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="font-heading text-sm font-semibold text-navy">
            How you get paid
          </h2>
          <p className="mt-1.5 text-sm text-navy/60">
            You&apos;re paid as soon as you mark a session complete (or
            straight away when you log a past lesson). Add your bank
            details on the{" "}
            <Link href="/tutor-dashboard/earnings" className="underline">
              Earnings
            </Link>{" "}
            page, then request a withdrawal whenever you have a balance.
            Withdrawals are paid directly into your bank account by bank
            transfer every Monday.
          </p>
        </CardContent>
      </Card>

      {profile.sessionMode !== "IN_PERSON" && (
        <Card>
          <CardContent>
            <h2 className="font-heading text-sm font-semibold text-navy">
              Running online sessions
            </h2>
            <p className="mt-1.5 text-sm text-navy/60">
              Use{" "}
              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google Meet
              </a>{" "}
              for online lessons — it&apos;s free, needs no account for
              your client, and works in any browser. Share the meeting
              link with your client through Channel Tutoring messages
              before the session.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
