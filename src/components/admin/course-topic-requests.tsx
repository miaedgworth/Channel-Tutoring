"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCourseTopicRequest, deleteCourseTopicRequest } from "@/lib/actions/courses";
import { formatDate } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

interface Day {
  id: string;
  label: string;
}

interface TopicRequest {
  id: string;
  dayId: string;
  dayLabel: string;
  topic: string;
  requestedBy: string;
  createdAt: string;
}

export function CourseTopicRequests({
  days,
  topicRequests,
}: {
  days: Day[];
  topicRequests: TopicRequest[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const result = await createCourseTopicRequest({ dayId, topic, requestedBy });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTopic("");
    setRequestedBy("");
    setAdding(false);
    router.refresh();
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this topic?")) return;
    startDelete(id);
  }

  async function startDelete(id: string) {
    await deleteCourseTopicRequest(id);
    router.refresh();
  }

  return (
    <div>
      {topicRequests.length === 0 ? (
        <p className="text-sm text-navy/50">No topics logged yet.</p>
      ) : (
        <div className="space-y-2">
          {topicRequests.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-navy/10 p-3 text-sm"
            >
              <div>
                <span className="inline-flex items-center rounded-full bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy/70">
                  {t.dayLabel}
                </span>
                <p className="mt-1.5 text-navy">{t.topic}</p>
                <p className="mt-1 text-xs text-navy/50">
                  From {t.requestedBy} &middot; {formatDate(t.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-red underline"
                onClick={() => handleDelete(t.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="mt-4 rounded-lg border border-navy/10 p-3">
          {error && <p className="mb-2 text-sm text-red">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="topicDay" className="block text-sm font-medium text-navy">
                Subject
              </label>
              <select
                id="topicDay"
                value={dayId}
                onChange={(e) => setDayId(e.target.value)}
                className={inputClass}
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="topicRequestedBy" className="block text-sm font-medium text-navy">
                Who told you this
              </label>
              <input
                id="topicRequestedBy"
                required
                placeholder="e.g. Alex Steele (parent, phone call)"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="topicText" className="block text-sm font-medium text-navy">
              Topic
            </label>
            <textarea
              id="topicText"
              required
              rows={2}
              placeholder="e.g. Trigonometry — SOHCAHTOA and bearings"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Adding..." : "Add topic"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          disabled={days.length === 0}
          onClick={() => setAdding(true)}
        >
          Add a topic
        </Button>
      )}
    </div>
  );
}
