"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  createCourseTestimonial,
  updateCourseTestimonial,
  deleteCourseTestimonial,
} from "@/lib/actions/course-testimonials";
import { formatDate } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

interface CourseOption {
  id: string;
  title: string;
}

interface Testimonial {
  id: string;
  studentName: string;
  quote: string;
  rating: number | null;
  courseId: string | null;
  createdAt: string;
}

function TestimonialFields({
  studentName,
  setStudentName,
  quote,
  setQuote,
  rating,
  setRating,
  courseId,
  setCourseId,
  courses,
}: {
  studentName: string;
  setStudentName: (v: string) => void;
  quote: string;
  setQuote: (v: string) => void;
  rating: string;
  setRating: (v: string) => void;
  courseId: string;
  setCourseId: (v: string) => void;
  courses: CourseOption[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input
        required
        placeholder="Student/parent name, e.g. Jamie's mum"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        className={inputClass}
      />
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
        <option value="">General (not tied to a course)</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <textarea
        required
        rows={3}
        placeholder="What they said"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        className={`${inputClass} sm:col-span-2`}
      />
      <select value={rating} onChange={(e) => setRating(e.target.value)} className={inputClass}>
        <option value="">No rating</option>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} star{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function EditTestimonialRow({
  testimonial,
  courses,
  onDone,
}: {
  testimonial: Testimonial;
  courses: CourseOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [studentName, setStudentName] = useState(testimonial.studentName);
  const [quote, setQuote] = useState(testimonial.quote);
  const [rating, setRating] = useState(testimonial.rating != null ? String(testimonial.rating) : "");
  const [courseId, setCourseId] = useState(testimonial.courseId ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCourseTestimonial(testimonial.id, {
        studentName,
        quote,
        rating,
        courseId,
      });
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
      <TestimonialFields
        studentName={studentName}
        setStudentName={setStudentName}
        quote={quote}
        setQuote={setQuote}
        rating={rating}
        setRating={setRating}
        courseId={courseId}
        setCourseId={setCourseId}
        courses={courses}
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

export function TestimonialsManager({
  testimonials,
  courses,
}: {
  testimonials: Testimonial[];
  courses: CourseOption[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [studentName, setStudentName] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCourseTestimonial({ studentName, quote, rating, courseId });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStudentName("");
      setQuote("");
      setRating("");
      setCourseId("");
      setAdding(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    startTransition(async () => {
      await deleteCourseTestimonial(id);
      router.refresh();
    });
  }

  const courseTitleById = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div>
      {testimonials.length === 0 ? (
        <p className="text-sm text-navy/50">No testimonials added yet.</p>
      ) : (
        <div className="space-y-2">
          {testimonials.map((t) =>
            editingId === t.id ? (
              <EditTestimonialRow
                key={t.id}
                testimonial={t}
                courses={courses}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div key={t.id} className="rounded-lg border border-navy/10 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy">
                      {t.studentName}
                      {t.rating != null && (
                        <span className="ml-2 text-gold-dark">{"★".repeat(t.rating)}</span>
                      )}
                    </p>
                    <p className="mt-1 text-navy/70">&ldquo;{t.quote}&rdquo;</p>
                    <p className="mt-1 text-xs text-navy/40">
                      {t.courseId ? courseTitleById.get(t.courseId) ?? "Course removed" : "General"} ·{" "}
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      className="text-xs font-medium text-navy underline"
                      onClick={() => setEditingId(t.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-red underline"
                      disabled={isPending}
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="mt-4 rounded-lg border border-navy/10 p-3">
          {error && <p className="mb-2 text-sm text-red">{error}</p>}
          <TestimonialFields
            studentName={studentName}
            setStudentName={setStudentName}
            quote={quote}
            setQuote={setQuote}
            rating={rating}
            setRating={setRating}
            courseId={courseId}
            setCourseId={setCourseId}
            courses={courses}
          />
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding..." : "Add testimonial"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => setAdding(true)}>
          Add a testimonial
        </Button>
      )}
    </div>
  );
}
