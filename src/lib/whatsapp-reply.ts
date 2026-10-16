export type WhatsAppIntent = "confirm" | "reschedule" | "cancel" | "unknown";

export function interpretWhatsAppReply(text: string): WhatsAppIntent {
  const value = text.trim().toLowerCase();
  if (value === "1" || value === "confirm") return "confirm";
  if (value === "2" || value === "reschedule") return "reschedule";
  if (value === "cancel") return "cancel";
  return "unknown";
}

const REPLIES: Record<Exclude<WhatsAppIntent, "unknown">, { action: string; replyMessage: string }> = {
  confirm: {
    action: "CONFIRMED",
    replyMessage: "Thank you! Your appointment is locked in and confirmed.",
  },
  reschedule: {
    action: "RESCHEDULE_TRIGGERED",
    replyMessage: "No problem! You can pick a new slot here: https://ovel.app/portal",
  },
  cancel: {
    action: "CANCELLED",
    replyMessage: "Your appointment has been cancelled and the time is open again.",
  },
};

export function whatsAppWebhookResult(text: string, bookingId: string | undefined, persistable: boolean) {
  if (!text.trim()) {
    return { status: 400, body: { error: "Missing message body" } };
  }
  const intent = interpretWhatsAppReply(text);
  if (intent === "unknown") {
    return {
      status: 200,
      body: {
        success: true,
        action: "RECEIVED",
        replyMessage: "Reply '1' to confirm your booking, '2' to reschedule, or 'cancel' to cancel.",
      },
    };
  }
  if (!bookingId) {
    return { status: 422, body: { error: "Missing booking id" } };
  }
  if (!persistable) {
    return { status: 503, body: { error: "Booking store is not available on this server" } };
  }
  return { status: 200, intent, body: { success: true, ...REPLIES[intent] } };
}
