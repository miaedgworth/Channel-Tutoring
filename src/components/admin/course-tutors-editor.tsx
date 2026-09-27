"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateCourseTutors } from "@/lib/actions/courses";

interface TutorOption {
  id: string;
  name: string;
  headline: string;
}

export function CourseTutorsEditor({
  courseId,
  allTutors,
  selectedTutorIds,
}: {
  courseId: string;
  allTutors: TutorOption[];
  selectedTutorIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedTutorIds);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(tutorId: string) {
    setSaved(false);
    setSelected((prev) =>
      prev.includes(tutorId) ? prev.filter((id) => id !== tutorId) : [...prev, tutorId],
    );
  }

  async function handleSave() {
    setError(null);
    setIsPending(true);
    const result = await updateCourseTutors(courseId, selected);
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  if (allTutors.length === 0) {
    return (
      <p className="text-sm text-navy/50">
        No published tutor profiles yet — publish a tutor first, then come back here to assign
        them.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red">{error}</p>}
      <div className="space-y-2">
        {allTutors.map((tutor) => (
          <label
            key={tutor.id}
            className="flex items-center gap-3 rounded-lg border border-navy/10 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(tutor.id)}
              onChange={() => toggle(tutor.id)}
            />
            <span>
              <span className="font-medium text-navy">{tutor.name}</span>{" "}
              <span className="text-navy/50">— {tutor.headline}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? "Saving..." : "Save tutors"}
        </Button>
        {saved && <span className="text-xs text-navy/50">Saved.</span>}
      </div>
    </div>
  );
}
