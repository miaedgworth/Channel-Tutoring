"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/constants";
import { adminGrantTokens } from "@/lib/actions/admin-tokens";

export function GrantTokensControl({ clientUserId }: { clientUserId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<string>(LEVELS[0]!.value);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Grant tokens
      </Button>
    );
  }

  function handleGrant() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await adminGrantTokens({
        clientUserId,
        level,
        quantity: Number(quantity),
        note,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="w-64 space-y-2 rounded-md border border-navy/15 bg-navy/[0.02] p-3 text-left">
      {error && <p className="text-xs text-red">{error}</p>}
      {success && <p className="text-xs text-emerald-700">Tokens added.</p>}
      <div className="flex gap-2">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="flex-1 rounded-md border border-navy/20 px-2 py-1.5 text-xs"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-16 rounded-md border border-navy/20 px-2 py-1.5 text-xs"
        />
      </div>
      <input
        type="text"
        placeholder="Note (optional, e.g. paid by cash 12/08)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="block w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs"
      />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" disabled={isPending} onClick={handleGrant}>
          {isPending ? "Adding..." : "Confirm"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
