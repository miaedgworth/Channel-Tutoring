"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK, AVAILABILITY_PERIODS } from "@/lib/constants";
import { setAvailabilitySlot } from "@/lib/actions/availability";

type SlotKey = `${string}_${string}`;

function key(dayOfWeek: string, period: string): SlotKey {
  return `${dayOfWeek}_${period}`;
}

export function AvailabilityGrid({
  slots,
}: {
  slots: { dayOfWeek: string; period: string }[];
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<SlotKey>>(
    new Set(slots.map((s) => key(s.dayOfWeek, s.period))),
  );
  const [pending, setPending] = useState<Set<SlotKey>>(new Set());
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(dayOfWeek: string, period: string) {
    const k = key(dayOfWeek, period);
    const enabled = !checked.has(k);
    setError(null);

    setChecked((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(k);
      else next.delete(k);
      return next;
    });
    setPending((prev) => new Set(prev).add(k));

    startTransition(async () => {
      const result = await setAvailabilitySlot({ dayOfWeek, period, enabled });
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
      if (result.error) {
        setError(result.error);
        setChecked((prev) => {
          const next = new Set(prev);
          if (enabled) next.delete(k);
          else next.add(k);
          return next;
        });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-md bg-red/10 px-4 py-2 text-sm text-red">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr>
              <th className="pb-2 text-left font-medium text-navy/50"></th>
              {AVAILABILITY_PERIODS.map((p) => (
                <th key={p.value} className="pb-2 text-center font-medium text-navy/50">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_OF_WEEK.map((day) => (
              <tr key={day.value} className="border-t border-navy/10">
                <td className="py-2.5 font-medium text-navy">{day.label}</td>
                {AVAILABILITY_PERIODS.map((p) => {
                  const k = key(day.value, p.value);
                  return (
                    <td key={p.value} className="py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${day.label} ${p.label}`}
                        checked={checked.has(k)}
                        disabled={pending.has(k)}
                        onChange={() => toggle(day.value, p.value)}
                        className="h-4 w-4 accent-navy"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
