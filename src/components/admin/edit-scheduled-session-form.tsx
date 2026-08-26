"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EXAM_BOARDS, SESSION_DURATION_OPTIONS_MINUTES, formatSessionDuration } from "@/lib/constants";
import { formatLevel, formatTokenQuantity } from "@/lib/utils";
import { adminUpdateScheduledSession } from "@/lib/actions/admin-bookings";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

function toDateValue(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toTimeValue(d: Date) {
  return d.toISOString().slice(11, 16);
}

export function EditScheduledSessionForm({
  bookingId,
  tutorSubjects,
  tutorLevels,
  tutorSessionMode,
  initial,
}: {
  bookingId: string;
  tutorSubjects: string[];
  tutorLevels: string[];
  tutorSessionMode: string;
  initial: {
    subject: string;
    level: string;
    examBoard: string;
    sessionMode: string;
    startsAt: string;
    durationMinutes: number;
    notes: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subject, setSubject] = useState(initial.subject);
  const [level, setLevel] = useState(initial.level);
  const [examBoard, setExamBoard] = useState(initial.examBoard);
  const [sessionMode, setSessionMode] = useState(initial.sessionMode);
  const initialDate = new Date(initial.startsAt);
  const [date, setDate] = useState(toDateValue(initialDate));
  const [time, setTime] = useState(toTimeValue(initialDate));
  const [durationMinutes, setDurationMinutes] = useState(initial.durationMinutes);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!date || !time) {
      setError("Choose the date and time of the session.");
      return;
    }
    const startsAt = new Date(`${date}T${time}:00`);
    if (startsAt.getTime() <= Date.now()) {
      setError("Choose a date and time in the future.");
      return;
    }
    startTransition(async () => {
      const result = await adminUpdateScheduledSession(bookingId, {
        subject,
        level: level as "KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS",
        examBoard,
        sessionMode: sessionMode as "ONLINE" | "IN_PERSON",
        date: startsAt,
        durationMinutes,
        notes,
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Session updated — both client and tutor have been emailed.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="editSubject" className="block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="editSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {(tutorSubjects.includes(subject) ? tutorSubjects : [subject, ...tutorSubjects]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="editLevel" className="block text-sm font-medium text-navy">
            Level
          </label>
          <select
            id="editLevel"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={inputClass}
          >
            {(tutorLevels.includes(level) ? tutorLevels : [level, ...tutorLevels]).map((l) => (
              <option key={l} value={l}>
                {formatLevel(l)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tutorSessionMode === "BOTH" && (
        <div>
          <label htmlFor="editSessionMode" className="block text-sm font-medium text-navy">
            Session mode
          </label>
          <select
            id="editSessionMode"
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
        <label htmlFor="editExamBoard" className="block text-sm font-medium text-navy">
          Exam board (optional)
        </label>
        <select
          id="editExamBoard"
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
          <label htmlFor="editDate" className="block text-sm font-medium text-navy">
            Date
          </label>
          <input
            id="editDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="editTime" className="block text-sm font-medium text-navy">
            Time
          </label>
          <input
            id="editTime"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="editDuration" className="block text-sm font-medium text-navy">
            Session length
          </label>
          <select
            id="editDuration"
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
        <label htmlFor="editNotes" className="block text-sm font-medium text-navy">
          Notes for this session (optional)
        </label>
        <textarea
          id="editNotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
      <p className="text-xs text-navy/40">
        Changing the level or session length adjusts the client&apos;s
        reserved tokens automatically. Both client and tutor are emailed
        about the change.{" "}
        {formatTokenQuantity(durationMinutes / 60)} token
        {durationMinutes / 60 === 1 ? "" : "s"} will be reserved for this
        session.
      </p>
    </form>
  );
}
