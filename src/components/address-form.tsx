"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOwnAddress } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function AddressForm({
  addressLine1: initialLine1,
  addressLine2: initialLine2,
  addressTown: initialTown,
  addressPostcode: initialPostcode,
}: {
  addressLine1: string | null;
  addressLine2: string | null;
  addressTown: string | null;
  addressPostcode: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addressLine1, setAddressLine1] = useState(initialLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initialLine2 ?? "");
  const [addressTown, setAddressTown] = useState(initialTown ?? "");
  const [addressPostcode, setAddressPostcode] = useState(initialPostcode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateOwnAddress({
        addressLine1,
        addressLine2,
        addressTown,
        addressPostcode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Saved.
        </p>
      )}

      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-navy">
          Address
        </label>
        <input
          id="addressLine1"
          required
          autoComplete="address-line1"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          className={inputClass}
        />
        <input
          autoComplete="address-line2"
          placeholder="Address line 2 (optional)"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          className={`${inputClass} mt-2`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="addressTown" className="block text-sm font-medium text-navy">
            Town
          </label>
          <input
            id="addressTown"
            required
            autoComplete="address-level2"
            value={addressTown}
            onChange={(e) => setAddressTown(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="addressPostcode" className="block text-sm font-medium text-navy">
            Postcode
          </label>
          <input
            id="addressPostcode"
            required
            autoComplete="postal-code"
            value={addressPostcode}
            onChange={(e) => setAddressPostcode(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-xs text-navy/50">
        We only share your address with a tutor once an in-person session
        with them is confirmed.
      </p>

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving..." : "Save Address"}
      </Button>
    </form>
  );
}
