"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/constants";
import { adminGrantTokens, adminRemoveTokens } from "@/lib/actions/admin-tokens";

type Mode = "add" | "remove";

export function ManageTokensControl({
  clientUserId,
  balanceByLevel,
}: {
  clientUserId: string;
  balanceByLevel: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [level, setLevel] = useState<string>(LEVELS[0]!.value);
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage tokens
      </Button>
    );
  }

  function handleSubmit() {
    setError(null);
    setSuccess(false);
    if (mode === "remove" && !reason.trim()) {
      setError("Enter a reason for removing these tokens.");
      return;
    }
    startTransition(async () => {
      const result =
        mode === "add"
          ? await adminGrantTokens({ clientUserId, level, quantity: Number(quantity), note })
          : await adminRemoveTokens({ clientUserId, level, quantity: Number(quantity), reason });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setNote("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="w-64 space-y-2 rounded-md border border-navy/15 bg-navy/[0.02] p-3 text-left">
      {error && <p className="text-xs text-red">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-700">
          {mode === "add" ? "Tokens added." : "Tokens removed — client emailed."}
        </p>
      )}

      <div className="flex rounded-md border border-navy/20 text-xs font-medium">
        <button
          type="button"
          onClick={() => { setMode("add"); setError(null); }}
          className={`flex-1 rounded-l-md px-2 py-1.5 ${mode === "add" ? "bg-navy text-white" : "text-navy/70 hover:bg-navy/5"}`}
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setMode("remove"); setError(null); }}
          className={`flex-1 rounded-r-md px-2 py-1.5 ${mode === "remove" ? "bg-red text-white" : "text-navy/70 hover:bg-navy/5"}`}
        >
          Remove
        </button>
      </div>

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

      {mode === "add" ? (
        <input
          type="text"
          placeholder="Note (optional, e.g. paid by cash 12/08)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="block w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs"
        />
      ) : (
        <>
          <p className="text-xs text-navy/50">
            They currently have {balanceByLevel[level] ?? "0"} at this level.
          </p>
          <textarea
            placeholder="Reason (required) — this is emailed to the client"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="block w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs"
          />
        </>
      )}

      <div className="flex gap-2">
        <Button
          variant={mode === "add" ? "primary" : "danger"}
          size="sm"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Saving..." : mode === "add" ? "Add tokens" : "Remove tokens"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
