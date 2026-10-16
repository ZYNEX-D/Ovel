import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { addMinutes, displayTimeToIsoLocal, dollarsToCents, parseDisplayTime } from "./booking-time";
import { computeAvailableSlots, type WeeklyWorkingHours } from "./slot-engine";
import {
  applyWhatsAppText,
  calculateInvoiceAmounts,
  chargeNoShowFee,
  claimWaitlistSlot,
  clearSnapshotCache,
  createBooking,
  dispatchWaitlistBlast,
  getInvoices,
  getReminders,
  getWaitlist,
  hasStaffConflict,
  saveWaitlist,
  selectWaitlistRecipient,
  summarizeBookings,
  type BookingRecord,
  type WaitlistEntry,
} from "./platform-store";
import { interpretWhatsAppReply, whatsAppWebhookResult } from "./whatsapp-reply";

const memory = new Map<string, string>();
Object.assign(globalThis, {
  window: globalThis,
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  },
});

const HOURS: WeeklyWorkingHours = {
  monday: { start: "09:00", end: "18:00", active: true },
  tuesday: { start: "09:00", end: "18:00", active: true },
  wednesday: { start: "09:00", end: "18:00", active: true },
  thursday: { start: "09:00", end: "18:00", active: true },
  friday: { start: "09:00", end: "18:00", active: true },
  saturday: { start: "10:00", end: "16:00", active: true },
  sunday: { start: "00:00", end: "00:00", active: false },
};

function localIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

describe("computeAvailableSlots", () => {
  it("ignores bookings on other days", () => {
    const slots = computeAvailableSlots({
      date: "2026-10-13",
      serviceDurationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      slotIntervalMinutes: 60,
      workingHours: HOURS,
      existingBookings: [{
        startTime: localIso("2026-10-12", "09:00"),
        endTime: localIso("2026-10-12", "10:00"),
        status: "confirmed",
      }],
    });
    assert.equal(slots.find((slot) => slot.time === "9:00 AM")?.available, true);
  });

  it("keeps the buffer after an existing booking blocked", () => {
    const slots = computeAvailableSlots({
      date: "2026-10-12",
      serviceDurationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 15,
      slotIntervalMinutes: 30,
      workingHours: HOURS,
      existingBookings: [{
        startTime: localIso("2026-10-12", "09:00"),
        endTime: localIso("2026-10-12", "10:00"),
        status: "confirmed",
      }],
    });
    assert.equal(slots.find((slot) => slot.time === "10:00 AM")?.available, false);
    assert.equal(slots.find((slot) => slot.time === "10:30 AM")?.available, true);
  });

  it("frees cancelled bookings and refuses a zero interval", () => {
    const cancelled = computeAvailableSlots({
      date: "2026-10-12",
      serviceDurationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      slotIntervalMinutes: 60,
      workingHours: HOURS,
      existingBookings: [{
        startTime: localIso("2026-10-12", "09:00"),
        endTime: localIso("2026-10-12", "10:00"),
        status: "cancelled",
      }],
    });
    assert.equal(cancelled.find((slot) => slot.time === "9:00 AM")?.available, true);
    assert.deepEqual(computeAvailableSlots({
      date: "2026-10-12",
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 0,
      workingHours: HOURS,
      existingBookings: [],
    }), []);
    assert.deepEqual(computeAvailableSlots({
      date: "2026-10-11",
      serviceDurationMinutes: 60,
      workingHours: HOURS,
      existingBookings: [],
    }), []);
  });
});

describe("booking time and invoices", () => {
  it("maps the clock time the client picked", () => {
    assert.equal(displayTimeToIsoLocal("2026-10-16", "01:00 PM"), "2026-10-16T13:00:00");
    assert.equal(displayTimeToIsoLocal("2026-10-16", "12:00 AM"), "2026-10-16T00:00:00");
    assert.equal(displayTimeToIsoLocal("2026-10-16", "12:30 PM"), "2026-10-16T12:30:00");
    assert.equal(displayTimeToIsoLocal("2026-10-16", "10:00 AM"), "2026-10-16T10:00:00");
    assert.equal(parseDisplayTime("25:00 PM"), null);
    assert.equal(addMinutes("2026-10-16T10:00:00", 45), "2026-10-16T10:45:00");
    assert.equal(addMinutes("2026-10-16T23:30:00", 45), "2026-10-17T00:15:00");
  });

  it("taxes the service price and treats the deposit as a credit", () => {
    assert.deepEqual(calculateInvoiceAmounts(10000, 2500), {
      subtotalCents: 10000,
      depositCreditedCents: 2500,
      taxCents: 850,
      balanceDueCents: 8350,
      status: "sent",
    });
    assert.equal(calculateInvoiceAmounts(10000, 10850).status, "paid");
    assert.equal(calculateInvoiceAmounts(10000, 10850).balanceDueCents, 0);
    assert.equal(dollarsToCents(Number.NaN), null);
  });

  it("does not count cancelled bookings as revenue", () => {
    const bookings = [
      { status: "confirmed", totalPriceCents: 5000, depositPaidCents: 1000, noShowFeeChargedCents: 0 },
      { status: "cancelled", totalPriceCents: 9000, depositPaidCents: 2000, noShowFeeChargedCents: 2500 },
    ] as BookingRecord[];
    const summary = summarizeBookings(bookings);
    assert.equal(summary.totalRevenue, 7500);
    assert.equal(summary.depositsCollected, 1000);
    assert.equal(summary.activeBookingsCount, 1);
  });
});

describe("stored booking rules", () => {
  beforeEach(() => {
    memory.clear();
    clearSnapshotCache();
  });

  it("rejects a second booking that collides with the buffer", () => {
    const first = createBooking({
      serviceId: "srv_complexion_consult",
      serviceName: "Aesthetic Complexion Consultation",
      staffId: "st_test",
      staffName: "Test",
      clientName: "A",
      clientEmail: "a@example.com",
      clientPhone: "1",
      startTime: "2026-10-20T10:00:00",
      endTime: "2026-10-20T10:45:00",
      status: "confirmed",
      totalPriceCents: 12000,
      depositPaidCents: 3500,
    });
    assert.ok(first);
    const overlap = createBooking({
      serviceId: "srv_complexion_consult",
      serviceName: "Aesthetic Complexion Consultation",
      staffId: "st_test",
      staffName: "Test",
      clientName: "B",
      clientEmail: "b@example.com",
      clientPhone: "2",
      startTime: "2026-10-20T10:50:00",
      endTime: "2026-10-20T11:35:00",
      status: "confirmed",
      totalPriceCents: 12000,
      depositPaidCents: 0,
    });
    assert.equal(overlap, null);
    const later = createBooking({
      serviceId: "srv_complexion_consult",
      serviceName: "Aesthetic Complexion Consultation",
      staffId: "st_other",
      staffName: "Other",
      clientName: "C",
      clientEmail: "c@example.com",
      clientPhone: "3",
      startTime: "2026-10-20T10:50:00",
      endTime: "2026-10-20T11:35:00",
      status: "confirmed",
      totalPriceCents: 12000,
      depositPaidCents: 0,
    });
    assert.ok(later);
    assert.equal(hasStaffConflict([], "st_test", "bad", "bad", "srv_complexion_consult"), true);
    const invoice = getInvoices().find((item) => item.bookingId === first.id);
    assert.equal(invoice?.taxCents, 1020);
    assert.equal(invoice?.balanceDueCents, 12000 + 1020 - 3500);
  });

  it("notifies the first waiting client for that service and will not claim twice", () => {
    const entries: WaitlistEntry[] = [
      {
        id: "wl_other",
        clientName: "Other",
        clientPhone: "1",
        clientEmail: "o@example.com",
        serviceName: "Other service",
        preferredTime: "1:00 PM",
        status: "waiting",
      },
      {
        id: "wl_match",
        clientName: "Match",
        clientPhone: "2",
        clientEmail: "m@example.com",
        serviceName: "Aesthetic Complexion Consultation",
        preferredTime: "1:30 PM",
        status: "waiting",
      },
    ];
    assert.equal(selectWaitlistRecipient(entries, "Aesthetic Complexion Consultation"), 1);
    saveWaitlist(entries);
    const notified = dispatchWaitlistBlast("1:30 PM", "Aesthetic Complexion Consultation");
    assert.equal(notified[0].status, "waiting");
    assert.equal(notified[1].status, "notified");
    const claimed = claimWaitlistSlot("wl_match", "Dr. Genevieve Moreau");
    assert.equal(claimed?.serviceId, "srv_complexion_consult");
    assert.equal(claimed?.totalPriceCents, 12000);
    assert.equal(claimed?.hasCardOnFile, false);
    assert.equal(claimWaitlistSlot("wl_match", "Dr. Genevieve Moreau"), null);
    assert.equal(getWaitlist().find((entry) => entry.id === "wl_match")?.status, "claimed");
  });

  it("charges a no-show only when a card is on file", () => {
    const booking = createBooking({
      serviceId: "srv_custom",
      serviceName: "Custom",
      staffId: "st_fee",
      staffName: "Fee",
      clientName: "Dana",
      clientEmail: "dana@example.com",
      clientPhone: "4",
      startTime: "2026-10-21T11:00:00",
      endTime: "2026-10-21T12:00:00",
      status: "confirmed",
      totalPriceCents: 5000,
      depositPaidCents: 0,
      hasCardOnFile: false,
    });
    assert.ok(booking);
    assert.equal(chargeNoShowFee(booking.id, 2500), null);
    const withCard = createBooking({
      ...booking,
      staffId: "st_fee_card",
      startTime: "2026-10-21T13:00:00",
      endTime: "2026-10-21T14:00:00",
      hasCardOnFile: true,
      cardLast4: "4242",
    });
    assert.ok(withCard);
    const charged = chargeNoShowFee(withCard.id, 2500);
    assert.equal(charged?.isNoShow, true);
    assert.equal(charged?.noShowFeeChargedCents, 2500);
    assert.equal(chargeNoShowFee(withCard.id, 2500), null);
    const summary = summarizeBookings([booking, charged!]);
    assert.equal(summary.totalRevenue, 5000 + 2500);
  });

  it("keeps new reminders and cancels from the word cancel", () => {
    const booking = createBooking({
      serviceId: "srv_custom",
      serviceName: "Custom",
      staffId: "st_msg",
      staffName: "Msg",
      clientName: "Evan",
      clientEmail: "evan@example.com",
      clientPhone: "5",
      startTime: "2026-10-22T09:00:00",
      endTime: "2026-10-22T10:00:00",
      status: "confirmed",
      totalPriceCents: 4000,
      depositPaidCents: 0,
    });
    assert.ok(booking);
    assert.equal(getReminders().some((reminder) => reminder.bookingId === booking.id), true);
    memory.set("ovel_reminders_v1", JSON.stringify([
      { id: "rem_101", bookingId: "old", clientName: "Old", clientPhone: "0", channel: "whatsapp", triggerType: "T-24h", status: "scheduled", messageText: "old", timestamp: "2026-01-01 00:00:00" },
      { id: "rem_1760000000000", bookingId: booking.id, clientName: "Evan", clientPhone: "5", channel: "whatsapp", triggerType: "T-24h", status: "scheduled", messageText: "keep", timestamp: "2026-01-01 00:00:00" },
    ]));
    clearSnapshotCache();
    const reminders = getReminders();
    assert.equal(reminders.some((reminder) => reminder.id === "rem_101"), false);
    assert.equal(reminders.some((reminder) => reminder.id === "rem_1760000000000"), true);
    assert.equal(interpretWhatsAppReply("cancel"), "cancel");
    assert.equal(interpretWhatsAppReply("2"), "reschedule");
    assert.equal(applyWhatsAppText(booking.id, "cancel"), "cancel");
    assert.equal(whatsAppWebhookResult("cancel", undefined, true).status, 422);
    assert.equal(whatsAppWebhookResult("cancel", booking.id, false).status, 503);
    assert.equal(whatsAppWebhookResult("cancel", booking.id, true).status, 200);
  });
});
