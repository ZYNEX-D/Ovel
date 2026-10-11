import { NextRequest, NextResponse } from "next/server";
import { simulateWhatsAppReply, getBookings } from "@/lib/platform-store";

/**
 * Two-Way WhatsApp Webhook Endpoint (Meta Cloud API / Twilio)
 * Receives incoming webhook notifications when a client replies to a scheduled reminder:
 * - "1" -> Confirms appointment in real-time
 * - "2" -> Triggers self-service reschedule flow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support standard Meta Cloud API or custom simulated payload:
    // { bookingId: "bk_101", text: "1" } OR Meta payload
    const bookingId = body?.bookingId || body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.context?.id;
    const incomingText = (body?.text || body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || "").trim();

    if (!incomingText) {
      return NextResponse.json({ error: "Missing message body" }, { status: 400 });
    }

    if (incomingText === "1" || incomingText.toLowerCase() === "confirm") {
      if (bookingId) {
        simulateWhatsAppReply(bookingId, "1");
      }
      return NextResponse.json({
        success: true,
        action: "CONFIRMED",
        replyMessage: "Thank you! Your appointment is locked in and confirmed.",
      });
    }

    if (incomingText === "2" || incomingText.toLowerCase() === "cancel" || incomingText.toLowerCase() === "reschedule") {
      if (bookingId) {
        simulateWhatsAppReply(bookingId, "2");
      }
      return NextResponse.json({
        success: true,
        action: "RESCHEDULE_TRIGGERED",
        replyMessage: "No problem! You can pick a new slot here: https://ovel.app/portal",
      });
    }

    return NextResponse.json({
      success: true,
      action: "RECEIVED",
      replyMessage: "Reply '1' to confirm your booking or '2' to reschedule.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}

// Meta Webhook Verification Challenge (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "ovel_whatsapp_verify_token") {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ message: "Ovel WhatsApp 2-Way Webhook Active" }, { status: 200 });
}
