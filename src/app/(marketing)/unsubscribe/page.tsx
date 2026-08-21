import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { unsubscribeEmail } from "@/lib/newsletter";

export const metadata: Metadata = { title: "Unsubscribe" };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: PageProps<"/unsubscribe">) {
  const { token } = await searchParams;

  let result: "success" | "invalid" | "missing" = "missing";
  if (typeof token === "string" && token) {
    const subscription = await unsubscribeEmail(token);
    result = subscription ? "success" : "invalid";
  }

  return (
    <div className="py-24">
      <Container className="max-w-md text-center">
        {result === "success" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-navy">
              You&apos;re unsubscribed
            </h1>
            <p className="mt-3 text-navy/70">
              You won&apos;t receive any more marketing emails from Channel
              Tutoring. You&apos;ll still receive essential account and
              booking emails.
            </p>
          </>
        )}
        {result === "invalid" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-navy">
              Link no longer valid
            </h1>
            <p className="mt-3 text-navy/70">
              This unsubscribe link isn&apos;t valid. If you&apos;re still
              receiving emails you&apos;d like to stop, please update your
              preference in your account settings or contact us.
            </p>
          </>
        )}
        {result === "missing" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-navy">
              Missing unsubscribe link
            </h1>
            <p className="mt-3 text-navy/70">
              Please use the unsubscribe link from one of our emails.
            </p>
          </>
        )}
      </Container>
    </div>
  );
}
