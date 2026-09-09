"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminUpdateClientAddress, requestClientAddress } from "@/lib/actions/admin-clients";

const inputClass = "block w-full rounded-md border border-navy/20 px-2 py-1.5 text-xs";

export function AdminClientAddressControl({
  clientUserId,
  addressLine1,
  addressLine2,
  addressTown,
  addressPostcode,
}: {
  clientUserId: string;
  addressLine1: string | null;
  addressLine2: string | null;
  addressTown: string | null;
  addressPostcode: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [line1, setLine1] = useState(addressLine1 ?? "");
  const [line2, setLine2] = useState(addressLine2 ?? "");
  const [town, setTown] = useState(addressTown ?? "");
  const [postcode, setPostcode] = useState(addressPostcode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await adminUpdateClientAddress(clientUserId, {
        addressLine1: line1,
        addressLine2: line2,
        addressTown: town,
        addressPostcode: postcode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleRequest() {
    startTransition(async () => {
      await requestClientAddress(clientUserId);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="w-56 space-y-2 rounded-md border border-navy/15 bg-navy/[0.02] p-3 text-left">
        {error && <p className="text-xs text-red">{error}</p>}
        <input
          placeholder="Address line 1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Address line 2 (optional)"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Town"
          value={town}
          onChange={(e) => setTown(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <Button variant="primary" size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        {addressLine1 ? "Edit address" : "Add address"}
      </Button>
      <Button variant="ghost" size="sm" disabled={isPending} onClick={handleRequest}>
        {isPending ? "..." : "Request from client"}
      </Button>
    </div>
  );
}
