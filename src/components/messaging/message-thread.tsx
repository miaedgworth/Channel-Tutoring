"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatTime, formatDate } from "@/lib/utils";
import { sendMessage, markConversationRead } from "@/lib/actions/messages";
import { MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_ATTACHMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageThread({
  conversationId,
  currentUserId,
  otherPartyName,
  messages,
  readOnly = false,
}: {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  messages: {
    id: string;
    senderId: string;
    body: string;
    createdAt: Date;
    flagged: boolean;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
    attachmentSizeBytes?: number | null;
  }[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (readOnly) return;
    markConversationRead(conversationId).catch(() => {});
  }, [conversationId, readOnly]);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  async function handleFileSelect(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setError("That file is too large (max 15MB).");
      return;
    }
    if (!(ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(file.type)) {
      setError("That file type isn't supported. Try an image, PDF, Word, Excel or PowerPoint file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);
      const res = await fetch("/api/messages/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      const result = await sendMessage(conversationId, body.trim(), {
        url: data.url,
        name: data.name,
        type: data.type,
        sizeBytes: data.sizeBytes,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const messagesWithDividers = messages.map((m, i) => {
    const dateLabel = formatDate(m.createdAt);
    const prevDateLabel = i > 0 ? formatDate(messages[i - 1].createdAt) : null;
    return { ...m, dateLabel, showDateDivider: dateLabel !== prevDateLabel };
  });

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="border-b border-navy/10 px-4 py-3">
        <p className="font-heading font-semibold text-navy">{otherPartyName}</p>
        {readOnly && (
          <p className="text-xs text-navy/40">Admin oversight view — read only</p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-navy/40">
            No messages yet. Say hello!
          </p>
        )}
        {messagesWithDividers.map((m) => {
          const isMine = m.senderId === currentUserId;
          const isImage = m.attachmentType?.startsWith("image/");
          return (
            <div key={m.id}>
              {m.showDateDivider && (
                <p className="my-3 text-center text-xs text-navy/30">{m.dateLabel}</p>
              )}
              <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-navy text-white"
                      : "bg-navy/5 text-navy"
                  }`}
                >
                  {m.attachmentUrl && isImage && (
                    <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.attachmentUrl}
                        alt={m.attachmentName ?? "Attachment"}
                        className="mb-1.5 max-h-48 rounded-md object-cover"
                      />
                    </a>
                  )}
                  {m.attachmentUrl && !isImage && (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mb-1.5 flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs font-medium ${
                        isMine
                          ? "border-white/20 hover:bg-white/10"
                          : "border-navy/15 hover:bg-navy/5"
                      }`}
                    >
                      <span aria-hidden="true">📎</span>
                      <span className="truncate">{m.attachmentName}</span>
                      {typeof m.attachmentSizeBytes === "number" && (
                        <span className={isMine ? "text-white/50" : "text-navy/40"}>
                          {formatFileSize(m.attachmentSizeBytes)}
                        </span>
                      )}
                    </a>
                  )}
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  <p
                    className={`mt-1 text-[10px] ${isMine ? "text-white/50" : "text-navy/40"}`}
                  >
                    {formatTime(m.createdAt)}
                    {m.flagged && " · flagged for review"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <form onSubmit={handleSubmit} className="border-t border-navy/10 p-3">
          {error && <p className="mb-2 text-xs text-red">{error}</p>}
          <div className="flex gap-2">
            <label htmlFor="message-body" className="sr-only">
              Message
            </label>
            <textarea
              id="message-body"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isPending}
              onClick={() => fileInputRef.current?.click()}
              title="Attach a file"
            >
              {isUploading ? "..." : "📎"}
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isPending || isUploading}>
              Send
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-navy/40">
            For everyone&apos;s safety, please keep contact details and
            arrangements within Channel Tutoring — messages are monitored.
          </p>
        </form>
      )}
    </div>
  );
}
