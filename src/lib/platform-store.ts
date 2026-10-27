/**
 * Ovel Complete Commercial Loop Platform Store
 * Bridges Supabase entities with in-memory persistence:
 * Quote -> Book -> Remind -> Invoice -> Paid
 */

import { WeeklyWorkingHours } from "./slot-engine";
import { addMinutes, displayTimeToIsoLocal, localDateString } from "./booking-time";
import { emitStoreChange } from "./store-events";
import { interpretWhatsAppReply, WhatsAppIntent } from "./whatsapp-reply";
import { formatCurrency } from "./currency";

export interface UniversalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  targetType: "services" | "products" | "both";
  parentId?: string | null;
  subCategories?: UniversalCategory[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface ServiceSubCategory {
  id: string;
  name: string;
  description?: string;
  pricingType?: "fixed" | "range";
  priceCents: number;
  priceMaxCents?: number;
  durationMinutes: number;
  durationMode?: "fixed" | "around";
  depositRequired?: boolean;
  depositCents?: number;
  subCategories?: ServiceSubCategory[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category?: string;
  categoryId?: string;
  subCategoryId?: string;
  pricingType?: "fixed" | "range"; // fixed price or price range
  priceCents: number;              // base price (or range minimum)
  priceMaxCents?: number;          // range maximum if pricingType === "range"
  durationMinutes: number;
  durationMode?: "fixed" | "around"; // fixed duration or approximate/around
  depositRequired?: boolean;       // requires advanced deposit or not
  depositCents: number;
  bufferAfterMinutes: number;
  subCategories?: ServiceSubCategory[]; // nested subcategories (which can also have subcategories)
  imageUrl?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isActive: boolean;
}

export function formatServicePrice(
  service: Pick<ServiceItem, "priceCents" | "pricingType" | "priceMaxCents">,
  currency: string = "LKR"
): string {
  if (service.pricingType === "range" && service.priceMaxCents && service.priceMaxCents > service.priceCents) {
    return `${formatCurrency(service.priceCents, currency)} – ${formatCurrency(service.priceMaxCents, currency)}`;
  }
  return formatCurrency(service.priceCents, currency);
}

export function formatServiceDuration(
  service: Pick<ServiceItem, "durationMinutes" | "durationMode">
): string {
  const mins = service.durationMinutes || 0;
  if (service.durationMode === "around") {
    return `~${mins} mins (approx)`;
  }
  return `${mins} mins`;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  depositCents?: number;
  sku?: string;
  stockCount: number;
  category: string;
  categoryId?: string;
  subCategoryId?: string;
  subCategories?: ServiceSubCategory[];
  badge?: string;
  requiresShipping?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
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

export interface InvoiceLineItem {
  id?: string;
  type?: "product" | "service" | "custom";
  itemId?: string; // productId or serviceId
  description: string;
  quantity?: number;
  unitPrice?: number;
  unitPriceCents?: number;
  priceCents: number; // total line amount
}

export type QuoteFulfillmentType = "none" | "appointment" | "delivery" | "project";

export interface QuoteProposal {
  id: string;
  quoteNumber?: string;
  title: string;
  fulfillmentType?: QuoteFulfillmentType;
  requiresScheduling?: boolean;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  clientAddress?: string;
  scopeDescription?: string;
  lineItems: InvoiceLineItem[];
  optionalAddOns: { id: string; description: string; priceCents: number; selected: boolean }[];
  subtotalCents?: number;
  discountCents?: number;
  discountPercentage?: number;
  taxCents?: number;
  taxRate?: number;
  totalCents: number;
  depositCents: number;
  requireDeposit?: boolean;
  requireSignature?: boolean;
  notes?: string;
  termsAndConditions?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  paymentMethodDetails?: string;
  status: "draft" | "sent" | "accepted" | "converted";
  signatureData?: string;
  signatureSvg?: string;
  expiresAt: string;
  issuedAt?: string;
  convertedBookingId?: string;
  convertedInvoiceId?: string;
  createdAt: string;
}

export type PaymentMethodType = "bank_transfer" | "card" | "cash" | "online_gateway" | "custom";

export interface PaymentAccount {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  isDefault?: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchName?: string;
  swiftOrRouting?: string;
  gatewayProvider?: string;
  instructions?: string;
  createdAt: string;
}

export type PaymentCreditTerms = "due_on_receipt" | "net_7" | "net_15" | "net_30" | "net_60" | "custom";

export interface PaymentEntry {
  id: string;
  amountCents: number;
  paidAt: string;
  paymentMethod: string;
  reference?: string;
  note?: string;
}

export interface InvoiceRecord {
  id: string;
  bookingId: string;
  quoteId?: string;
  quoteNumber?: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientAddress?: string;
  itemsSummary?: string;
  lineItems?: InvoiceLineItem[];
  notes?: string;
  paymentMethod?: string;
  subtotalCents: number;
  depositCreditedCents: number;
  taxCents: number;
  taxPercent?: number;
  totalCents?: number;
  paidAmountCents?: number;
  balanceDueCents: number;

  // Credit Period & Payment Terms
  creditTerms?: PaymentCreditTerms;
  creditPeriodDays?: number;
  issueDate?: string;
  dueDate?: string;

  // Partial Payments & History
  payments?: PaymentEntry[];

  status: "draft" | "sent" | "partial" | "paid" | "overdue";
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

export const INITIAL_SERVICES: ServiceItem[] = [];

export const INITIAL_PRODUCTS: ProductItem[] = [];

export const INITIAL_CATEGORIES: UniversalCategory[] = [];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "st_genevieve",
    name: "Dr. Genevieve Moreau",
    email: "genevieve@ovel.lk",
    role: "Lead Clinical Aesthetician & Dermatologist",
    workingHours: DEFAULT_WORKING_HOURS,
    isActive: true,
  },
  {
    id: "st_camille",
    name: "Camille Laurent",
    email: "camille@ovel.lk",
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
    id: "bk_marcus_urzyi818",
    serviceId: "srv_complexion_consult",
    serviceName: "Aesthetic Complexion Consultation",
    staffId: "st_genevieve",
    staffName: "Dr. Genevieve Moreau",
    clientName: "Marcus Sterling",
    clientEmail: "marcus.sterling@atelier.com",
    clientPhone: "+1 (415) 890-4421",
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
    id: "cp_marcus",
    name: "Marcus Sterling",
    email: "marcus.sterling@atelier.com",
    phone: "+1 (415) 890-4421",
    totalVisits: 1,
    noShowCount: 0,
    reliabilityScore: 100,
    formulasOrNotes: "Comprehensive barrier assessment. Exploring custom restorative serums.",
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
    id: "inv_marcus_urzyi818",
    bookingId: "bk_marcus_urzyi818",
    invoiceNumber: "INV-2026-1049",
    clientName: "Marcus Sterling",
    clientEmail: "marcus.sterling@atelier.com",
    subtotalCents: 12000,
    depositCreditedCents: 3500,
    taxCents: 0,
    balanceDueCents: 8500,
    status: "sent",
    createdAt: "2026-10-11T09:05:00.000Z",
  },
];

export const INITIAL_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: "pm_bank_main",
    name: "Commercial Bank - Corporate Account",
    type: "bank_transfer",
    isActive: true,
    isDefault: true,
    bankName: "Commercial Bank of Ceylon",
    accountName: "Ovel Platform Private Limited",
    accountNumber: "8002938471",
    branchName: "Colombo Corporate Branch",
    swiftOrRouting: "CCEYLKFX",
    instructions: "Please quote your Quote or Invoice ID in the transfer remarks and upload or email the bank remittance slip.",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "pm_stripe_online",
    name: "Stripe Online Card Checkout",
    type: "online_gateway",
    isActive: true,
    isDefault: false,
    gatewayProvider: "Stripe",
    instructions: "Direct 0% take-rate card checkout with TLS 256-bit encryption.",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "pm_cash_counter",
    name: "Cash on Delivery / In-Clinic Counter",
    type: "cash",
    isActive: true,
    isDefault: false,
    instructions: "Settle in cash at the counter or upon delivery of items.",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
];

export const INITIAL_REMINDERS: ReminderLog[] = [];

const KEY_SERVICES = "ovel_services_v1";
const KEY_PRODUCTS = "ovel_products_v1";
const KEY_CATEGORIES = "ovel_categories_v1";
const KEY_STAFF = "ovel_staff_v1";
const KEY_BOOKINGS = "ovel_bookings_v1";
const KEY_QUOTES = "ovel_quotes_v1";
const KEY_INVOICES = "ovel_invoices_v1";
const KEY_REMINDERS = "ovel_reminders_v1";
const KEY_WAITLIST = "ovel_waitlist_v1";
const KEY_CLIENT_PROFILES = "ovel_client_profiles_v1";
const KEY_PAYMENT_ACCOUNTS = "ovel_payment_accounts_v1";

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

const KEY_WORKSPACE_ALIASES = "ovel_workspace_aliases_v1";

function readWorkspaceAliasRegistry(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY_WORKSPACE_ALIASES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

/**
 * Persist every alias that has held data for a workspace. This lets account
 * deletion find keys written under an older slug after a business was renamed.
 */
function registerWorkspaceAliases(workspaceId: string, aliases: string[]): void {
  if (typeof window === "undefined" || !workspaceId) return;
  try {
    const registry = readWorkspaceAliasRegistry();
    const tracked = new Set<string>(registry[workspaceId] || []);
    for (const alias of aliases) {
      if (alias) tracked.add(alias);
    }
    registry[workspaceId] = Array.from(tracked).slice(-100);
    localStorage.setItem(KEY_WORKSPACE_ALIASES, JSON.stringify(registry));
  } catch {
    // ignore
  }
}

export function getRegisteredWorkspaceAliases(workspaceId: string): string[] {
  if (!workspaceId) return [];
  const tracked = readWorkspaceAliasRegistry()[workspaceId];
  return Array.isArray(tracked) ? tracked.filter((alias) => typeof alias === "string" && alias) : [];
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
          if (!item) continue;
          const wLower = workspaceOrSlug.toLowerCase();
          const itemOrgLower = item.organizationId ? item.organizationId.toLowerCase() : "";
          const itemSlugLower = item.slug ? item.slug.toLowerCase() : "";
          const slugLower = slug.toLowerCase();

          const matches =
            itemOrgLower === wLower ||
            itemSlugLower === wLower ||
            slugLower === wLower ||
            (wLower.startsWith("org_") && itemOrgLower === wLower.substring(4)) ||
            (itemOrgLower.startsWith("org_") && itemOrgLower.substring(4) === wLower) ||
            (wLower.startsWith("org_") && itemSlugLower === wLower.substring(4)) ||
            (wLower.startsWith("org_") && slugLower === wLower.substring(4));

          if (matches) {
            if (slug) set.add(slug);
            if (item.slug) set.add(item.slug);
            if (item.organizationId) {
              set.add(item.organizationId);
              if (item.organizationId.startsWith("org_")) {
                set.add(item.organizationId.substring(4));
              } else {
                set.add(`org_${item.organizationId}`);
              }
            }
          }
        }
      }
    } catch {
      // ignore
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
  registerWorkspaceAliases(ws, aliases);
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
        const serviceOfferings = item.offerings.filter((o: { type?: string }) => o.type !== "order");
        if (serviceOfferings.length > 0) {
          return serviceOfferings.map((o: {
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
            description: o.description || "Custom service delivery.",
            durationMinutes: o.durationMinutes || 45,
            priceCents: typeof o.priceCents === "number" ? o.priceCents : 0,
            depositCents: typeof o.depositCents === "number" ? o.depositCents : 0,
            bufferAfterMinutes: 15,
            isActive: o.isActive !== false,
          }));
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function getProductsFromStoredOvelink(workspaceId?: string): ProductItem[] {
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
        const orderOfferings = item.offerings.filter((o: { type?: string }) => o.type === "order");
        if (orderOfferings.length > 0) {
          return orderOfferings.map((o: {
            id: string;
            name: string;
            description?: string;
            priceCents?: number;
            depositCents?: number;
            badge?: string;
            category?: string;
            categoryId?: string;
            subCategoryId?: string;
            subCategories?: any[];
            imageUrl?: string;
            imageUrls?: string[];
            stockCount?: number;
            sku?: string;
            slug?: string;
            isActive?: boolean;
          }) => ({
            id: o.id,
            name: o.name,
            description: o.description || "Retail product item.",
            priceCents: typeof o.priceCents === "number" ? o.priceCents : 0,
            depositCents: typeof o.depositCents === "number" ? o.depositCents : 0,
            stockCount: typeof o.stockCount === "number" ? o.stockCount : 25,
            sku: o.sku,
            category: o.category || "Products",
            categoryId: o.categoryId,
            subCategoryId: o.subCategoryId,
            subCategories: o.subCategories,
            imageUrl: o.imageUrl,
            imageUrls: o.imageUrls,
            badge: o.badge,
            slug: o.slug,
            requiresShipping: true,
            isActive: o.isActive !== false,
          }));
        }
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

export const getProducts = (workspaceId?: string): ProductItem[] => {
  const existing = safeGet(KEY_PRODUCTS, INITIAL_PRODUCTS, workspaceId);
  if (existing && existing.length > 0) {
    return existing;
  }
  const fromOvelink = getProductsFromStoredOvelink(workspaceId);
  if (fromOvelink && fromOvelink.length > 0) {
    return fromOvelink;
  }
  return existing;
};
export const saveProducts = (data: ProductItem[], workspaceId?: string) =>
  safeSet(KEY_PRODUCTS, data, workspaceId);

export const getCategories = (workspaceId?: string): UniversalCategory[] =>
  safeGet(KEY_CATEGORIES, INITIAL_CATEGORIES, workspaceId);

export const saveCategories = (data: UniversalCategory[], workspaceId?: string) =>
  safeSet(KEY_CATEGORIES, data, workspaceId);

export function deductInventoryForLineItems(
  items: Array<{ productId?: string; itemId?: string; quantity?: number }>,
  workspaceId?: string
): void {
  const ws = resolveWorkspace(workspaceId);
  const products = getProducts(ws);
  let changed = false;

  const updatedProducts = products.map((prod) => {
    const matched = items.find(
      (i) => (i.productId && i.productId === prod.id) || (i.itemId && i.itemId === prod.id)
    );
    const qty = matched?.quantity ?? 1;
    if (matched && qty > 0) {
      changed = true;
      const currentStock = prod.stockCount || 0;
      const newStock = Math.max(0, currentStock - qty);
      return { ...prod, stockCount: newStock };
    }
    return prod;
  });

  if (changed) {
    saveProducts(updatedProducts, ws);
  }
}

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

export const getPaymentAccounts = (workspaceId?: string): PaymentAccount[] =>
  safeGet(KEY_PAYMENT_ACCOUNTS, INITIAL_PAYMENT_ACCOUNTS, workspaceId);
export const savePaymentAccounts = (data: PaymentAccount[], workspaceId?: string) =>
  safeSet(KEY_PAYMENT_ACCOUNTS, data, workspaceId);

const WORKSPACE_DATA_KEYS = [
  KEY_SERVICES,
  KEY_PRODUCTS,
  KEY_CATEGORIES,
  KEY_STAFF,
  KEY_BOOKINGS,
  KEY_QUOTES,
  KEY_INVOICES,
  KEY_REMINDERS,
  KEY_WAITLIST,
  KEY_CLIENT_PROFILES,
  KEY_PAYMENT_ACCOUNTS,
  "ovel_merchant_subscriptions",
  "ovel_reviews_v2",
  "ovel_reputation_config_v2",
];

const WORKSPACE_PROPERTY_PREFIXES = [
  "ovel_business_type_",
  "ovel_custom_slug_",
  "ovel_custom_name_",
  "ovel_custom_avatar_",
  "ovelink_customization_",
  "ovel_onboarding_completed_",
];

const GLOBAL_DEMO_DATA_KEYS = [
  ...WORKSPACE_DATA_KEYS,
  "ovel_reviews_v1",
  "ovel_reputation_config_v1",
  "ovel_onboarding_completed",
  "ovel_selected_business_type",
];

/**
 * Remove every localStorage record owned by a workspace. Scoped keys use the
 * `<base>_<workspaceAlias>` format, so we must remove the org id, the raw user
 * id, the current slug, and any older aliases recorded for the workspace.
 */
export function purgeWorkspaceStorage(
  workspaceIds: string[],
  aliases: string[] = []
): number {
  if (typeof window === "undefined") return 0;

  const ids = Array.from(new Set([...workspaceIds, ...aliases].filter(Boolean)));
  const isDemoWorkspace = workspaceIds.some((id) => id === "demo" || id === "root" || id === "org_root");
  let removed = 0;

  const removeKey = (key: string) => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removed += 1;
      }
    } catch {
      // ignore
    }
  };

  for (const id of ids) {
    for (const baseKey of WORKSPACE_DATA_KEYS) {
      removeKey(`${baseKey}_${id}`);
      // Older releases stored the same records without the `_v1/_v2` suffix.
      removeKey(`${baseKey.replace(/_v\d+$/, "")}_${id}`);
    }
    for (const prefix of WORKSPACE_PROPERTY_PREFIXES) {
      removeKey(`${prefix}${id}`);
    }
  }

  if (isDemoWorkspace) {
    for (const key of GLOBAL_DEMO_DATA_KEYS) removeKey(key);
  }

  try {
    const activeWorkspace = localStorage.getItem("ovel_active_workspace_id");
    if (activeWorkspace && ids.includes(activeWorkspace)) {
      removeKey("ovel_active_workspace_id");
    }
  } catch {
    // ignore
  }

  try {
    const registry = readWorkspaceAliasRegistry();
    let registryChanged = false;
    for (const id of ids) {
      if (registry[id]) {
        delete registry[id];
        registryChanged = true;
      }
    }
    if (registryChanged) {
      if (Object.keys(registry).length === 0) {
        removeKey(KEY_WORKSPACE_ALIASES);
      } else {
        localStorage.setItem(KEY_WORKSPACE_ALIASES, JSON.stringify(registry));
      }
    }
  } catch {
    // ignore
  }

  clearSnapshotCache();
  emitStoreChange();
  return removed;
}

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
  const bufferMinutes = services.find((service) => service.id === booking.serviceId)?.bufferAfterMinutes ?? 15;
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
          formulasOrNotes: `Issued Quote: "${data.title}" (${formatCurrency(data.totalCents)})`,
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
  const target = all.find((inv) => inv.id === invoiceId);
  if (target && status === "paid" && target.status !== "paid" && target.lineItems && target.lineItems.length > 0) {
    deductInventoryForLineItems(target.lineItems, ws);
  }
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

export function calculateDueDate(
  issueDate: string,
  creditTerms: PaymentCreditTerms = "due_on_receipt",
  customDays?: number
): string {
  const base = issueDate ? new Date(issueDate) : new Date();
  if (isNaN(base.getTime())) return new Date().toISOString();

  let days = 0;
  switch (creditTerms) {
    case "net_7":
      days = 7;
      break;
    case "net_15":
      days = 15;
      break;
    case "net_30":
      days = 30;
      break;
    case "net_60":
      days = 60;
      break;
    case "custom":
      days = customDays && customDays > 0 ? customDays : 30;
      break;
    case "due_on_receipt":
    default:
      days = 0;
      break;
  }

  const due = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return due.toISOString();
}

export function recordInvoicePayment(
  invoiceId: string,
  payment: Omit<PaymentEntry, "id">,
  workspaceId?: string
): InvoiceRecord | null {
  const ws = resolveWorkspace(workspaceId);
  const all = getInvoices(ws);
  const target = all.find((inv) => inv.id === invoiceId);
  if (!target) return null;

  const newEntry: PaymentEntry = {
    ...payment,
    id: "pay_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    paidAt: payment.paidAt || new Date().toISOString(),
  };

  const existingPayments = target.payments || [];
  const updatedPayments = [...existingPayments, newEntry];

  // Total invoice cost
  const totalCents = target.totalCents || (target.subtotalCents + target.taxCents);
  const depositCredited = target.depositCreditedCents || 0;

  // Total paid = deposit + all recorded payments
  const paymentsSum = updatedPayments.reduce((acc, p) => acc + (p.amountCents || 0), 0);
  const totalPaid = depositCredited + paymentsSum;
  const balanceDue = Math.max(0, totalCents - totalPaid);

  let newStatus: InvoiceRecord["status"] = target.status;
  if (balanceDue === 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    newStatus = "partial";
  }

  const updatedInvoice: InvoiceRecord = {
    ...target,
    totalCents,
    payments: updatedPayments,
    paidAmountCents: totalPaid,
    balanceDueCents: balanceDue,
    status: newStatus,
    paidAt: newStatus === "paid" ? (target.paidAt || newEntry.paidAt) : target.paidAt,
  };

  const updatedList = all.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv));
  saveInvoices(updatedList, ws);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("ovel:invoice_payment_recorded", {
          detail: { invoice: updatedInvoice, payment: newEntry },
        })
      );
      window.dispatchEvent(new CustomEvent("ovel:data_updated", { detail: { type: "invoice", ws } }));
    } catch {
      // ignore
    }
  }

  return updatedInvoice;
}

export function convertQuoteToInvoice(
  quoteId: string,
  options?: {
    creditTerms?: PaymentCreditTerms;
    creditPeriodDays?: number;
    dueDate?: string;
    issueDate?: string;
    initialPaymentCents?: number;
    initialPaymentMethod?: string;
    notes?: string;
  },
  workspaceId?: string
): InvoiceRecord | null {
  const ws = resolveWorkspace(workspaceId);
  const quotes = getQuotes(ws);
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) return null;

  const issueDate = options?.issueDate || new Date().toISOString();
  const creditTerms = options?.creditTerms || "net_30";
  const creditDays =
    options?.creditPeriodDays !== undefined
      ? options.creditPeriodDays
      : creditTerms === "net_7"
      ? 7
      : creditTerms === "net_15"
      ? 15
      : creditTerms === "net_30"
      ? 30
      : creditTerms === "net_60"
      ? 60
      : 0;
  const dueDate = options?.dueDate || calculateDueDate(issueDate, creditTerms, creditDays);

  const subtotalCents = quote.subtotalCents || (quote.totalCents - (quote.taxCents || 0));
  const taxCents = quote.taxCents || 0;
  const totalCents = quote.totalCents || (subtotalCents + taxCents);
  const depositCreditedCents = quote.depositCents || 0;

  const payments: PaymentEntry[] = [];
  if (depositCreditedCents > 0) {
    payments.push({
      id: "pay_dep_" + Date.now(),
      amountCents: depositCreditedCents,
      paidAt: quote.createdAt || issueDate,
      paymentMethod: quote.paymentMethodName || "Upfront Deposit",
      reference: "Deposit Credited from Quote " + (quote.quoteNumber || quote.id),
      note: "Authorized & credited from accepted quotation",
    });
  }

  if (options?.initialPaymentCents && options.initialPaymentCents > 0) {
    payments.push({
      id: "pay_init_" + Date.now(),
      amountCents: options.initialPaymentCents,
      paidAt: issueDate,
      paymentMethod: options.initialPaymentMethod || "Direct Payment",
      reference: "Initial Payment on Acceptance",
      note: "Partial payment recorded during invoice generation",
    });
  }

  const totalPaid = payments.reduce((acc, p) => acc + p.amountCents, 0);
  const balanceDueCents = Math.max(0, totalCents - totalPaid);

  let initialStatus: InvoiceRecord["status"] = "sent";
  if (balanceDueCents === 0) {
    initialStatus = "paid";
  } else if (totalPaid > 0) {
    initialStatus = "partial";
  }

  const invoiceNumber =
    "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

  const newInvoice = createInvoice(
    {
      invoiceNumber,
      bookingId: quote.convertedBookingId || "",
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      clientCompany: quote.clientCompany,
      clientAddress: quote.clientAddress,
      itemsSummary: `${quote.title} (${quote.lineItems?.length || 0} line items)`,
      lineItems: quote.lineItems || [],
      notes: options?.notes || quote.notes || `Generated from Accepted Quotation: ${quote.quoteNumber || quote.title}`,
      paymentMethod: options?.initialPaymentMethod || quote.paymentMethodName || "Bank Transfer",
      subtotalCents,
      depositCreditedCents,
      taxCents,
      totalCents,
      paidAmountCents: totalPaid,
      balanceDueCents,
      creditTerms,
      creditPeriodDays: creditDays,
      issueDate,
      dueDate,
      payments,
      status: initialStatus,
      paidAt: initialStatus === "paid" ? issueDate : undefined,
    },
    ws
  );

  // Update quote status to "converted" and save convertedInvoiceId
  const updatedQuotes = quotes.map((q) =>
    q.id === quote.id
      ? {
          ...q,
          status: "converted" as const,
          convertedInvoiceId: newInvoice.id,
        }
      : q
  );
  saveQuotes(updatedQuotes, ws);

  return newInvoice;
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
      serviceId: service?.id ?? (target.serviceName.toLowerCase().includes("complexion") ? "srv_complexion_consult" : "srv_waitlist"),
      serviceName: target.serviceName,
      staffId: staff?.id ?? staffIdFromName(staffName),
      staffName: staff?.name ?? staffName,
      clientName: target.clientName,
      clientEmail: target.clientEmail,
      clientPhone: target.clientPhone,
      startTime,
      endTime,
      status: "confirmed",
      totalPriceCents: service?.priceCents ?? (target.serviceName.toLowerCase().includes("complexion") ? 12000 : 0),
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
      notes: `${booking.notes || ""} [Enforced 24h late policy: ${formatCurrency(feeCents)} no-show fee charged to card •••• ${booking.cardLast4}]`.trim(),
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

export function findQuoteById(
  quoteId: string,
  workspaceId?: string
): { quote: QuoteProposal | null; workspaceId: string } {
  const ws = resolveWorkspace(workspaceId);
  const activeQuotes = getQuotes(ws);
  const found = activeQuotes.find((q) => q.id === quoteId);
  if (found) return { quote: found, workspaceId: ws };

  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(KEY_QUOTES)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: QuoteProposal[] = JSON.parse(raw);
            const match = list.find((q) => q.id === quoteId);
            if (match) {
              const matchedWs = key === KEY_QUOTES ? ws : key.replace(`${KEY_QUOTES}_`, "");
              return { quote: match, workspaceId: matchedWs };
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { quote: null, workspaceId: ws };
}
