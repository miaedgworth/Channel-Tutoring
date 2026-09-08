"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestAgreementResign } from "@/lib/actions/tutor-agreement";

export function PromptAgreementResignButton({ tutorProfileId }: { tutorProfileId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Prompt this tutor to (re-)sign the Tutor Agreement next time they log in?")) {
      return;
    }
    startTransition(async () => {
      const result = await requestAgreementResign(tutorProfileId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? "..." : "Prompt to sign"}
    </Button>
  );
}
