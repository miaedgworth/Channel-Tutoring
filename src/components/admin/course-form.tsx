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
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [status, setStatus] = useState<CourseStatus>(course?.status ?? "UPCOMING");
  const [startDate, setStartDate] = useState(toDateInputValue(course?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(course?.endDate));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = { title, description, status, startDate, endDate };
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
