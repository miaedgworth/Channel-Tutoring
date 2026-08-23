"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setStatus("success");
      setMessage("You're subscribed — thank you!");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={cn(
            "min-w-0 flex-1 rounded-md border px-3 py-2 text-sm",
            compact
              ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-gold focus:outline-none"
              : "border-navy/20 text-navy placeholder:text-navy/40 focus:border-gold-dark focus:outline-none",
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy-dark hover:bg-gold-dark hover:text-white disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={cn(
            "mt-2 text-xs",
            status === "success"
              ? compact
                ? "text-gold-light"
                : "text-emerald-700"
              : "text-red-light",
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
