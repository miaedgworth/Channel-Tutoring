"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { region } from "@/lib/region";

export function DbsCheckUpload({
  tutorProfileId,
  fileName,
  uploadedAt,
}: {
  tutorProfileId: string;
  fileName: string | null;
  uploadedAt: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/tutor-dashboard/dbs-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-2 text-sm text-red">
          {error}
        </p>
      )}
      {fileName ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-navy/80">
            Uploaded: <strong>{fileName}</strong>
            {uploadedAt
              ? ` on ${new Date(uploadedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : null}
          </span>
          <a
            href={`/api/tutor-dashboard/dbs/${tutorProfileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-navy underline"
          >
            View
          </a>
        </div>
      ) : (
        <p className="text-sm text-navy/60">No {region.criminalRecordCheckLabel} uploaded yet.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading..." : fileName ? "Replace file" : `Upload ${region.criminalRecordCheckLabel}`}
      </Button>
    </div>
  );
}
