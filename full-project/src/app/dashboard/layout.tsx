import { requireUser } from "@/lib/current-user";
import { Container } from "@/components/ui/container";
import { ClientSidebar } from "@/components/dashboard/client-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("CLIENT");

  return (
    <div className="bg-navy/[0.02] py-10">
      <Container>
        <h1 className="font-heading text-2xl font-bold text-navy">
          My Dashboard
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Bookings, messages and account settings.
        </p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <ClientSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </div>
  );
}
