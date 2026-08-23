import { requireUser } from "@/lib/current-user";
import { Container } from "@/components/ui/container";
import { TutorSidebar } from "@/components/tutor-dashboard/tutor-sidebar";

export default async function TutorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("TUTOR");

  return (
    <div className="bg-navy/[0.02] py-10">
      <Container>
        <h1 className="font-heading text-2xl font-bold text-navy">
          Tutor Dashboard
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Manage your profile, bookings, messages and earnings.
        </p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <TutorSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </div>
  );
}
