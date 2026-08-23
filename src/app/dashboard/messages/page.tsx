import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOrCreateConversation } from "@/lib/actions/messages";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ClientMessagesPage({
  searchParams,
}: PageProps<"/dashboard/messages">) {
  const { tutor } = await searchParams;

  if (typeof tutor === "string" && tutor) {
    const conversationId = await getOrCreateConversation(tutor);
    redirect(`/dashboard/messages/${conversationId}`);
  }

  return (
    <div className="flex h-[32rem] items-center justify-center">
      <p className="text-sm text-navy/40">
        Select a conversation, or message a tutor from their profile.
      </p>
    </div>
  );
}
