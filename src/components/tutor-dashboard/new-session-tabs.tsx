"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScheduleSessionForm } from "@/components/tutor-dashboard/schedule-session-form";
import { ScheduleLessonForm } from "@/components/tutor-dashboard/schedule-lesson-form";

const TABS = [
  { key: "schedule", label: "Schedule an upcoming session" },
  { key: "log", label: "Log a past lesson" },
] as const;

export function NewSessionTabs({
  clients,
  subjects,
  levels,
  sessionMode,
  preselectedClientId,
}: {
  clients: { id: string; name: string }[];
  subjects: string[];
  levels: string[];
  sessionMode: string;
  preselectedClientId?: string;
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
              Arrange a session in advance for a specific date and time. The
              client&apos;s tokens are reserved straight away and it appears
              as an upcoming session on their dashboard. Mark it as complete
              afterwards to get paid.
            </p>
            <ScheduleSessionForm
              clients={clients}
              subjects={subjects}
              levels={levels}
              sessionMode={sessionMode}
              preselectedClientId={preselectedClientId}
            />
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-navy/60">
              Already taught a session you didn&apos;t schedule in advance?
              Log it here to redeem the client&apos;s token and get paid
              straight away.
            </p>
            <ScheduleLessonForm
              clients={clients}
              subjects={subjects}
              levels={levels}
              sessionMode={sessionMode}
              preselectedClientId={preselectedClientId}
            />
          </>
        )}
      </div>
    </div>
  );
}
