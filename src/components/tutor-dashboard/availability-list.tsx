"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { AVAILABILITY_PERIOD_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { deleteAvailabilitySlot } from "@/lib/actions/availability";

export function AvailabilityList({
  slots,
}: {
  slots: { id: string; date: Date; period: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (slots.length === 0) {
    return <p className="text-sm text-navy/50">No upcoming availability yet.</p>;
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAvailabilitySlot(id);
      router.refresh();
    });
  }

  return (
    <ul className="divide-y divide-navy/10">
      {slots.map((slot) => (
        <li key={slot.id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-navy">{formatDate(slot.date)}</p>
            <p className="text-xs text-navy/50">{AVAILABILITY_PERIOD_LABELS[slot.period]}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => handleDelete(slot.id)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
