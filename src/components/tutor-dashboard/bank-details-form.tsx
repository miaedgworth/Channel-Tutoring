"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setBankDetails } from "@/lib/actions/bank-payouts";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function BankDetailsForm({
  current,
}: {
  current: { bankAccountName: string | null; bankSortCode: string | null; bankAccountNumber: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(current.bankAccountName ?? "");
  const [sortCode, setSortCode] = useState(current.bankSortCode ?? "");
  const [accountNumber, setAccountNumber] = useState(current.bankAccountNumber ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setBankDetails({
        bankAccountName: name,
        bankSortCode: sortCode,
        bankAccountNumber: accountNumber,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Bank details saved.</p>}
      <div>
        <label htmlFor="bankAccountName" className="block text-sm font-medium text-navy">
          Name on account
        </label>
        <input
          id="bankAccountName"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bankSortCode" className="block text-sm font-medium text-navy">
            Sort code
          </label>
          <input
            id="bankSortCode"
            required
            placeholder="12-34-56"
            value={sortCode}
            onChange={(e) => setSortCode(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-navy">
            Account number
          </label>
          <input
            id="bankAccountNumber"
            required
            placeholder="12345678"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Button type="submit" variant="gold" disabled={isPending}>
        {isPending ? "Saving..." : current.bankAccountName ? "Update bank details" : "Save bank details"}
      </Button>
    </form>
  );
}
