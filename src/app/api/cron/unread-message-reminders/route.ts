import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, baseEmailLayout } from "@/lib/email";

const HOUR_MS = 60 * 60 * 1000;
const UNREAD_THRESHOLD_MS = 10 * HOUR_MS;
// Don't reach back further than this when the job first runs (or after a
// gap) — an unread message from days ago shouldn't suddenly trigger a
// reminder email out of nowhere.
const MAX_LOOKBACK_MS = 7 * 24 * HOUR_MS;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const unread = await prisma.message.findMany({
    where: {
      readAt: null,
      reminderSentAt: null,
      createdAt: { lte: new Date(now - UNREAD_THRESHOLD_MS), gte: new Date(now - MAX_LOOKBACK_MS) },
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true } },
      conversation: {
        select: {
          id: true,
          clientId: true,
          tutorUserId: true,
          client: { select: { id: true, name: true, email: true } },
          tutorUser: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  // Group unread messages by (conversation, recipient) so someone with
  // several unread messages in one thread gets a single email, not one per
  // message.
  const groups = new Map<
    string,
    {
      recipient: { id: string; name: string; email: string };
      senderName: string;
      conversationId: string;
      recipientIsClient: boolean;
      messageIds: string[];
      count: number;
    }
  >();

  for (const message of unread) {
    const { conversation } = message;
    const recipientIsClient = message.senderId !== conversation.clientId;
    const recipient = recipientIsClient ? conversation.client : conversation.tutorUser;
    const key = `${conversation.id}:${recipient.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.messageIds.push(message.id);
      existing.count += 1;
    } else {
      groups.set(key, {
        recipient,
        senderName: message.sender.name,
        conversationId: conversation.id,
        recipientIsClient,
        messageIds: [message.id],
        count: 1,
      });
    }
  }

  let remindersSent = 0;
  for (const group of groups.values()) {
    const path = group.recipientIsClient
      ? `/dashboard/messages/${group.conversationId}`
      : `/tutor-dashboard/messages/${group.conversationId}`;
    const link = `${process.env.NEXT_PUBLIC_APP_URL}${path}`;

    try {
      await sendEmail({
        to: group.recipient.email,
        subject: "You have an unread message on Channel Tutoring",
        html: baseEmailLayout(`
          <p>Hi ${group.recipient.name},</p>
          <p>${group.senderName} sent you ${group.count > 1 ? `${group.count} messages` : "a message"}
          on Channel Tutoring over 10 hours ago that you haven't opened yet.</p>
          <p><a href="${link}">View your messages</a></p>
        `),
      });
      await prisma.message.updateMany({
        where: { id: { in: group.messageIds } },
        data: { reminderSentAt: new Date() },
      });
      remindersSent += 1;
    } catch {
      // Leave reminderSentAt unset so this group is retried on the next run.
    }
  }

  return NextResponse.json({ remindersSent, messagesChecked: unread.length });
}
