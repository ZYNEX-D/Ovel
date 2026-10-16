import { NextRequest, NextResponse } from "next/server";
import { applyWhatsAppText } from "@/lib/platform-store";
import { whatsAppWebhookResult } from "@/lib/whatsapp-reply";

/**
 * Two-Way WhatsApp Webhook Endpoint (Meta Cloud API / Twilio)
 * Receives incoming webhook notifications when a client replies to a scheduled reminder:
 * - "1" -> Confirms appointment in real-time
 * - "2" -> Triggers self-service reschedule flow
 * - "cancel" -> Cancels the appointment and frees the slot
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const bookingId = body?.bookingId || body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.context?.id;
    const incomingText = (body?.text || body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || "").trim();
    const result = whatsAppWebhookResult(incomingText, bookingId ? String(bookingId) : undefined, typeof window !== "undefined");
    if (result.status === 200 && "intent" in result) {
      applyWhatsAppText(String(bookingId), incomingText);
    }
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN || "ovel_whatsapp_verify_token";

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  if (mode === "subscribe") {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  return NextResponse.json({ message: "Ovel WhatsApp 2-Way Webhook Active" }, { status: 200 });
}
