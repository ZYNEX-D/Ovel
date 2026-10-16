/**
 * Ovel Complete Commercial Loop Platform Store
 * Bridges Supabase entities with in-memory persistence:
 * Quote -> Book -> Remind -> Invoice -> Paid
 */

import { WeeklyWorkingHours } from "./slot-engine";
import { addMinutes, displayTimeToIsoLocal, localDateString } from "./booking-time";
import { emitStoreChange } from "./store-events";
import { interpretWhatsAppReply, WhatsAppIntent } from "./whatsapp-reply";

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
  timeDisplay?: string;
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

export const DEFAULT_WORKING_HOURS: WeeklyWorkingHours = {
  monday: { start: "09:00", end: "18:00", active: true },
  tuesday: { start: "09:00", end: "18:00", active: true },
  wednesday: { start: "09:00", end: "18:00", active: true },
  thursday: { start: "09:00", end: "18:00", active: true },
  friday: { start: "09:00", end: "18:00", active: true },
  saturday: { start: "10:00", end: "16:00", active: true },
  sunday: { start: "00:00", end: "00:00", active: false },
};

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: "srv_bridal_aesthetics",
    name: "Bridal Aesthetics & Skin Rejuvenation Protocol",
    description: "Multi-modal protocol including gentle lymphatic drainage, cellular micro-current, and regenerative barrier prep.",
    durationMinutes: 90,
    priceCents: 108500,
    depositCents: 27125,
    bufferAfterMinutes: 15,
    isActive: true,
  },
  {
    id: "srv_complexion_consult",
    name: "Aesthetic Complexion Consultation",
    description: "Digital dermal topography assessment and personalized medical-grade formulation roadmap.",
    durationMinutes: 45,
    priceCents: 12000,
    depositCents: 3500,
    bufferAfterMinutes: 15,
    isActive: true,
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "st_genevieve",
    name: "Dr. Genevieve Moreau",
    email: "genevieve@ovel.app",
    role: "Lead Clinical Aesthetician & Dermatologist",
    workingHours: DEFAULT_WORKING_HOURS,
    isActive: true,
  },
  {
    id: "st_camille",
    name: "Camille Laurent",
    email: "camille@ovel.app",
    role: "Senior Dermal Specialist",
    workingHours: DEFAULT_WORKING_HOURS,
    isActive: true,
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "bk_elena_fu38d309",
    serviceId: "srv_bridal_aesthetics",
    serviceName: "Bridal Aesthetics & Skin Rejuvenation Protocol",
    staffId: "st_genevieve",
    staffName: "Dr. Genevieve Moreau",
    clientName: "Elena Rostova",
    clientEmail: "elena.rostova@luxury.com",
    clientPhone: "+1 (415) 773-9011",
    startTime: "2026-10-11T10:00:00.000Z",
    endTime: "2026-10-11T11:30:00.000Z",
    status: "confirmed",
    totalPriceCents: 108500,
    depositPaidCents: 27125,
    rescheduleToken: "tok_fu38d309",
    stationResource: "Room 2 (Laser Bay)",
    hasCardOnFile: false,
    timeDisplay: "10:00 AM - 11:30 AM",
    createdAt: "2026-10-11T08:00:00.000Z",
  },
  {
    id: "bk_tharusha_urzyi818",
    serviceId: "srv_complexion_consult",
    serviceName: "Aesthetic Complexion Consultation",
    staffId: "st_genevieve",
    staffName: "Dr. Genevieve Moreau",
    clientName: "Tharusha Damsara",
    clientEmail: "tdamsara6@gmail.com",
    clientPhone: "+94789731507",
    startTime: "2026-10-11T12:00:00.000Z",
    endTime: "2026-10-11T12:45:00.000Z",
    status: "confirmed",
    totalPriceCents: 12000,
    depositPaidCents: 3500,
    rescheduleToken: "tok_urzyi818",
    stationResource: "Room 1 (Aesthetic Suite)",
    hasCardOnFile: false,
    timeDisplay: "12:00 PM - 12:45 PM",
    createdAt: "2026-10-11T09:00:00.000Z",
  },
];

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  {
    id: "wl_sophia",
    clientName: "Sophia Al-Mansoor",
    clientPhone: "+1 (415) 882-1902",
    clientEmail: "sophia.mansoor@voyage.io",
    serviceName: "Aesthetic Complexion Consultation",
    preferredTime: "Today 1:30 PM",
    status: "waiting",
  },
];

export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [
  {
    id: "cp_elena",
    name: "Elena Rostova",
    email: "elena.rostova@luxury.com",
    phone: "+1 (415) 773-9011",
    totalVisits: 3,
    noShowCount: 0,
    reliabilityScore: 100,
    formulasOrNotes: "Targeting glow protocol before winter gala. Sensitivity to high glycolic peels.",
    membershipPlan: "VIP Lumina Black",
    cardOnFile: undefined,
  },
  {
    id: "cp_tharusha",
    name: "Tharusha Damsara",
    email: "tdamsara6@gmail.com",
    phone: "+94789731507",
    totalVisits: 1,
    noShowCount: 0,
    reliabilityScore: 100,
    formulasOrNotes: "Comprehensive barrier assessment. Exploring custom anti-glycation serums.",
    membershipPlan: "Client Member",
    cardOnFile: undefined,
  },
];

export const INITIAL_QUOTES: QuoteProposal[] = [];

export const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: "inv_elena_fu38d309",
    bookingId: "bk_elena_fu38d309",
    invoiceNumber: "INV-2026-1048",
    clientName: "Elena Rostova",
    clientEmail: "elena.rostova@luxury.com",
    subtotalCents: 108500,
    depositCreditedCents: 27125,
    taxCents: 0,
    balanceDueCents: 81375,
    status: "sent",
    createdAt: "2026-10-11T08:05:00.000Z",
  },
  {
    id: "inv_tharusha_urzyi818",
    bookingId: "bk_tharusha_urzyi818",
    invoiceNumber: "INV-2026-1049",
    clientName: "Tharusha Damsara",
    clientEmail: "tdamsara6@gmail.com",
    subtotalCents: 12000,
    depositCreditedCents: 3500,
    taxCents: 0,
    balanceDueCents: 8500,
    status: "sent",
    createdAt: "2026-10-11T09:05:00.000Z",
  },
];

export const INITIAL_REMINDERS: ReminderLog[] = [];

// Local Storage Keys
const KEY_SERVICES = "ovel_services_v1";
const KEY_STAFF = "ovel_staff_v1";
const KEY_BOOKINGS = "ovel_bookings_v1";
const KEY_QUOTES = "ovel_quotes_v1";
const KEY_INVOICES = "ovel_invoices_v1";
const KEY_REMINDERS = "ovel_reminders_v1";

function isLegacyMockId(id: string): boolean {
  return /^(?:bk_10|qt_50|inv_90|rem_1|wl_[12]|cp_[12])\d{0,3}$/.test(id)
    || /^(?:srv_[1-4]|st_[12])$/.test(id);
}

const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

export function clearSnapshotCache() {
  snapshotCache.clear();
}

function remember<T>(key: string, raw: string | null, value: T): T {
  snapshotCache.set(key, { raw, value });
  return value;
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  if (!raw) return remember(key, raw, fallback);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return remember(key, raw, parsed as T);

    const cleaned = parsed.filter((item: { id?: string | number } | null | undefined) => {
      if (!item || !item.id) return false;
      return !isLegacyMockId(String(item.id));
    });

    if (cleaned.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      const fallbackRaw = JSON.stringify(fallback);
      localStorage.setItem(key, fallbackRaw);
      return remember(key, fallbackRaw, fallback);
    }

    if (cleaned.length !== parsed.length) {
      const cleanedRaw = JSON.stringify(cleaned);
      localStorage.setItem(key, cleanedRaw);
      return remember(key, cleanedRaw, cleaned as unknown as T);
    }
    return remember(key, raw, cleaned as unknown as T);
  } catch {
    return remember(key, raw, fallback);
  }
}

function safeSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(key, raw);
    snapshotCache.set(key, { raw, value });
    emitStoreChange();
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

const BLOCKING_STATUSES = new Set<BookingRecord["status"]>([
  "confirmed",
  "pending_deposit",
  "rescheduled",
  "completed",
]);

export function calculateInvoiceAmounts(
  subtotalCents: number,
  depositPaidCents: number,
  taxRate = 0.085,
) {
  const subtotal = Number.isFinite(subtotalCents) ? Math.max(0, Math.round(subtotalCents)) : 0;
  const deposit = Number.isFinite(depositPaidCents) ? Math.max(0, Math.round(depositPaidCents)) : 0;
  const taxCents = Math.round(subtotal * taxRate);
  const balanceDueCents = Math.max(0, subtotal + taxCents - deposit);
  const depositCreditedCents = Math.min(deposit, subtotal + taxCents);
  const status: InvoiceRecord["status"] = balanceDueCents === 0 ? "paid" : "sent";
  return { subtotalCents: subtotal, depositCreditedCents, taxCents, balanceDueCents, status };
}

export function payableBalanceCents(booking: BookingRecord, invoice?: InvoiceRecord): number {
  if (invoice?.status === "paid") return 0;
  if (invoice) return Math.max(0, invoice.balanceDueCents);
  return Math.max(0, booking.totalPriceCents - booking.depositPaidCents);
}

export function summarizeBookings(bookings: BookingRecord[]) {
  const open = bookings.filter((booking) => booking.status !== "cancelled");
  const serviceRevenue = open.reduce((sum, booking) => sum + booking.totalPriceCents, 0);
  const noShowFees = bookings.reduce((sum, booking) => sum + (booking.noShowFeeChargedCents ?? 0), 0);
  const totalRevenue = serviceRevenue + noShowFees;
  const depositsCollected = open.reduce((sum, booking) => sum + booking.depositPaidCents, 0);
  const avgOrderValue = open.length > 0 ? Math.round(serviceRevenue / open.length) : 0;
  const activeBookingsCount = bookings.filter(
    (booking) => booking.status === "confirmed" || booking.status === "rescheduled",
  ).length;
  return { totalRevenue, depositsCollected, avgOrderValue, activeBookingsCount };
}

function blockedInterval(
  booking: Pick<BookingRecord, "startTime" | "endTime" | "serviceId">,
  services: ServiceItem[],
) {
  const start = Date.parse(booking.startTime);
  const end = Date.parse(booking.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const bufferMinutes = services.find((service) => service.id === booking.serviceId)?.bufferAfterMinutes ?? 0;
  return { start, end: end + Math.max(0, bufferMinutes) * 60000 };
}

export function hasStaffConflict(
  bookings: BookingRecord[],
  staffId: string,
  startTime: string,
  endTime: string,
  serviceId: string,
  ignoreBookingId?: string,
) {
  const services = getServices();
  const candidate = blockedInterval({ startTime, endTime, serviceId }, services);
  if (!candidate) return true;
  return bookings.some((booking) => {
    if (booking.id === ignoreBookingId || booking.staffId !== staffId) return false;
    if (!BLOCKING_STATUSES.has(booking.status)) return false;
    const existing = blockedInterval(booking, services);
    if (!existing) return false;
    return candidate.start < existing.end && candidate.end > existing.start;
  });
}

export function staffIdFromName(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `st_${slug || "assigned"}`;
}

function uniqueId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBooking(
  data: Omit<BookingRecord, "id" | "rescheduleToken" | "createdAt">,
  options?: { checkConflicts?: boolean },
): BookingRecord | null {
  const all = getBookings();
  const checkConflicts = options?.checkConflicts !== false;
  if (
    checkConflicts &&
    hasStaffConflict(all, data.staffId, data.startTime, data.endTime, data.serviceId)
  ) {
    return null;
  }
  if (!checkConflicts) {
    const start = Date.parse(data.startTime);
    const end = Date.parse(data.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  }

  const newBooking: BookingRecord = {
    ...data,
    id: uniqueId("bk"),
    rescheduleToken: uniqueId("tok"),
    createdAt: new Date().toISOString(),
  };

  saveBookings([newBooking, ...all]);

  const amounts = calculateInvoiceAmounts(data.totalPriceCents, data.depositPaidCents);
  const newInvoice: InvoiceRecord = {
    id: uniqueId("inv"),
    bookingId: newBooking.id,
    invoiceNumber: "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    ...amounts,
    createdAt: new Date().toISOString(),
  };
  saveInvoices([newInvoice, ...getInvoices()]);

  // Schedule WhatsApp T-24h reminder
  const newReminder: ReminderLog = {
    id: uniqueId("rem"),
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
export function selectWaitlistRecipient(entries: WaitlistEntry[], serviceName: string): number {
  const target = serviceName.trim().toLowerCase();
  return entries.findIndex((entry) => {
    if (entry.status !== "waiting") return false;
    if (!target) return true;
    return entry.serviceName.trim().toLowerCase() === target;
  });
}

export function dispatchWaitlistBlast(slotTimeFormatted: string, serviceName: string): WaitlistEntry[] {
  const current = getWaitlist();
  const recipientIndex = selectWaitlistRecipient(current, serviceName);
  if (recipientIndex < 0) return current;
  const updated = current.map((entry, index) => {
    if (index !== recipientIndex) return entry;
    return {
      ...entry,
      status: "notified" as const,
      notifiedAt: new Date().toISOString(),
      preferredTime: slotTimeFormatted || entry.preferredTime,
    };
  });
  saveWaitlist(updated);
  return updated;
}

export function claimWaitlistSlot(entryId: string, staffName: string): BookingRecord | null {
  const entries = getWaitlist();
  const target = entries.find((entry) => entry.id === entryId);
  if (!target || target.status === "claimed") return null;

  const service = getServices().find(
    (item) => item.name.trim().toLowerCase() === target.serviceName.trim().toLowerCase(),
  );
  const staff = getStaff().find(
    (member) => member.name.trim().toLowerCase() === staffName.trim().toLowerCase(),
  );
  const duration = service?.durationMinutes && service.durationMinutes > 0 ? service.durationMinutes : 60;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = localDateString(tomorrow);
  const clock = /(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])/.exec(target.preferredTime);
  const parsed = clock
    ? displayTimeToIsoLocal(tomorrowDate, `${clock[1]}:${clock[2] ?? "00"} ${clock[3]}`)
    : null;
  const startTime = parsed ?? `${tomorrowDate}T14:00:00`;
  const endTime = addMinutes(startTime, duration);
  if (!endTime) return null;

  const booking = createBooking({
    serviceId: service?.id ?? "srv_waitlist",
    serviceName: target.serviceName,
    staffId: staff?.id ?? staffIdFromName(staffName),
    staffName: staff?.name ?? staffName,
    clientName: target.clientName,
    clientEmail: target.clientEmail,
    clientPhone: target.clientPhone,
    startTime,
    endTime,
    status: "confirmed",
    totalPriceCents: service?.priceCents ?? 0,
    depositPaidCents: service?.depositCents ?? 0,
    hasCardOnFile: false,
    notes: "Instant revenue recovery via smart waitlist.",
  });
  if (!booking) return null;

  saveWaitlist(entries.map((entry) => (entry.id === entryId ? { ...entry, status: "claimed" as const } : entry)));
  return booking;
}

/**
 * Moat Feature: 1-Click No-Show & Late-Cancellation Fee via Stripe Card-on-File
 */
export function chargeNoShowFee(bookingId: string, feeCents = 2500): BookingRecord | null {
  if (!Number.isFinite(feeCents) || feeCents <= 0) return null;
  const bookings = getBookings();
  const current = bookings.find((booking) => booking.id === bookingId);
  if (!current || current.isNoShow || current.status === "cancelled" || current.status === "completed") return null;
  if (!current.hasCardOnFile || !current.cardLast4) return null;

  let updatedBooking: BookingRecord | null = null;
  const updated = bookings.map((booking) => {
    if (booking.id !== bookingId) return booking;
    updatedBooking = {
      ...booking,
      status: "cancelled" as const,
      isNoShow: true,
      noShowFeeChargedCents: feeCents,
      notes: `${booking.notes || ""} [Enforced 24h late policy: $${(feeCents / 100).toFixed(2)} no-show fee charged to card •••• ${booking.cardLast4}]`.trim(),
    };
    return updatedBooking;
  });

  saveBookings(updated);
  return updatedBooking;
}

export function rescheduleBooking(bookingId: string, startTime: string, endTime: string): BookingRecord | null {
  const bookings = getBookings();
  const current = bookings.find((booking) => booking.id === bookingId);
  if (!current || current.status === "cancelled" || current.status === "completed") return null;
  if (hasStaffConflict(bookings, current.staffId, startTime, endTime, current.serviceId, bookingId)) return null;
  const updatedBooking: BookingRecord = {
    ...current,
    startTime,
    endTime,
    status: "rescheduled",
  };
  saveBookings(bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)));
  return updatedBooking;
}

export function applyWhatsAppIntent(bookingId: string, intent: Exclude<WhatsAppIntent, "unknown">) {
  if (intent === "confirm") {
    simulateWhatsAppReply(bookingId, "1");
    return;
  }
  if (intent === "reschedule") {
    simulateWhatsAppReply(bookingId, "2");
    return;
  }
  const reminders = getReminders().map((reminder) =>
    reminder.bookingId === bookingId ? { ...reminder, status: "replied_cancelled" as const } : reminder,
  );
  saveReminders(reminders);
  updateBookingStatus(bookingId, "cancelled");
}

export function applyWhatsAppText(bookingId: string, text: string) {
  const intent = interpretWhatsAppReply(text);
  if (intent === "unknown") return intent;
  applyWhatsAppIntent(bookingId, intent);
  return intent;
}
