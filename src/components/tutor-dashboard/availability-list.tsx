"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteAvailabilitySlot } from "@/lib/actions/availability";

export function AvailabilityList({
  slots,
}: {
  slots: { id: string; startsAt: Date; endsAt: Date; isBooked: boolean }[];
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
            <p className="text-sm font-medium text-navy">
              {formatDateTime(slot.startsAt)}
            </p>
            <p className="text-xs text-navy/50">
              {Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000)} minutes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={slot.isBooked ? "success" : "neutral"}>
              {slot.isBooked ? "Booked" : "Available"}
            </Badge>
            {!slot.isBooked && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleDelete(slot.id)}
              >
                Remove
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
