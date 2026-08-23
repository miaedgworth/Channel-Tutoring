"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBJECTS, EXAM_BOARDS, LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const selectClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark bg-white";

export function TutorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "");
  const [examBoard, setExamBoard] = useState(searchParams.get("examBoard") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "rating");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (level) params.set("level", level);
    if (examBoard) params.set("examBoard", examBoard);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort && sort !== "rating") params.set("sort", sort);
    router.push(`/find-a-tutor${params.toString() ? `?${params}` : ""}`);
  }

  function handleReset() {
    setSubject("");
    setLevel("");
    setExamBoard("");
    setMaxPrice("");
    setSort("rating");
    router.push("/find-a-tutor");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <label htmlFor="examBoard" className="block text-xs font-medium text-navy/70">
            Exam board
          </label>
          <select
            id="examBoard"
            value={examBoard}
            onChange={(e) => setExamBoard(e.target.value)}
            className={selectClass}
          >
            <option value="">Any exam board</option>
            {EXAM_BOARDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-xs font-medium text-navy/70">
            Max price (£/hr)
          </label>
          <input
            id="maxPrice"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={selectClass}
            placeholder="Any"
          />
        </div>

        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-navy/70">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={selectClass}
          >
            <option value="rating">Highest rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
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
