"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminStartConversation } from "@/lib/actions/admin-messages";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function AdminStartConversationForm({
  clients,
  tutors,
}: {
  clients: { id: string; name: string; email: string }[];
  tutors: { id: string; user: { name: string } }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [tutorProfileId, setTutorProfileId] = useState(tutors[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminStartConversation({ clientId, tutorProfileId, note });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/admin/messages/${result.conversationId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="startConvoClient" className="block text-sm font-medium text-navy">
            Client
          </label>
          <select
            id="startConvoClient"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startConvoTutor" className="block text-sm font-medium text-navy">
            Tutor
          </label>
          <select
            id="startConvoTutor"
            value={tutorProfileId}
            onChange={(e) => setTutorProfileId(e.target.value)}
            className={inputClass}
          >
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="startConvoNote" className="block text-sm font-medium text-navy">
          Note for the tutor (optional)
        </label>
        <textarea
          id="startConvoNote"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          placeholder="e.g. This client enquired by email about GCSE Maths for her son — please get in touch."
        />
        <p className="mt-1.5 text-xs text-navy/40">
          Included in the email the tutor receives. It isn&apos;t sent to
          the client or added to the conversation itself.
        </p>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        {isPending ? "Starting..." : "Start Conversation"}
      </Button>
      <p className="text-xs text-navy/40">
        This opens the conversation and emails the tutor asking them to
        message the client first — the client isn&apos;t notified.
      </p>
    </form>
  );
}
