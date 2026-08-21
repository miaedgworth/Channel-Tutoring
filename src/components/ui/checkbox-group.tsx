"use client";

import { cn } from "@/lib/utils";

export function CheckboxGroup({
  options,
  values,
  onChange,
  columns = 2,
}: {
  options: readonly (string | { value: string; label: string })[];
  values: string[];
  onChange: (values: string[]) => void;
  columns?: 2 | 3;
}) {
  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
      )}
    >
      {options.map((opt) => {
        const value = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const checked = values.includes(value);
        return (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              checked
                ? "border-gold-dark bg-gold/10 text-navy"
                : "border-navy/15 text-navy/70 hover:border-navy/30",
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(value)}
              className="h-4 w-4 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}
