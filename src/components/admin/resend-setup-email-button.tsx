"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendTutorSetupEmail } from "@/lib/actions/admin-users";

export function ResendSetupEmailButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleClick() {
    setSent(false);
    startTransition(async () => {
      const result = await resendTutorSetupEmail(userId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      setSent(true);
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? "Sending..." : sent ? "Sent" : "Resend setup email"}
    </Button>
  );
}
