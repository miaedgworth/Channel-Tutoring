"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrencyGBP, formatLevel } from "@/lib/utils";
import { LEVELS, LEVEL_PRICE_PENCE, BLOCK_BOOKING_MIN_SESSIONS, BLOCK_BOOKING_DISCOUNT_RATE } from "@/lib/constants";

export function TokenPurchaseForm() {
  const [level, setLevel] = useState<string>(LEVELS[1].value);
  const [quantityInput, setQuantityInput] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantity = Math.max(1, Math.min(50, Number(quantityInput) || 1));
  const unitPricePence = LEVEL_PRICE_PENCE[level];
  const fullPricePence = unitPricePence * quantity;
  const applyDiscount = quantity >= BLOCK_BOOKING_MIN_SESSIONS;
  const totalPence = applyDiscount
    ? Math.round(fullPricePence * (1 - BLOCK_BOOKING_DISCOUNT_RATE))
    : fullPricePence;

  async function handleBuy() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/tokens/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="tokenLevel" className="block text-xs font-medium text-navy/60">
          Level
        </label>
        <select
          id="tokenLevel"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none sm:w-auto"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label} — {formatCurrencyGBP(LEVEL_PRICE_PENCE[l.value])}/token
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tokenQuantity" className="block text-xs font-medium text-navy/60">
          Number of tokens
        </label>
        <input
          id="tokenQuantity"
          type="number"
          min={1}
          max={50}
          step={1}
          value={quantityInput}
          onChange={(e) => setQuantityInput(e.target.value)}
          onBlur={() => setQuantityInput(String(quantity))}
          className="mt-1 w-24 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        />
        <p className="mt-1 text-xs text-navy/50">
          Buy {BLOCK_BOOKING_MIN_SESSIONS}+ at once to get{" "}
          {Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% off automatically.
        </p>
      </div>

      <div className="rounded-md bg-navy/[0.03] px-4 py-3 text-sm">
        <p className="text-navy/70">
          {quantity} {formatLevel(level)} token{quantity > 1 ? "s" : ""} at{" "}
          {formatCurrencyGBP(unitPricePence)} each
          {applyDiscount && " — 10% block discount applied"}
        </p>
        <p className="mt-1 font-heading text-lg font-semibold text-navy">
          {formatCurrencyGBP(totalPence)}
        </p>
      </div>

      <Button variant="gold" size="lg" disabled={loading} onClick={handleBuy}>
        {loading ? "Redirecting to payment..." : `Buy ${formatCurrencyGBP(totalPence)}`}
      </Button>
    </div>
  );
}
