"use client";

import { useState, useTransition, type FormEvent } from "react";
import { changePassword } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Password updated.
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-navy">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-navy">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}
