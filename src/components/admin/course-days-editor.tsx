"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCourseDay, updateCourseDay, deleteCourseDay } from "@/lib/actions/courses";
import { formatCurrency, formatDate } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

type Track = "MATHS" | "SCIENCE" | "OTHER";

interface Day {
  id: string;
  date: string;
  label: string;
  track: Track;
  pricePence: number;
  sortOrder: number;
}

function DayFields({
  date,
  setDate,
  label,
  setLabel,
  track,
  setTrack,
  price,
  setPrice,
  sortOrder,
  setSortOrder,
}: {
  date: string;
  setDate: (v: string) => void;
  label: string;
  setLabel: (v: string) => void;
  track: Track;
  setTrack: (v: Track) => void;
  price: string;
  setPrice: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
      <input
        required
        placeholder="Label, e.g. Foundation Maths"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className={`${inputClass} sm:col-span-2`}
      />
      <select value={track} onChange={(e) => setTrack(e.target.value as Track)} className={inputClass}>
        <option value="MATHS">Maths</option>
        <option value="SCIENCE">Science</option>
        <option value="OTHER">Other</option>
      </select>
      <input
        required
        placeholder="Price in pence, e.g. 9900"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="Sort order (optional)"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className={`${inputClass} sm:col-span-5`}
      />
    </div>
  );
}

function EditDayRow({ day, onDone }: { day: Day; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(day.date.slice(0, 10));
  const [label, setLabel] = useState(day.label);
  const [track, setTrack] = useState<Track>(day.track);
  const [price, setPrice] = useState(String(day.pricePence));
  const [sortOrder, setSortOrder] = useState(String(day.sortOrder));
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCourseDay(day.id, { date, label, track, pricePence: price, sortOrder });
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-gold-dark/40 bg-gold/5 p-3">
      {error && <p className="mb-2 text-sm text-red">{error}</p>}
      <DayFields
        date={date}
        setDate={setDate}
        label={label}
        setLabel={setLabel}
        track={track}
        setTrack={setTrack}
        price={price}
        setPrice={setPrice}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function CourseDaysEditor({ courseId, days }: { courseId: string; days: Day[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [track, setTrack] = useState<Track>("OTHER");
  const [price, setPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCourseDay(courseId, { date, label, track, pricePence: price, sortOrder });
      if (result.error) {
        setError(result.error);
        return;
      }
      setDate("");
      setLabel("");
      setTrack("OTHER");
      setPrice("");
      setSortOrder("");
      setAdding(false);
      router.refresh();
    });
  }

  function handleDelete(dayId: string) {
    if (!confirm("Remove this day? Existing bookings that include it aren't affected.")) return;
    startTransition(async () => {
      await deleteCourseDay(dayId);
      router.refresh();
    });
  }

  return (
    <div>
      {days.length === 0 ? (
        <p className="text-sm text-navy/50">No days added yet.</p>
      ) : (
        <div className="space-y-2">
          {days.map((day) =>
            editingId === day.id ? (
              <EditDayRow key={day.id} day={day} onDone={() => setEditingId(null)} />
            ) : (
              <div
                key={day.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-navy/10 px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-navy">{day.label}</span>{" "}
                  <span className="text-navy/50">
                    — {formatDate(day.date)} · {day.track}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-navy/70">{formatCurrency(day.pricePence)}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-navy underline"
                    onClick={() => setEditingId(day.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-red underline"
                    disabled={isPending}
                    onClick={() => handleDelete(day.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="mt-4 rounded-lg border border-navy/10 p-3">
          {error && <p className="mb-2 text-sm text-red">{error}</p>}
          <DayFields
            date={date}
            setDate={setDate}
            label={label}
            setLabel={setLabel}
            track={track}
            setTrack={setTrack}
            price={price}
            setPrice={setPrice}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding..." : "Add day"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => setAdding(true)}>
          Add a day
        </Button>
      )}
    </div>
  );
}
