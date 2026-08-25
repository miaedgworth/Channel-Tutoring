"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setTutorPublished } from "@/lib/actions/admin-users";

export function PublishTutorToggle({
  tutorProfileId,
  isPublished,
}: {
  tutorProfileId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await setTutorPublished(tutorProfileId, !isPublished);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      variant={isPublished ? "outline" : "primary"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "..." : isPublished ? "Unpublish" : "Publish"}
    </Button>
  );
}
