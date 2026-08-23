import { requireUser } from "@/lib/current-user";
import { Container } from "@/components/ui/container";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("ADMIN");

  return (
    <div className="bg-navy/[0.02] py-10">
      <Container>
        <h1 className="font-heading text-2xl font-bold text-navy">
          Admin
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Platform oversight — bookings, tutors, safeguarding and revenue.
        </p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <AdminSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </div>
  );
}
