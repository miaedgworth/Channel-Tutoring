import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey || apiKey.startsWith("sk_test_placeholder")) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.",
    );
  }
  if (!client) {
    client = new Stripe(apiKey, { apiVersion: "2026-07-29.dahlia" });
  }
  return client;
}

export function isStripeConfigured() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  return Boolean(apiKey && !apiKey.startsWith("sk_test_placeholder"));
}
