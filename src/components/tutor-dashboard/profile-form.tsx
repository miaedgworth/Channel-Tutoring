"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS, LEVELS, DBS_STATUS_LABELS, TUTOR_PAYOUT_PENCE } from "@/lib/constants";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { updateTutorProfile } from "@/lib/actions/tutor-profile";
import { formatCurrencyGBP } from "@/lib/utils";
import type { DbsStatus } from "@prisma/client";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function TutorProfileForm({
  profile,
}: {
  profile: {
    headline: string;
    bio: string;
    photoUrl: string | null;
    subjects: string[];
    levels: string[];
    qualifications: string;
    sessionMode: string;
    isPublished: boolean;
    dbsStatus: DbsStatus;
    slug: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? "");
  const [subjects, setSubjects] = useState<string[]>(profile.subjects);
  const [levels, setLevels] = useState<string[]>(profile.levels);
  const [qualifications, setQualifications] = useState(profile.qualifications);
  const [sessionMode, setSessionMode] = useState(profile.sessionMode);
  const [isPublished, setIsPublished] = useState(profile.isPublished);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updateTutorProfile({
          headline,
          bio,
          photoUrl,
          subjects,
          levels: levels as ("KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS")[],
          qualifications,
          sessionMode: sessionMode as "ONLINE" | "IN_PERSON" | "BOTH",
          isPublished,
        });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Profile saved.
        </p>
      )}

      <div className="flex items-center gap-3 rounded-md border border-navy/10 bg-navy/[0.02] p-4">
        <span className="text-sm text-navy/70">DBS check status:</span>
        <Badge variant={profile.dbsStatus === "VERIFIED" ? "success" : "warning"}>
          {DBS_STATUS_LABELS[profile.dbsStatus]}
        </Badge>
        {profile.dbsStatus !== "VERIFIED" && (
          <span className="text-xs text-navy/50">
            Your profile can&apos;t go live until this is verified — contact us at info@channeltutoring.com.
          </span>
        )}
      </div>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Profile basics
        </h2>
        <div>
          <label htmlFor="headline" className="block text-sm font-medium text-navy">
            Headline
          </label>
          <input
            id="headline"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputClass}
            placeholder="e.g. Experienced GCSE & A-Level Maths Tutor"
          />
        </div>
        <PhotoUpload value={photoUrl} onChange={setPhotoUrl} label="Photo (optional)" />
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-navy">
            Bio
          </label>
          <textarea
            id="bio"
            required
            rows={6}
            minLength={50}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          What you teach
        </h2>
        <div>
          <p className="text-sm font-medium text-navy">Levels</p>
          <div className="mt-2">
            <CheckboxGroup options={LEVELS} values={levels} onChange={setLevels} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-navy">Subjects</p>
          <div className="mt-2">
            <CheckboxGroup options={SUBJECTS} values={subjects} onChange={setSubjects} columns={3} />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Experience
        </h2>
        <div className="rounded-md border border-navy/10 bg-navy/[0.02] p-4 text-sm text-navy/70">
          <p>
            Session prices are fixed by Channel Tutoring and the same for
            every tutor. You&apos;re paid:
          </p>
          <ul className="mt-2 space-y-1">
            {LEVELS.map((l) => (
              <li key={l.value} className="flex items-center justify-between">
                <span>{l.label}</span>
                <span className="font-semibold text-navy">
                  {formatCurrencyGBP(TUTOR_PAYOUT_PENCE[l.value])}/hour
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label htmlFor="qualifications" className="block text-sm font-medium text-navy">
            Qualifications
          </label>
          <textarea
            id="qualifications"
            required
            rows={3}
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="sessionMode" className="block text-sm font-medium text-navy">
            Do you offer sessions online, in person, or both?
          </label>
          <select
            id="sessionMode"
            value={sessionMode}
            onChange={(e) => setSessionMode(e.target.value)}
            className={inputClass}
          >
            <option value="BOTH">Online or in person</option>
            <option value="ONLINE">Online only</option>
            <option value="IN_PERSON">In person only</option>
          </select>
        </div>
      </section>

      <section className="rounded-md border border-navy/10 bg-navy/[0.02] p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
          />
          <span className="text-sm text-navy">
            <span className="font-medium">Publish my profile</span>
            <br />
            <span className="text-navy/60">
              Make my profile visible to clients on Find a Tutor. You can
              unpublish at any time.
            </span>
          </span>
        </label>
      </section>

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
