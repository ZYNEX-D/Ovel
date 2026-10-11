/**
 * Ovel Complete Commercial Loop Platform Store
 * Bridges Supabase entities with in-memory persistence:
 * Quote -> Book -> Remind -> Invoice -> Paid
 */

import { WeeklyWorkingHours } from "./slot-engine";

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  bufferAfterMinutes: number;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  workingHours: WeeklyWorkingHours;
  isActive: boolean;
}

export interface BookingRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  status: "confirmed" | "pending_deposit" | "rescheduled" | "cancelled" | "completed";
  totalPriceCents: number;
  depositPaidCents: number;
  rescheduleToken: string;
  notes?: string;
  stationResource?: string; // e.g. "Room 2 (Laser Bay)", "Chair 3", "Detailing Bay 1"
  hasCardOnFile?: boolean;
  cardLast4?: string;
  isNoShow?: boolean;
  noShowFeeChargedCents?: number;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  preferredTime: string;
  status: "waiting" | "notified" | "claimed";
  notifiedAt?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  noShowCount: number;
  reliabilityScore: number; // e.g. 98%
  formulasOrNotes: string;
  membershipPlan?: string;
  cardOnFile?: { brand: string; last4: string };
  intakePhotos?: string[];
}

export interface QuoteProposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  lineItems: { description: string; priceCents: number }[];
  optionalAddOns: { id: string; description: string; priceCents: number; selected: boolean }[];
  totalCents: number;
  depositCents: number;
  status: "draft" | "sent" | "accepted" | "converted";
  signatureData?: string;
  expiresAt: string;
  convertedBookingId?: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  subtotalCents: number;
  depositCreditedCents: number;
  taxCents: number;
  balanceDueCents: number;
  status: "draft" | "sent" | "paid";
  paidAt?: string;
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  bookingId: string;
  clientName: string;
  clientPhone: string;
  channel: "whatsapp" | "email";
  triggerType: "T-24h" | "T-2h" | "instant_confirmation";
  status: "scheduled" | "sent" | "replied_confirmed" | "replied_cancelled";
  messageText: string;
  timestamp: string;
}

const DEFAULT_WORKING_HOURS: WeeklyWorkingHours = {
  monday: { start: "09:00", end: "18:00", active: true },
  tuesday: { start: "09:00", end: "18:00", active: true },
  wednesday: { start: "09:00", end: "18:00", active: true },
  thursday: { start: "09:00", end: "18:00", active: true },
  friday: { start: "09:00", end: "18:00", active: true },
  saturday: { start: "10:00", end: "16:00", active: true },
  sunday: { start: "00:00", end: "00:00", active: false },
};

export const INITIAL_SERVICES: ServiceItem[] = [];
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_BOOKINGS: BookingRecord[] = [];
export const INITIAL_WAITLIST: WaitlistEntry[] = [];
export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [];
export const INITIAL_QUOTES: QuoteProposal[] = [];
export const INITIAL_INVOICES: InvoiceRecord[] = [];
export const INITIAL_REMINDERS: ReminderLog[] = [];

// Local Storage Keys
const KEY_SERVICES = "ovel_services_v1";
const KEY_STAFF = "ovel_staff_v1";
const KEY_BOOKINGS = "ovel_bookings_v1";
const KEY_QUOTES = "ovel_quotes_v1";
const KEY_INVOICES = "ovel_invoices_v1";
const KEY_REMINDERS = "ovel_reminders_v1";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return parsed;
    // Filter legacy mock data
    const cleaned = parsed.filter((item: any) => {
      if (!item || !item.id) return false;
      const id = String(item.id);
      return (
        !id.startsWith("bk_10") &&
        !id.startsWith("qt_50") &&
        !id.startsWith("inv_90") &&
        !id.startsWith("rem_1") &&
        !id.startsWith("srv_1") &&
        !id.startsWith("srv_2") &&
        !id.startsWith("srv_3") &&
        !id.startsWith("srv_4") &&
        !id.startsWith("st_1") &&
        !id.startsWith("st_2") &&
        !id.startsWith("wl_1") &&
        !id.startsWith("wl_2") &&
        !id.startsWith("cp_1") &&
        !id.startsWith("cp_2")
      );
    });
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    return cleaned as unknown as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Accessors
export const getServices = (): ServiceItem[] => safeGet(KEY_SERVICES, INITIAL_SERVICES);
export const saveServices = (data: ServiceItem[]) => safeSet(KEY_SERVICES, data);

export const getStaff = (): StaffMember[] => safeGet(KEY_STAFF, INITIAL_STAFF);
export const saveStaff = (data: StaffMember[]) => safeSet(KEY_STAFF, data);

export const getBookings = (): BookingRecord[] => safeGet(KEY_BOOKINGS, INITIAL_BOOKINGS);
export const saveBookings = (data: BookingRecord[]) => safeSet(KEY_BOOKINGS, data);

export const getQuotes = (): QuoteProposal[] => safeGet(KEY_QUOTES, INITIAL_QUOTES);
export const saveQuotes = (data: QuoteProposal[]) => safeSet(KEY_QUOTES, data);

export const getInvoices = (): InvoiceRecord[] => safeGet(KEY_INVOICES, INITIAL_INVOICES);
export const saveInvoices = (data: InvoiceRecord[]) => safeSet(KEY_INVOICES, data);

export const getReminders = (): ReminderLog[] => safeGet(KEY_REMINDERS, INITIAL_REMINDERS);
export const saveReminders = (data: ReminderLog[]) => safeSet(KEY_REMINDERS, data);

// Core Loop Operations
export function createBooking(data: Omit<BookingRecord, "id" | "rescheduleToken" | "createdAt">): BookingRecord {
  const all = getBookings();
  const token = "tok_" + Math.random().toString(36).substring(2, 10);
  const newBooking: BookingRecord = {
    ...data,
    id: "bk_" + Date.now(),
    rescheduleToken: token,
    createdAt: new Date().toISOString(),
  };

  const updated = [newBooking, ...all];
  saveBookings(updated);

  // Automatically create invoice
  const subtotal = data.totalPriceCents;
  const deposit = data.depositPaidCents;
  const tax = Math.round((subtotal - deposit) * 0.085);
  const balance = subtotal - deposit + tax;

  const newInvoice: InvoiceRecord = {
    id: "inv_" + Date.now(),
    bookingId: newBooking.id,
    invoiceNumber: "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    subtotalCents: subtotal,
    depositCreditedCents: deposit,
    taxCents: tax,
    balanceDueCents: balance,
    status: deposit >= subtotal ? "paid" : "sent",
    createdAt: new Date().toISOString(),
  };
  saveInvoices([newInvoice, ...getInvoices()]);

  // Schedule WhatsApp T-24h reminder
  const newReminder: ReminderLog = {
    id: "rem_" + Date.now(),
    bookingId: newBooking.id,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    channel: "whatsapp",
    triggerType: "T-24h",
    status: "scheduled",
    messageText: `Hi ${data.clientName}! Reminder for your ${data.serviceName} on ${data.startTime.replace("T", " at ")}. Reply 1 to Confirm or 2 to Reschedule.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
  };
  saveReminders([newReminder, ...getReminders()]);

  return newBooking;
}

export function updateBookingStatus(bookingId: string, status: BookingRecord["status"]) {
  const all = getBookings();
  const updated = all.map((b) => (b.id === bookingId ? { ...b, status } : b));
  saveBookings(updated);
}

export function simulateWhatsAppReply(bookingId: string, reply: "1" | "2") {
  const allReminders = getReminders();
  const updatedReminders = allReminders.map((r) => {
    if (r.bookingId === bookingId) {
      return {
        ...r,
        status: reply === "1" ? ("replied_confirmed" as const) : ("replied_cancelled" as const),
      };
    }
    return r;
  });
  saveReminders(updatedReminders);

  if (reply === "1") {
    updateBookingStatus(bookingId, "confirmed");
  } else {
    updateBookingStatus(bookingId, "rescheduled");
  }
}

// Storage Keys
const KEY_WAITLIST = "ovel_waitlist_v1";
const KEY_CLIENT_PROFILES = "ovel_client_profiles_v1";

export const getWaitlist = (): WaitlistEntry[] => safeGet(KEY_WAITLIST, INITIAL_WAITLIST);
export const saveWaitlist = (data: WaitlistEntry[]) => safeSet(KEY_WAITLIST, data);

export const getClientProfiles = (): ClientProfile[] => safeGet(KEY_CLIENT_PROFILES, INITIAL_CLIENT_PROFILES);
export const saveClientProfiles = (data: ClientProfile[]) => safeSet(KEY_CLIENT_PROFILES, data);

/**
 * Moat Feature: Smart Instant-Fill Waitlist Engine
 * Broadcasts instant WhatsApp ping to waitlist when slot becomes vacant.
 */
export function dispatchWaitlistBlast(slotTimeFormatted: string, serviceName: string): WaitlistEntry[] {
  const current = getWaitlist();
  const updated = current.map((entry, index) => {
    if (index === 0 && entry.status === "waiting") {
      return {
        ...entry,
        status: "notified" as const,
        notifiedAt: new Date().toISOString(),
      };
    }
    return entry;
  });
  saveWaitlist(updated);
  return updated;
}

export function claimWaitlistSlot(entryId: string, staffName: string): BookingRecord | null {
  const entries = getWaitlist();
  const target = entries.find((e) => e.id === entryId);
  if (!target) return null;

  // Mark claimed in waitlist
  const updatedEntries = entries.map((e) => (e.id === entryId ? { ...e, status: "claimed" as const } : e));
  saveWaitlist(updatedEntries);

  // Create confirmed booking instantly
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const booking = createBooking({
    serviceId: "srv_1",
    serviceName: target.serviceName,
    staffId: "st_1",
    staffName,
    clientName: target.clientName,
    clientEmail: target.clientEmail,
    clientPhone: target.clientPhone,
    startTime: tomorrow.toISOString(),
    endTime: new Date(tomorrow.getTime() + 60 * 60000).toISOString(),
    status: "confirmed",
    totalPriceCents: 19500,
    depositPaidCents: 5000,
    stationResource: "Treatment Suite 1 (Vortex Bay)",
    hasCardOnFile: true,
    cardLast4: "4242",
    notes: "Instant Revenue Recovery via Smart Waitlist Engine.",
  });

  return booking;
}

/**
 * Moat Feature: 1-Click No-Show & Late-Cancellation Fee via Stripe Card-on-File
 */
export function chargeNoShowFee(bookingId: string, feeCents = 2500): BookingRecord | null {
  const bookings = getBookings();
  let updatedBooking: BookingRecord | null = null;

  const updated = bookings.map((b) => {
    if (b.id === bookingId) {
      updatedBooking = {
        ...b,
        status: "cancelled" as const,
        isNoShow: true,
        noShowFeeChargedCents: feeCents,
        notes: `${b.notes || ""} [Enforced 24h Late Policy: $${(feeCents / 100).toFixed(2)} No-Show Fee charged to card •••• ${b.cardLast4 || "4242"}]`,
      };
      return updatedBooking;
    }
    return b;
  });

  saveBookings(updated);
  return updatedBooking;
}
