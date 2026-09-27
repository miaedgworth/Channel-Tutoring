"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendTutorCommunicationPolicyReminder } from "@/lib/actions/admin-users";

export function SendTutorPolicyReminderButton({ tutorCount }: { tutorCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        `Email all ${tutorCount} registered tutors a reminder that communication, scheduling and payment must stay on the platform (Tutor Agreement §6)? This sends real emails now.`,
      )
    ) {
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await sendTutorCommunicationPolicyReminder();
      if ("error" in res) {
        setResult(res.error);
        return;
      }
      setResult(`Sent to ${res.sentCount} of ${tutorCount} tutors.`);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Sending..." : "Email all tutors: on-platform reminder"}
      </Button>
      {result && <p className="text-xs text-navy/60">{result}</p>}
    </div>
  );
}
