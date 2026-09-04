"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminScheduleSessionForm } from "@/components/admin/admin-schedule-session-form";
import { AdminLogLessonForm } from "@/components/admin/admin-log-lesson-form";

const TABS = [
  { key: "schedule", label: "Schedule an upcoming session" },
  { key: "log", label: "Log a past lesson" },
] as const;

type Tutor = {
  id: string;
  subjects: string[];
  levels: string[];
  sessionMode: string;
  user: { name: string };
};

export function AdminNewSessionTabs({
  clients,
  tutors,
}: {
  clients: { id: string; name: string; email: string }[];
  tutors: Tutor[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("schedule");

  return (
    <div>
      <div className="flex gap-2 border-b border-navy/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-navy text-navy"
                : "border-transparent text-navy/50 hover:text-navy",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "schedule" ? (
          <>
            <p className="mb-6 text-sm text-navy/60">
              Manually arrange a session in advance — for example when a
              client paid off-platform. This reserves the client&apos;s
              tokens straight away and shows the session as upcoming on both
              dashboards.
            </p>
            <AdminScheduleSessionForm clients={clients} tutors={tutors} />
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-navy/60">
              Record a session that&apos;s already taken place — for example
              one taught before the client or tutor was on the platform. This
              redeems the client&apos;s token and pays the tutor immediately.
            </p>
            <AdminLogLessonForm clients={clients} tutors={tutors} />
          </>
        )}
      </div>
    </div>
  );
}
