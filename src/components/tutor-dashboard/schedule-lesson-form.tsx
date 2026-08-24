"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EXAM_BOARDS } from "@/lib/constants";
import { formatLevel } from "@/lib/utils";
import { scheduleLesson } from "@/lib/actions/bookings";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function ScheduleLessonForm({
  clients,
  subjects,
  levels,
  sessionMode: tutorSessionMode,
  preselectedClientId,
}: {
  clients: { id: string; name: string }[];
  subjects: string[];
  levels: string[];
  sessionMode: string;
  preselectedClientId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clientId, setClientId] = useState(
    preselectedClientId && clients.some((c) => c.id === preselectedClientId)
      ? preselectedClientId
      : (clients[0]?.id ?? ""),
  );
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [level, setLevel] = useState(levels[0] ?? "GCSE");
  const [examBoard, setExamBoard] = useState("");
  const [sessionMode, setSessionMode] = useState(
    tutorSessionMode === "BOTH" ? "ONLINE" : tutorSessionMode,
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !time) {
      setError("Choose a date and time.");
      return;
    }
    const startsAt = new Date(`${date}T${time}`);
    startTransition(async () => {
      try {
        const bookingId = await scheduleLesson({
          clientId,
          subject,
          level: level as "KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS",
          examBoard,
          sessionMode: sessionMode as "ONLINE" | "IN_PERSON",
          startsAt,
          durationMinutes: Number(duration),
          notes,
        });
        router.push(`/tutor-dashboard/bookings/${bookingId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-navy">
          Client
        </label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className={inputClass}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-navy">
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={inputClass}
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {formatLevel(l)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tutorSessionMode === "BOTH" && (
        <div>
          <label htmlFor="sessionMode" className="block text-sm font-medium text-navy">
            Session mode
          </label>
          <select
            id="sessionMode"
            value={sessionMode}
            onChange={(e) => setSessionMode(e.target.value)}
            className={inputClass}
          >
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In person</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="examBoard" className="block text-sm font-medium text-navy">
          Exam board (optional)
        </label>
        <select
          id="examBoard"
          value={examBoard}
          onChange={(e) => setExamBoard(e.target.value)}
          className={inputClass}
        >
          <option value="">Not sure / doesn&apos;t matter</option>
          {EXAM_BOARDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-navy">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-navy">
            Start time
          </label>
          <input
            id="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-navy">
            Duration
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">120 minutes</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-navy">
          Notes for this lesson (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Scheduling..." : "Schedule Lesson"}
      </Button>
      <p className="text-xs text-navy/40">
        Your client will be asked to use their credit balance to confirm this
        lesson. It won&apos;t be guaranteed until they do.
      </p>
    </form>
  );
}
