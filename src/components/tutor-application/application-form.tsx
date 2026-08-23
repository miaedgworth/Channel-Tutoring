"use client";

import { useState, type FormEvent } from "react";
import { SUBJECTS, LEVELS } from "@/lib/constants";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function TutorApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [dbsStatus, setDbsStatus] = useState("NOT_PROVIDED");
  const [cvUrl, setCvUrl] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [bio, setBio] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/tutor-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        subjects,
        levels,
        yearsExperience,
        qualifications,
        dbsStatus,
        cvUrl,
        referenceUrl,
        bio,
        availabilityNotes,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-heading text-xl font-bold text-navy">
          Application received
        </h2>
        <p className="mt-2 text-sm text-navy/70">
          Thank you for applying to tutor with Channel Tutoring. We&apos;ll
          review your details, including your DBS status and experience, and
          be in touch by email soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Your details
        </h2>
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
              Phone number
            </label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="years" className="block text-sm font-medium text-navy">
              Years of tutoring/teaching experience
            </label>
            <input
              id="years"
              type="number"
              min={0}
              max={60}
              required
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          What can you teach?
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
            <CheckboxGroup
              options={SUBJECTS}
              values={subjects}
              onChange={setSubjects}
              columns={3}
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Qualifications &amp; safeguarding
        </h2>
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
            placeholder="e.g. BSc Mathematics (Bristol), PGCE, QTS"
          />
        </div>
        <div>
          <label htmlFor="dbsStatus" className="block text-sm font-medium text-navy">
            DBS check status
          </label>
          <select
            id="dbsStatus"
            value={dbsStatus}
            onChange={(e) => setDbsStatus(e.target.value)}
            className={inputClass}
          >
            <option value="NOT_PROVIDED">I don&apos;t have one yet</option>
            <option value="PENDING">Application in progress</option>
            <option value="VERIFIED">I have a current DBS certificate</option>
          </select>
          <p className="mt-1 text-xs text-navy/50">
            All tutors working with under-18s must hold a valid DBS check
            before their profile goes live — see our{" "}
            <a href="/legal/safeguarding-policy" className="underline">
              Safeguarding Policy
            </a>
            .
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="cvUrl" className="block text-sm font-medium text-navy">
              Link to your CV (optional)
            </label>
            <input
              id="cvUrl"
              type="url"
              placeholder="https://..."
              value={cvUrl}
              onChange={(e) => setCvUrl(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="referenceUrl" className="block text-sm font-medium text-navy">
              Link to a reference (optional)
            </label>
            <input
              id="referenceUrl"
              type="url"
              placeholder="https://..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-navy/50">
          No file yet? Share a Google Drive/Dropbox link, or email documents
          to info@channeltutoring.com after applying.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Tell us about yourself
        </h2>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-navy">
            Short bio for your public profile
          </label>
          <textarea
            id="bio"
            required
            rows={5}
            minLength={50}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputClass}
            placeholder="Tell parents and students about your teaching style and experience..."
          />
        </div>
        <div>
          <label htmlFor="availabilityNotes" className="block text-sm font-medium text-navy">
            General availability (optional)
          </label>
          <textarea
            id="availabilityNotes"
            rows={2}
            value={availabilityNotes}
            onChange={(e) => setAvailabilityNotes(e.target.value)}
            className={inputClass}
            placeholder="e.g. Weekday evenings and Saturday mornings"
          />
        </div>
      </section>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}
