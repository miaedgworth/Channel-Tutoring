"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EXAM_BOARDS, SESSION_DURATION_OPTIONS_MINUTES, formatSessionDuration } from "@/lib/constants";
import { formatLevel, formatTokenQuantity, toLocalDateInputValue, londonWallTimeToUtc } from "@/lib/utils";
import { adminLogCompletedLesson } from "@/lib/actions/admin-bookings";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

function todayDateValue() {
  return toLocalDateInputValue(new Date());
}

type Tutor = {
  id: string;
  subjects: string[];
  levels: string[];
  sessionMode: string;
  user: { name: string };
};

export function AdminLogLessonForm({
  clients,
  tutors,
}: {
  clients: { id: string; name: string; email: string }[];
  tutors: Tutor[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [tutorProfileId, setTutorProfileId] = useState(tutors[0]?.id ?? "");
  const tutor = useMemo(
    () => tutors.find((t) => t.id === tutorProfileId) ?? tutors[0],
    [tutors, tutorProfileId],
  );

  const [subject, setSubject] = useState(tutor?.subjects[0] ?? "");
  const [level, setLevel] = useState(tutor?.levels[0] ?? "GCSE");
  const [examBoard, setExamBoard] = useState("");
  const [sessionMode, setSessionMode] = useState(
    tutor?.sessionMode === "BOTH" ? "ONLINE" : (tutor?.sessionMode ?? "ONLINE"),
  );
  const [date, setDate] = useState(todayDateValue());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleTutorChange(id: string) {
    setTutorProfileId(id);
    const next = tutors.find((t) => t.id === id);
    if (next) {
      setSubject(next.subjects[0] ?? "");
      setLevel(next.levels[0] ?? "GCSE");
      setSessionMode(next.sessionMode === "BOTH" ? "ONLINE" : next.sessionMode);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Choose the date the lesson happened.");
      return;
    }
    startTransition(async () => {
      const result = await adminLogCompletedLesson({
        clientId,
        tutorProfileId,
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
      router.push(`/admin/bookings/${result.bookingId}`);
      router.refresh();
    });
  }

  if (!tutor) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="adminLogClient" className="block text-sm font-medium text-navy">
            Client
          </label>
          <select
            id="adminLogClient"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="adminLogTutor" className="block text-sm font-medium text-navy">
            Tutor
          </label>
          <select
            id="adminLogTutor"
            value={tutorProfileId}
            onChange={(e) => handleTutorChange(e.target.value)}
            className={inputClass}
          >
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="adminLogSubject" className="block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="adminLogSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {tutor.subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="adminLogLevel" className="block text-sm font-medium text-navy">
            Level
          </label>
          <select
            id="adminLogLevel"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={inputClass}
          >
            {tutor.levels.map((l) => (
              <option key={l} value={l}>
                {formatLevel(l)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tutor.sessionMode === "BOTH" && (
        <div>
          <label htmlFor="adminLogSessionMode" className="block text-sm font-medium text-navy">
            Session mode
          </label>
          <select
            id="adminLogSessionMode"
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
        <label htmlFor="adminLogExamBoard" className="block text-sm font-medium text-navy">
          Exam board (optional)
        </label>
        <select
          id="adminLogExamBoard"
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
          <label htmlFor="adminLogDate" className="block text-sm font-medium text-navy">
            Date the lesson happened
          </label>
          <input
            id="adminLogDate"
            type="date"
            max={todayDateValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adminLogDuration" className="block text-sm font-medium text-navy">
            Session length
          </label>
          <select
            id="adminLogDuration"
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
        <label htmlFor="adminLogNotes" className="block text-sm font-medium text-navy">
          Notes for this lesson (optional)
        </label>
        <textarea
          id="adminLogNotes"
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
        client&apos;s {formatLevel(level)} tokens and pays the tutor
        immediately.
      </p>
    </form>
  );
}
