import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";

export async function subscribeEmail(rawEmail: string, source: string) {
  const email = rawEmail.trim().toLowerCase();

  const subscription = await prisma.newsletterSubscription.upsert({
    where: { email },
    update: { subscribed: true, unsubscribedAt: null },
    create: { email, source },
  });

  const resend = getResend();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (resend && audienceId) {
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });
  }

  return subscription;
}

export async function unsubscribeEmail(token: string) {
  const subscription = await prisma.newsletterSubscription.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscription) return null;

  await prisma.newsletterSubscription.update({
    where: { id: subscription.id },
    data: { subscribed: false, unsubscribedAt: new Date() },
  });

  const resend = getResend();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (resend && audienceId) {
    await resend.contacts.update({
      email: subscription.email,
      audienceId,
      unsubscribed: true,
    });
  }

  return subscription;
}
