import { Container } from "@/components/ui/container";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-navy/50">Last updated: {lastUpdated}</p>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-navy/80 [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:underline">
          {children}
        </div>
      </Container>
    </div>
  );
}
