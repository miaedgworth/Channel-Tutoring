"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EXAM_BOARDS, SESSION_DURATION_OPTIONS_MINUTES, formatSessionDuration } from "@/lib/constants";
import { formatLevel, formatTokenQuantity, toLocalDateInputValue, londonWallTimeToUtc } from "@/lib/utils";
import { logCompletedLesson } from "@/lib/actions/bookings";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

function todayDateValue() {
  return toLocalDateInputValue(new Date());
}

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
  const [date, setDate] = useState(todayDateValue());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Choose the date the lesson happened.");
      return;
    }
    startTransition(async () => {
      const result = await logCompletedLesson({
        clientId,
        subject,
        level: level as "KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS",
        examBoard,
        sessionMode: sessionMode as "ONLINE" | "IN_PERSON",
        date: londonWallTimeToUtc(date, "12:00"),
        durationMinutes,
        notes,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/tutor-dashboard/bookings/${result.bookingId}`);
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-navy">
            Date the lesson happened
          </label>
          <input
            id="date"
            type="date"
            max={todayDateValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="durationMinutes" className="block text-sm font-medium text-navy">
            Session length
          </label>
          <select
            id="durationMinutes"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className={inputClass}
          >
            {SESSION_DURATION_OPTIONS_MINUTES.map((m) => (
              <option key={m} value={m}>
                {formatSessionDuration(m)}
              </option>
            ))}
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
        {isPending ? "Logging..." : "Log Lesson"}
      </Button>
      <p className="text-xs text-navy/40">
        This uses {formatTokenQuantity(durationMinutes / 60)} of the
        client&apos;s {formatLevel(level)} tokens and pays you immediately.
        You can undo it within 24 hours if you make a mistake.
      </p>
    </form>
  );
}
