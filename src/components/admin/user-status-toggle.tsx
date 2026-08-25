"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setUserStatus } from "@/lib/actions/admin-users";
import type { UserStatus } from "@prisma/client";

export function UserStatusToggle({
  userId,
  status,
}: {
  userId: string;
  status: UserStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await setUserStatus(userId, status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      variant={status === "ACTIVE" ? "danger" : "primary"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "..." : status === "ACTIVE" ? "Suspend" : "Reactivate"}
    </Button>
  );
}
