"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatTime, formatDate } from "@/lib/utils";
import { sendMessage, markConversationRead } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";

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
  }[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      try {
        await sendMessage(conversationId, trimmed);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
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
                  <p className="whitespace-pre-wrap">{m.body}</p>
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
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
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
