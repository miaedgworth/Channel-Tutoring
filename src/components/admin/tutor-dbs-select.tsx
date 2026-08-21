"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTutorDbsStatus } from "@/lib/actions/admin-users";
import type { DbsStatus } from "@prisma/client";

export function TutorDbsSelect({
  tutorProfileId,
  dbsStatus,
}: {
  tutorProfileId: string;
  dbsStatus: DbsStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      await setTutorDbsStatus(tutorProfileId, value as DbsStatus);
      router.refresh();
    });
  }

  return (
    <select
      value={dbsStatus}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-navy/20 px-2 py-1 text-xs focus:border-gold-dark focus:outline-none"
    >
      <option value="NOT_PROVIDED">Not provided</option>
      <option value="PENDING">Pending</option>
      <option value="VERIFIED">Verified</option>
    </select>
  );
}
