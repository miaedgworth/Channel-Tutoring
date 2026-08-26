import type { Metadata } from "next";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Resources" };
export const dynamic = "force-dynamic";

function ResourceCard({
  title,
  description,
  loginUrl,
  loginLabel,
  username,
  password,
}: {
  title: string;
  description: string;
  loginUrl: string;
  loginLabel: string;
  username?: string;
  password?: string;
}) {
  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">{title}</h2>
        <p className="mt-2 text-sm text-navy/70">{description}</p>

        {username && password ? (
          <div className="mt-4 space-y-2 rounded-md bg-navy/[0.03] px-4 py-3 text-sm">
            <p className="text-navy/70">
              Use the shared Channel Tutoring account below to log in:
            </p>
            <p className="text-navy">
              <span className="text-navy/50">Username:</span>{" "}
              <span className="font-mono font-medium">{username}</span>
            </p>
            <p className="text-navy">
              <span className="text-navy/50">Password:</span>{" "}
              <span className="font-mono font-medium">{password}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-navy/[0.03] px-4 py-3 text-sm text-navy/50">
            Login details aren&apos;t set up yet — check back soon.
          </p>
        )}

        <a
          href={loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          {loginLabel}
        </a>

        <p className="mt-3 text-xs text-navy/40">
          This is a shared account for Channel Tutoring tutors — please
          don&apos;t share these details outside the platform.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function TutorResourcesPage() {
  await requireUser("TUTOR");

  const username = process.env.SAVE_MY_EXAMS_USERNAME;
  const password = process.env.SAVE_MY_EXAMS_PASSWORD;

  return (
    <div className="space-y-6">
      <ResourceCard
        title="Save My Exams"
        description="Save My Exams provides revision notes, past papers and exam-style questions with mark schemes and flashcards, across GCSE, IGCSE, A-Level, AS-Level and IB, covering all the major exam boards. Useful for planning lessons, setting practice questions, and marking against real mark schemes."
        loginUrl="https://www.savemyexams.com/login/"
        loginLabel="Log in to Save My Exams"
        username={username}
        password={password}
      />

      <ResourceCard
        title="Tripos"
        description="Tripos is an AI-powered study platform that marks exam papers against real mark schemes and generates homework and practice questions automatically. Useful for quickly setting and marking extra practice between sessions."
        loginUrl="https://www.tripos.org.uk/login"
        loginLabel="Log in to Tripos"
        username={username}
        password={password}
      />
    </div>
  );
}
