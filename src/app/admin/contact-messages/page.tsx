import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactMessageHandledToggle } from "@/components/admin/contact-message-handled-toggle";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact Messages" };
export const dynamic = "force-dynamic";

export default async function AdminContactMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
  const unhandledCount = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Contact form enquiries
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Submitted from the public /contact page.
            {unhandledCount > 0 && ` ${unhandledCount} unhandled.`}
          </p>

          {messages.length === 0 ? (
            <p className="mt-6 text-sm text-navy/50">No enquiries yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-navy/10 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy">{m.subject}</p>
                      <p className="mt-0.5 text-xs text-navy/50">
                        <a href={`mailto:${m.email}`} className="underline">
                          {m.name} &lt;{m.email}&gt;
                        </a>{" "}
                        · {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.handled ? "success" : "danger"}>
                        {m.handled ? "Handled" : "Unhandled"}
                      </Badge>
                      <ContactMessageHandledToggle id={m.id} handled={m.handled} />
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-navy/80">
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
