"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCourse, updateCourse, deleteCourse } from "@/lib/actions/courses";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

type CourseStatus = "UPCOMING" | "PAST";

function toDateInputValue(date: string | null | undefined) {
  if (!date) return "";
  return date.slice(0, 10);
}

export function CourseForm({
  course,
}: {
  course?: {
    id: string;
    title: string;
    description: string;
    status: CourseStatus;
    startDate: string | null;
    endDate: string | null;
    venue: string | null;
    timeLabel: string | null;
    bundlePricePence: number | null;
    bundleLabel: string | null;
    depositPercent: number | null;
    balanceDueDate: string | null;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [status, setStatus] = useState<CourseStatus>(course?.status ?? "UPCOMING");
  const [startDate, setStartDate] = useState(toDateInputValue(course?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(course?.endDate));
  const [venue, setVenue] = useState(course?.venue ?? "");
  const [timeLabel, setTimeLabel] = useState(course?.timeLabel ?? "");
  const [bundlePricePence, setBundlePricePence] = useState(
    course?.bundlePricePence != null ? String(course.bundlePricePence) : "",
  );
  const [bundleLabel, setBundleLabel] = useState(course?.bundleLabel ?? "");
  const [depositPercent, setDepositPercent] = useState(
    course?.depositPercent != null ? String(course.depositPercent) : "",
  );
  const [balanceDueDate, setBalanceDueDate] = useState(toDateInputValue(course?.balanceDueDate));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = {
        title,
        description,
        status,
        startDate,
        endDate,
        venue,
        timeLabel,
        bundlePricePence,
        bundleLabel,
        depositPercent,
        balanceDueDate,
      };
      const result = course ? await updateCourse(course.id, input) : await createCourse(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (course) router.refresh();
    });
  }

  function handleDelete() {
    if (!course) return;
    if (!confirm("Delete this course? This can't be undone.")) return;
    startTransition(async () => {
      await deleteCourse(course.id);
      router.push("/admin/courses");
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
        <label htmlFor="title" className="block text-sm font-medium text-navy">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="e.g. October Half Term Course"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-navy">
          Description
        </label>
        <textarea
          id="description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-navy">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus)}
            className={inputClass}
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="PAST">Past</option>
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-navy">
            Start date (optional)
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-navy">
            End date (optional)
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-navy/50">
        Leave dates blank while they&apos;re still to be confirmed.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-navy">
            Venue (optional)
          </label>
          <input
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={inputClass}
            placeholder="e.g. Elizabeth College"
          />
        </div>
        <div>
          <label htmlFor="timeLabel" className="block text-sm font-medium text-navy">
            Daily time (optional)
          </label>
          <input
            id="timeLabel"
            value={timeLabel}
            onChange={(e) => setTimeLabel(e.target.value)}
            className={inputClass}
            placeholder="e.g. 9am – 3pm each day"
          />
        </div>
      </div>

      <div className="rounded-lg border border-navy/10 p-4">
        <p className="text-sm font-medium text-navy">Paid booking (optional)</p>
        <p className="mt-1 text-xs text-navy/50">
          Add days below to turn this into a paid booking with a deposit
          and balance, instead of a plain &ldquo;register interest&rdquo;
          course. Leave these blank for a lead-capture-only course.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="depositPercent" className="block text-sm font-medium text-navy">
              Deposit % (optional)
            </label>
            <input
              id="depositPercent"
              value={depositPercent}
              onChange={(e) => setDepositPercent(e.target.value)}
              className={inputClass}
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <label htmlFor="balanceDueDate" className="block text-sm font-medium text-navy">
              Balance due date (optional)
            </label>
            <input
              id="balanceDueDate"
              type="date"
              value={balanceDueDate}
              onChange={(e) => setBalanceDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bundlePricePence" className="block text-sm font-medium text-navy">
              Bundle price in pence (optional)
            </label>
            <input
              id="bundlePricePence"
              value={bundlePricePence}
              onChange={(e) => setBundlePricePence(e.target.value)}
              className={inputClass}
              placeholder="e.g. 30000 for £300"
            />
          </div>
          <div>
            <label htmlFor="bundleLabel" className="block text-sm font-medium text-navy">
              Bundle label (optional)
            </label>
            <input
              id="bundleLabel"
              value={bundleLabel}
              onChange={(e) => setBundleLabel(e.target.value)}
              className={inputClass}
              placeholder="e.g. All 3 Sciences + 1 Maths (4 days)"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-navy/50">
          The bundle applies once a booking covers every &ldquo;Science&rdquo;
          day plus at least one &ldquo;Maths&rdquo; day — set each day&apos;s
          track when adding it below.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : course ? "Save Changes" : "Create Course"}
        </Button>
        {course && (
          <Button type="button" variant="danger" disabled={isPending} onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
