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
  itemsSummary?: string;
  notes?: string;
  paymentMethod?: string;
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
const KEY_WAITLIST = "ovel_waitlist_v1";
const KEY_CLIENT_PROFILES = "ovel_client_profiles_v1";

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

export function getActiveWorkspaceId(): string {
  if (typeof window === "undefined") return "demo";
  try {
    const active = localStorage.getItem("ovel_active_workspace_id");
    if (active) return active;
  } catch {
    // ignore
  }
  return "demo";
}

export function setActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") return;
  try {
    if (workspaceId) {
      localStorage.setItem("ovel_active_workspace_id", workspaceId);
    } else {
      localStorage.removeItem("ovel_active_workspace_id");
    }
  } catch {
    // ignore
  }
}

export function getWorkspaceAliases(workspaceOrSlug?: string): string[] {
  if (!workspaceOrSlug) return [];
  const set = new Set<string>();
  set.add(workspaceOrSlug);

  if (workspaceOrSlug.startsWith("org_")) {
    set.add(workspaceOrSlug.substring(4));
  } else {
    set.add(`org_${workspaceOrSlug}`);
  }

  if (typeof window !== "undefined") {
    try {
      const customSlug = localStorage.getItem(`ovel_custom_slug_${workspaceOrSlug}`);
      if (customSlug) set.add(customSlug);
      if (workspaceOrSlug.startsWith("org_")) {
        const cs = localStorage.getItem(`ovel_custom_slug_${workspaceOrSlug.substring(4)}`);
        if (cs) set.add(cs);
      }
    } catch {
      // ignore
    }

    try {
      const raw =
        localStorage.getItem("ovel_customized_ovelinks_v2") ||
        localStorage.getItem("ovel_customized_ovelinks_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const slug in parsed) {
          const item = parsed[slug];
          if (
            slug === workspaceOrSlug ||
            item.organizationId === workspaceOrSlug ||
            (item.organizationId && workspaceOrSlug.includes(item.organizationId)) ||
            (item.organizationId && item.organizationId.includes(workspaceOrSlug))
          ) {
            if (slug) set.add(slug);
            if (item.organizationId) set.add(item.organizationId);
          }
        }
      }
    } catch {
      // ignore
    }

    const active = localStorage.getItem("ovel_active_workspace_id");
    if (active && (active === workspaceOrSlug || active.includes(workspaceOrSlug) || workspaceOrSlug.includes(active))) {
      set.add(active);
    }
  }

  return Array.from(set);
}

export function resolveWorkspace(explicitId?: string): string {
  return explicitId || getActiveWorkspaceId() || "demo";
}

function getScopedKey(baseKey: string, workspaceId: string): string {
  return `${baseKey}_${workspaceId}`;
}

function safeGet<T>(baseKey: string, demoFallback: T, explicitWorkspace?: string): T {
  const ws = resolveWorkspace(explicitWorkspace);
  const isDemoOrRoot = ws === "org_root" || ws === "demo" || ws === "root";

  if (typeof window === "undefined") {
    return isDemoOrRoot ? demoFallback : (Array.isArray(demoFallback) ? ([] as unknown as T) : demoFallback);
  }

  const aliases = getWorkspaceAliases(ws);
  let effectiveKey = getScopedKey(baseKey, ws);
  let raw: string | null = null;

  if (isDemoOrRoot) {
    try {
      let val = localStorage.getItem(baseKey);
      if (val === null && baseKey.includes("_v1")) {
        val = localStorage.getItem(baseKey.replace("_v1", "_v2"));
      }
      if (val !== null) {
        effectiveKey = baseKey;
        raw = val;
      }
    } catch {
      // ignore
    }
  }

  if (raw === null) {
    for (const alias of aliases) {
      const k = getScopedKey(baseKey, alias);
      try {
        const val = localStorage.getItem(k);
        if (val !== null) {
          effectiveKey = k;
          raw = val;
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  const cached = snapshotCache.get(effectiveKey);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  if (raw === null) {
    if (isDemoOrRoot && Array.isArray(demoFallback) && demoFallback.length > 0) {
      try {
        const serialized = JSON.stringify(demoFallback);
        localStorage.setItem(effectiveKey, serialized);
        return remember(effectiveKey, serialized, demoFallback);
      } catch {
        return remember(effectiveKey, null, demoFallback);
      }
    }
    const emptyResult = isDemoOrRoot ? demoFallback : (Array.isArray(demoFallback) ? ([] as unknown as T) : demoFallback);
    return remember(effectiveKey, null, emptyResult);
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return remember(effectiveKey, raw, parsed as T);

    const cleaned = parsed.filter((item: { id?: string | number } | null | undefined) => {
      if (!item || !item.id) return false;
      return !isLegacyMockId(String(item.id));
    });

    if (cleaned.length === 0 && isDemoOrRoot && Array.isArray(demoFallback) && demoFallback.length > 0) {
      const fallbackRaw = JSON.stringify(demoFallback);
      localStorage.setItem(effectiveKey, fallbackRaw);
      return remember(effectiveKey, fallbackRaw, demoFallback);
    }

    if (cleaned.length !== parsed.length) {
      const cleanedRaw = JSON.stringify(cleaned);
      localStorage.setItem(effectiveKey, cleanedRaw);
      return remember(effectiveKey, cleanedRaw, cleaned as unknown as T);
    }
    return remember(effectiveKey, raw, cleaned as unknown as T);
  } catch {
    return remember(effectiveKey, raw, isDemoOrRoot ? demoFallback : ([] as unknown as T));
  }
}

function safeSet<T>(baseKey: string, value: T, explicitWorkspace?: string) {
  if (typeof window === "undefined") return;
  const ws = resolveWorkspace(explicitWorkspace);
  const aliases = getWorkspaceAliases(ws);
  try {
    const serialized = JSON.stringify(value);
    for (const alias of aliases) {
      const key = getScopedKey(baseKey, alias);
      localStorage.setItem(key, serialized);
      snapshotCache.set(key, { raw: serialized, value });
    }
    if (ws === "demo" || ws === "root" || ws === "org_root") {
      localStorage.setItem(baseKey, serialized);
      snapshotCache.set(baseKey, { raw: serialized, value });
    }
    emitStoreChange();
  } catch {
    // ignore
  }
}

function getOfferingsFromStoredOvelink(workspaceId?: string): ServiceItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem("ovel_customized_ovelinks_v2") ||
      localStorage.getItem("ovel_customized_ovelinks_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const ws = resolveWorkspace(workspaceId);
    const aliases = getWorkspaceAliases(ws);

    for (const key in parsed) {
      const item = parsed[key];
      if (!item) continue;
      const isMatch = aliases.some(
        (a) =>
          a.toLowerCase() === key.toLowerCase() ||
          (item.slug && a.toLowerCase() === item.slug.toLowerCase()) ||
          (item.organizationId && a === item.organizationId)
      );
      if (isMatch && Array.isArray(item.offerings) && item.offerings.length > 0) {
        return item.offerings.map((o: {
          id: string;
          name: string;
          description?: string;
          durationMinutes?: number;
          priceCents?: number;
          depositCents?: number;
          isActive?: boolean;
        }) => ({
          id: o.id,
          name: o.name,
          description: o.description || "Custom service treatment.",
          durationMinutes: o.durationMinutes || 45,
          priceCents: typeof o.priceCents === "number" ? o.priceCents : 0,
          depositCents: typeof o.depositCents === "number" ? o.depositCents : 0,
          bufferAfterMinutes: 15,
          isActive: o.isActive !== false,
        }));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

// Accessors
export const getServices = (workspaceId?: string): ServiceItem[] => {
  const existing = safeGet(KEY_SERVICES, INITIAL_SERVICES, workspaceId);
  if (existing && existing.length > 0) {
    return existing;
  }
  const fromOvelink = getOfferingsFromStoredOvelink(workspaceId);
  if (fromOvelink && fromOvelink.length > 0) {
    return fromOvelink;
  }
  return existing;
};
export const saveServices = (data: ServiceItem[], workspaceId?: string) =>
  safeSet(KEY_SERVICES, data, workspaceId);

export const getStaff = (workspaceId?: string): StaffMember[] =>
  safeGet(KEY_STAFF, INITIAL_STAFF, workspaceId);
export const saveStaff = (data: StaffMember[], workspaceId?: string) =>
  safeSet(KEY_STAFF, data, workspaceId);

export const getBookings = (workspaceId?: string): BookingRecord[] =>
  safeGet(KEY_BOOKINGS, INITIAL_BOOKINGS, workspaceId);
export const saveBookings = (data: BookingRecord[], workspaceId?: string) =>
  safeSet(KEY_BOOKINGS, data, workspaceId);

export const getQuotes = (workspaceId?: string): QuoteProposal[] =>
  safeGet(KEY_QUOTES, INITIAL_QUOTES, workspaceId);
export const saveQuotes = (data: QuoteProposal[], workspaceId?: string) =>
  safeSet(KEY_QUOTES, data, workspaceId);

export const getInvoices = (workspaceId?: string): InvoiceRecord[] =>
  safeGet(KEY_INVOICES, INITIAL_INVOICES, workspaceId);
export const saveInvoices = (data: InvoiceRecord[], workspaceId?: string) =>
  safeSet(KEY_INVOICES, data, workspaceId);

export const getReminders = (workspaceId?: string): ReminderLog[] =>
  safeGet(KEY_REMINDERS, INITIAL_REMINDERS, workspaceId);
export const saveReminders = (data: ReminderLog[], workspaceId?: string) =>
  safeSet(KEY_REMINDERS, data, workspaceId);

export const getWaitlist = (workspaceId?: string): WaitlistEntry[] =>
  safeGet(KEY_WAITLIST, INITIAL_WAITLIST, workspaceId);
export const saveWaitlist = (data: WaitlistEntry[], workspaceId?: string) =>
  safeSet(KEY_WAITLIST, data, workspaceId);

export const getClientProfiles = (workspaceId?: string): ClientProfile[] =>
  safeGet(KEY_CLIENT_PROFILES, INITIAL_CLIENT_PROFILES, workspaceId);
export const saveClientProfiles = (data: ClientProfile[], workspaceId?: string) =>
  safeSet(KEY_CLIENT_PROFILES, data, workspaceId);

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
  workspaceId?: string
) {
  const services = getServices(workspaceId);
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
  optionsOrWorkspace?: { checkConflicts?: boolean; workspaceId?: string } | string
): BookingRecord | null {
  const ws = resolveWorkspace(
    typeof optionsOrWorkspace === "string" ? optionsOrWorkspace : optionsOrWorkspace?.workspaceId
  );
  const checkConflicts = typeof optionsOrWorkspace === "object" ? optionsOrWorkspace.checkConflicts !== false : true;
  const all = getBookings(ws);

  if (
    checkConflicts &&
    hasStaffConflict(all, data.staffId, data.startTime, data.endTime, data.serviceId, undefined, ws)
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

  const updated = [newBooking, ...all];
  saveBookings(updated, ws);

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
  saveInvoices([newInvoice, ...getInvoices(ws)], ws);

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
  saveReminders([newReminder, ...getReminders(ws)], ws);

  // Register or update client profile in CRM
  try {
    const clients = getClientProfiles(ws);
    const existing = clients.find((c) => c.email.toLowerCase() === data.clientEmail.toLowerCase());
    if (existing) {
      existing.totalVisits = (existing.totalVisits || 1) + 1;
      existing.formulasOrNotes = `${existing.formulasOrNotes || ""}\nRecent booking: ${data.serviceName} (${new Date().toLocaleDateString()})`.trim();
      saveClientProfiles(clients, ws);
    } else {
      const newClient: ClientProfile = {
        id: "cli_" + Date.now(),
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone,
        totalVisits: 1,
        noShowCount: 0,
        reliabilityScore: 100,
        membershipPlan: "Direct Client",
        cardOnFile: { brand: "Visa", last4: "4242" },
        formulasOrNotes: `Booked ${data.serviceName} via Ovelink.`,
      };
      saveClientProfiles([newClient, ...clients], ws);
    }
  } catch {
    // ignore
  }

  // Reactive events so owner's open dashboard and tabs update immediately
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:booking_created", { detail: newBooking }));
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "booking", ws, booking: newBooking } }));
    } catch {
      // ignore
    }
  }

  return newBooking;
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingRecord["status"],
  workspaceId?: string
) {
  const ws = resolveWorkspace(workspaceId);
  const all = getBookings(ws);
  const updated = all.map((b) => (b.id === bookingId ? { ...b, status } : b));
  saveBookings(updated, ws);
}

export function createQuote(
  data: Omit<QuoteProposal, "id" | "createdAt">,
  workspaceId?: string
): QuoteProposal {
  const ws = resolveWorkspace(workspaceId);
  const all = getQuotes(ws);
  const newQuote: QuoteProposal = {
    ...data,
    id: "qt_" + Date.now(),
    createdAt: new Date().toISOString(),
  };

  saveQuotes([newQuote, ...all], ws);

  // Sync client to CRM if client profile doesn't exist
  if (data.clientEmail) {
    try {
      const clients = getClientProfiles(ws);
      const exists = clients.some((c) => c.email.toLowerCase() === data.clientEmail.toLowerCase());
      if (!exists) {
        const newClient: ClientProfile = {
          id: "cli_" + Date.now(),
          name: data.clientName,
          email: data.clientEmail,
          phone: data.clientPhone || "",
          totalVisits: 0,
          noShowCount: 0,
          reliabilityScore: 100,
          membershipPlan: "Prospective Client",
          formulasOrNotes: `Issued Quote: "${data.title}" ($${(data.totalCents / 100).toFixed(2)})`,
        };
        saveClientProfiles([newClient, ...clients], ws);
      }
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:quote_created", { detail: newQuote }));
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "quote", ws } }));
    } catch {
      // ignore
    }
  }

  return newQuote;
}

export function deleteQuote(quoteId: string, workspaceId?: string): void {
  const ws = resolveWorkspace(workspaceId);
  const all = getQuotes(ws);
  const filtered = all.filter((q) => q.id !== quoteId);
  saveQuotes(filtered, ws);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "quote", ws } }));
    } catch {
      // ignore
    }
  }
}

export function createInvoice(
  data: Omit<InvoiceRecord, "id" | "createdAt">,
  workspaceId?: string
): InvoiceRecord {
  const ws = resolveWorkspace(workspaceId);
  const all = getInvoices(ws);
  const newInvoice: InvoiceRecord = {
    ...data,
    id: "inv_" + Date.now(),
    invoiceNumber:
      data.invoiceNumber ||
      "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
  };

  saveInvoices([newInvoice, ...all], ws);

  // Sync client to CRM if client profile doesn't exist
  if (data.clientEmail) {
    try {
      const clients = getClientProfiles(ws);
      const existing = clients.find((c) => c.email.toLowerCase() === data.clientEmail.toLowerCase());
      if (existing) {
        existing.totalVisits = (existing.totalVisits || 0) + 1;
        saveClientProfiles(clients, ws);
      } else {
        const newClient: ClientProfile = {
          id: "cli_" + Date.now(),
          name: data.clientName,
          email: data.clientEmail,
          phone: "",
          totalVisits: 1,
          noShowCount: 0,
          reliabilityScore: 100,
          membershipPlan: "Direct Client",
          formulasOrNotes: `Manual invoice ${newInvoice.invoiceNumber} recorded.`,
        };
        saveClientProfiles([newClient, ...clients], ws);
      }
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:invoice_created", { detail: newInvoice }));
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "invoice", ws } }));
    } catch {
      // ignore
    }
  }

  return newInvoice;
}

export function deleteInvoice(invoiceId: string, workspaceId?: string): void {
  const ws = resolveWorkspace(workspaceId);
  const all = getInvoices(ws);
  const filtered = all.filter((inv) => inv.id !== invoiceId);
  saveInvoices(filtered, ws);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "invoice", ws } }));
    } catch {
      // ignore
    }
  }
}

export function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceRecord["status"],
  workspaceId?: string
): void {
  const ws = resolveWorkspace(workspaceId);
  const all = getInvoices(ws);
  const updated = all.map((inv) =>
    inv.id === invoiceId
      ? {
          ...inv,
          status,
          paidAt: status === "paid" ? new Date().toISOString() : inv.paidAt,
        }
      : inv
  );
  saveInvoices(updated, ws);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "invoice", ws } }));
    } catch {
      // ignore
    }
  }
}

export function simulateWhatsAppReply(bookingId: string, reply: "1" | "2", workspaceId?: string) {
  const ws = resolveWorkspace(workspaceId);
  const allReminders = getReminders(ws);
  const hasReminder = allReminders.some((r) => r.bookingId === bookingId);

  if (hasReminder) {
    const updatedReminders = allReminders.map((r) => {
      if (r.bookingId === bookingId) {
        return {
          ...r,
          status: reply === "1" ? ("replied_confirmed" as const) : ("replied_cancelled" as const),
        };
      }
      return r;
    });
    saveReminders(updatedReminders, ws);

    if (reply === "1") {
      updateBookingStatus(bookingId, "confirmed", ws);
    } else {
      updateBookingStatus(bookingId, "rescheduled", ws);
    }
    return;
  }

  // Cross-workspace scan if invoked from global webhook
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEY_REMINDERS)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: ReminderLog[] = JSON.parse(raw);
            if (list.some((r) => r.bookingId === bookingId)) {
              const matchedWs = key.replace(`${KEY_REMINDERS}_`, "");
              simulateWhatsAppReply(bookingId, reply, matchedWs);
              return;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

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

export function dispatchWaitlistBlast(
  slotTimeFormatted: string,
  serviceName: string,
  workspaceId?: string
): WaitlistEntry[] {
  const ws = resolveWorkspace(workspaceId);
  const current = getWaitlist(ws);
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
  saveWaitlist(updated, ws);
  return updated;
}

export function claimWaitlistSlot(
  entryId: string,
  staffName: string,
  workspaceId?: string
): BookingRecord | null {
  const ws = resolveWorkspace(workspaceId);
  const entries = getWaitlist(ws);
  const target = entries.find((entry) => entry.id === entryId);
  if (!target || target.status === "claimed") return null;

  const service = getServices(ws).find(
    (item) => item.name.trim().toLowerCase() === target.serviceName.trim().toLowerCase(),
  );
  const staff = getStaff(ws).find(
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

  const booking = createBooking(
    {
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
    },
    { checkConflicts: false, workspaceId: ws }
  );
  if (!booking) return null;

  saveWaitlist(entries.map((entry) => (entry.id === entryId ? { ...entry, status: "claimed" as const } : entry)), ws);
  return booking;
}

/**
 * Moat Feature: 1-Click No-Show & Late-Cancellation Fee via Stripe Card-on-File
 */
export function chargeNoShowFee(
  bookingId: string,
  feeCents = 2500,
  workspaceId?: string
): BookingRecord | null {
  if (!Number.isFinite(feeCents) || feeCents <= 0) return null;
  const ws = resolveWorkspace(workspaceId);
  const bookings = getBookings(ws);
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

  saveBookings(updated, ws);
  return updatedBooking;
}

export function rescheduleBooking(
  bookingId: string,
  startTime: string,
  endTime: string,
  workspaceId?: string
): BookingRecord | null {
  const ws = resolveWorkspace(workspaceId);
  const bookings = getBookings(ws);
  const current = bookings.find((booking) => booking.id === bookingId);
  if (!current || current.status === "cancelled" || current.status === "completed") return null;
  if (hasStaffConflict(bookings, current.staffId, startTime, endTime, current.serviceId, bookingId, ws)) return null;
  const updatedBooking: BookingRecord = {
    ...current,
    startTime,
    endTime,
    status: "rescheduled",
  };
  saveBookings(bookings.map((booking) => (booking.id === bookingId ? updatedBooking : booking)), ws);
  return updatedBooking;
}

export function applyWhatsAppIntent(
  bookingId: string,
  intent: Exclude<WhatsAppIntent, "unknown">,
  workspaceId?: string
) {
  const ws = resolveWorkspace(workspaceId);
  if (intent === "confirm") {
    simulateWhatsAppReply(bookingId, "1", ws);
    return;
  }
  if (intent === "reschedule") {
    simulateWhatsAppReply(bookingId, "2", ws);
    return;
  }
  const reminders = getReminders(ws).map((reminder) =>
    reminder.bookingId === bookingId ? { ...reminder, status: "replied_cancelled" as const } : reminder,
  );
  saveReminders(reminders, ws);
  updateBookingStatus(bookingId, "cancelled", ws);
}

export function applyWhatsAppText(bookingId: string, text: string, workspaceId?: string) {
  const intent = interpretWhatsAppReply(text);
  if (intent === "unknown") return intent;
  applyWhatsAppIntent(bookingId, intent, workspaceId);
  return intent;
}

export function findBookingByToken(
  token: string,
  workspaceId?: string
): { booking: BookingRecord | null; workspaceId: string } {
  const ws = resolveWorkspace(workspaceId);
  const activeBookings = getBookings(ws);
  const found = activeBookings.find((b) => b.rescheduleToken === token);
  if (found) return { booking: found, workspaceId: ws };

  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEY_BOOKINGS)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: BookingRecord[] = JSON.parse(raw);
            const match = list.find((b) => b.rescheduleToken === token);
            if (match) {
              const matchedWs = key.replace(`${KEY_BOOKINGS}_`, "");
              return { booking: match, workspaceId: matchedWs };
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { booking: null, workspaceId: ws };
}
