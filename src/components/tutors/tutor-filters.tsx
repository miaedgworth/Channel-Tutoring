"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBJECTS, LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const selectClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark bg-white";

export function TutorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "");
  const [sessionMode, setSessionMode] = useState(searchParams.get("sessionMode") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (level) params.set("level", level);
    if (sessionMode) params.set("sessionMode", sessionMode);
    router.push(`/find-a-tutor${params.toString() ? `?${params}` : ""}`);
  }

  function handleReset() {
    setSubject("");
    setLevel("");
    setSessionMode("");
    router.push("/find-a-tutor");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="subject" className="block text-xs font-medium text-navy/70">
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={selectClass}
          >
            <option value="">Any subject</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="level" className="block text-xs font-medium text-navy/70">
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={selectClass}
          >
            <option value="">Any level</option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sessionMode" className="block text-xs font-medium text-navy/70">
            Online or in person
          </label>
          <select
            id="sessionMode"
            value={sessionMode}
            onChange={(e) => setSessionMode(e.target.value)}
            className={selectClass}
          >
            <option value="">Either</option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In person</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="submit" variant="primary" size="sm">
          Search
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          Clear filters
        </Button>
      </div>
    </form>
  );
}
