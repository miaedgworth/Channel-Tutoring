"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button, LinkButton } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-24">
      <Container className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-bold text-navy">
          Something went wrong
        </h1>
        <p className="mt-3 text-navy/60">
          We&apos;re sorry, something unexpected happened. Please try again,
          or contact us if the problem continues.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
          <LinkButton href="/contact" variant="outline">
            Contact Us
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
