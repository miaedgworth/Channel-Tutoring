"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markCourseBalancePaidManually } from "@/lib/actions/courses";

export function MarkCourseBalancePaidButton({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Mark this booking's balance as paid manually (e.g. paid by bank transfer)?")) return;
    setError(null);
    startTransition(async () => {
      const result = await markCourseBalancePaidManually(enrollmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && <p className="text-xs text-red">{error}</p>}
      <Button size="sm" variant="outline" disabled={isPending} onClick={handleClick}>
        {isPending ? "Marking..." : "Mark balance paid"}
      </Button>
    </div>
  );
}
