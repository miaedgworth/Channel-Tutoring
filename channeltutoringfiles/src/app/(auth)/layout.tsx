import { Container } from "@/components/ui/container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-navy/[0.03] py-16">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-navy/10 bg-white p-8 shadow-sm">
          {children}
        </div>
      </Container>
    </div>
  );
}
