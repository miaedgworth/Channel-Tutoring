"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrencyGBP } from "@/lib/utils";

const PRESET_AMOUNTS_PENCE = [5000, 10000, 20000];

export function TopUpForm() {
  const [amountPence, setAmountPence] = useState(PRESET_AMOUNTS_PENCE[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectPreset(value: number) {
    setAmountPence(value);
    setCustomAmount("");
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value);
    const pounds = Number(value);
    if (Number.isFinite(pounds) && pounds > 0) {
      setAmountPence(Math.round(pounds * 100));
    }
  }

  async function handleTopUp() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/credit/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountPence }),
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
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS_PENCE.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              amountPence === preset && !customAmount
                ? "border-gold-dark bg-gold/10 text-navy"
                : "border-navy/20 text-navy/70 hover:bg-navy/5"
            }`}
          >
            {formatCurrencyGBP(preset)}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="customAmount" className="block text-xs font-medium text-navy/60">
          Or enter a custom amount (£10–£1,000)
        </label>
        <input
          id="customAmount"
          type="number"
          min={10}
          max={1000}
          step={1}
          value={customAmount}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="e.g. 150"
          className="mt-1 w-40 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        />
      </div>
      <Button variant="gold" size="lg" disabled={loading} onClick={handleTopUp}>
        {loading ? "Redirecting to payment..." : `Top Up ${formatCurrencyGBP(amountPence)}`}
      </Button>
    </div>
  );
}
