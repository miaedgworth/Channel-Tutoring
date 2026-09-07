"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EXAM_BOARDS, SESSION_DURATION_OPTIONS_MINUTES, formatSessionDuration } from "@/lib/constants";
import { formatLevel, formatTokenQuantity, toLocalDateInputValue, londonWallTimeToUtc } from "@/lib/utils";
import { adminScheduleSession } from "@/lib/actions/admin-bookings";

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

export function AdminScheduleSessionForm({
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
  const [time, setTime] = useState("16:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(8);
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
    if (!date || !time) {
      setError("Choose the date and time of the session.");
      return;
    }
    const startsAt = londonWallTimeToUtc(date, time);
    if (startsAt.getTime() <= Date.now()) {
      setError("Choose a date and time in the future.");
      return;
    }
    startTransition(async () => {
      const result = await adminScheduleSession({
        clientId,
        tutorProfileId,
        subject,
        level: level as "KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS",
        examBoard,
        sessionMode: sessionMode as "ONLINE" | "IN_PERSON",
        date: startsAt,
        durationMinutes,
        notes,
        repeatWeeks: repeatWeekly ? repeatWeeks : 1,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/bookings");
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
          <label htmlFor="adminScheduleClient" className="block text-sm font-medium text-navy">
            Client
          </label>
          <select
            id="adminScheduleClient"
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
          <label htmlFor="adminScheduleTutor" className="block text-sm font-medium text-navy">
            Tutor
          </label>
          <select
            id="adminScheduleTutor"
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
          <label htmlFor="adminScheduleSubject" className="block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="adminScheduleSubject"
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
          <label htmlFor="adminScheduleLevel" className="block text-sm font-medium text-navy">
            Level
          </label>
          <select
            id="adminScheduleLevel"
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
          <label htmlFor="adminScheduleSessionMode" className="block text-sm font-medium text-navy">
            Session mode
          </label>
          <select
            id="adminScheduleSessionMode"
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
        <label htmlFor="adminScheduleExamBoard" className="block text-sm font-medium text-navy">
          Exam board (optional)
        </label>
        <select
          id="adminScheduleExamBoard"
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
          <label htmlFor="adminScheduleDate" className="block text-sm font-medium text-navy">
            Date
          </label>
          <input
            id="adminScheduleDate"
            type="date"
            min={todayDateValue()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adminScheduleTime" className="block text-sm font-medium text-navy">
            Time
          </label>
          <input
            id="adminScheduleTime"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adminScheduleDuration" className="block text-sm font-medium text-navy">
            Session length
          </label>
          <select
            id="adminScheduleDuration"
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
        <label htmlFor="adminScheduleNotes" className="block text-sm font-medium text-navy">
          Notes for this session (optional)
        </label>
        <textarea
          id="adminScheduleNotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="rounded-lg border border-navy/10 p-4">
        <label className="flex items-center gap-2.5 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={repeatWeekly}
            onChange={(e) => setRepeatWeekly(e.target.checked)}
            className="h-4 w-4 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
          />
          Repeat weekly, same day and time
        </label>
        {repeatWeekly && (
          <div className="mt-3">
            <label htmlFor="adminScheduleRepeatWeeks" className="block text-sm font-medium text-navy">
              For how many weeks?
            </label>
            <input
              id="adminScheduleRepeatWeeks"
              type="number"
              min={2}
              max={52}
              value={repeatWeeks}
              onChange={(e) => setRepeatWeeks(Number(e.target.value))}
              className={`${inputClass} max-w-[8rem]`}
            />
            <p className="mt-1.5 text-xs text-navy/40">
              The client doesn&apos;t need enough tokens for every week up
              front — each week&apos;s token is reserved as soon as they
              have one, and they&apos;ll get a reminder if a session&apos;s
              date arrives still unpaid.
            </p>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Scheduling..." : repeatWeekly ? "Schedule Weekly Sessions" : "Schedule Session"}
      </Button>
      <p className="text-xs text-navy/40">
        {repeatWeekly
          ? `This schedules ${repeatWeeks} weekly sessions, reserving the client's ${formatLevel(level)} token as it's available. The tutor is paid once they mark each one as complete.`
          : `This reserves ${formatTokenQuantity(durationMinutes / 60)} of the client's ${formatLevel(level)} tokens now. The tutor is paid once they mark the session as complete.`}
      </p>
    </form>
  );
}
