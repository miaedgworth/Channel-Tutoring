import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24">
      <Container className="max-w-md text-center">
        <p className="font-heading text-6xl font-bold text-gold-dark">404</p>
        <h1 className="mt-4 font-heading text-2xl font-bold text-navy">
          Page not found
        </h1>
        <p className="mt-3 text-navy/60">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/" variant="primary">
            Back to Home
          </LinkButton>
          <LinkButton href="/find-a-tutor" variant="outline">
            Find a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
