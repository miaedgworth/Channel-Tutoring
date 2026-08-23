import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

export default function TutorMessagesPage() {
  return (
    <div className="flex h-[32rem] items-center justify-center">
      <p className="text-sm text-navy/40">
        Select a conversation to view messages from your clients.
      </p>
    </div>
  );
}
