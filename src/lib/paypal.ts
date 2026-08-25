const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function getApiBase() {
  return process.env.PAYPAL_MODE === "live" ? LIVE_BASE : SANDBOX_BASE;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured.");
  }

  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error("Failed to authenticate with PayPal.");
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function sendPayPalPayout({
  recipientEmail,
  amountPence,
  note,
  senderBatchId,
}: {
  recipientEmail: string;
  amountPence: number;
  note: string;
  senderBatchId: string;
}): Promise<{ batchId: string; payoutItemId: string }> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${getApiBase()}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "You've received a payout from Channel Tutoring",
        email_message: note,
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: (amountPence / 100).toFixed(2),
            currency: "GBP",
          },
          receiver: recipientEmail,
          note,
          sender_item_id: senderBatchId,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PayPal payout failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as {
    batch_header: { payout_batch_id: string };
    items?: { payout_item_id: string }[];
  };

  return {
    batchId: data.batch_header.payout_batch_id,
    payoutItemId: data.items?.[0]?.payout_item_id ?? "",
  };
}
