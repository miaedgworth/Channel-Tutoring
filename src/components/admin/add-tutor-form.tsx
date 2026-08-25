"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SUBJECTS, LEVELS } from "@/lib/constants";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Button } from "@/components/ui/button";
import { adminCreateTutor } from "@/lib/actions/tutor-applications";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function AddTutorForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [sessionMode, setSessionMode] = useState("BOTH");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminCreateTutor({
        name,
        email,
        phone,
        headline,
        bio,
        subjects,
        levels: levels as ("KS3" | "GCSE" | "A_LEVEL" | "UNIVERSITY_ADMISSIONS")[],
        qualifications,
        sessionMode: sessionMode as "ONLINE" | "IN_PERSON" | "BOTH",
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/tutors/${result.slug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-navy">
            Phone (optional)
          </label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
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
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-navy">
          Bio
        </label>
        <textarea
          id="bio"
          required
          rows={5}
          minLength={50}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputClass}
        />
      </div>

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
          Session mode
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

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Creating..." : "Create Tutor"}
      </Button>
      <p className="text-xs text-navy/40">
        The tutor will be emailed a link to set their password. Their profile
        starts unpublished until they (or you) publish it.
      </p>
    </form>
  );
}
