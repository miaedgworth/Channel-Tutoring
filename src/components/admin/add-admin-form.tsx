"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminCreateAdmin } from "@/lib/actions/admin-users";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function AddAdminForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminCreateAdmin({ name, email });
      if (result.error) {
        setError(result.error);
        return;
      }
      setName("");
      setEmail("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="adminName" className="block text-sm font-medium text-navy">
            Name
          </label>
          <input
            id="adminName"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-navy">
            Email address
          </label>
          <input
            id="adminEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Adding..." : "Add Admin"}
      </Button>
      <p className="text-xs text-navy/40">
        If this email already has a Channel Tutoring account, it&apos;s
        upgraded to admin. Otherwise a new account is created and they&apos;re
        emailed a link to set their password.
      </p>
    </form>
  );
}
