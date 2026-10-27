export type SubscriptionPlanId = "free" | "growth" | "scale" | "enterprise";

export interface TenantFeatures {
  whatsappReminders: boolean;       // 2-Way Automated WhatsApp Reminders & Receipts
  interactiveQuotes: boolean;       // Interactive Digital Proposals & E-Signatures
  automatedInvoicing: boolean;      // Automated PDF Invoices, Tax & Net Terms
  partialPayments: boolean;         // Multi-Installment Credit & Partial Payments
  themeCustomization: boolean;      // Custom Brand Colors, Fonts & Storefront Banners
  vipPassLinks: boolean;            // Single-Use VIP Passes & Expiring Links
  waitlistRadar: boolean;           // Automated Waitlist Radar & Priority Releases
  staffRoundRobin: boolean;         // Multi-Staff Shift Scheduling & Round-Robin Booking
  treeTableCategories: boolean;     // Hierarchical Nested Tree-Table & Stock Tracking
  cardOnFileSecurity: boolean;      // Card-on-File Tokenization & Cancellation Penalties
  verifiedBadge: boolean;           // Official Verified Storefront Badge (ovel.lk/l/[slug])
  zeroCommissionStripe: boolean;    // Direct Merchant Account Settlement (0% take-rate)
  customDomain: boolean;            // Custom Brand Domain / CNAME
  analyticsDashboard: boolean;      // Conversion & Lifetime Client Analytics
}

export interface FeatureDefinition {
  key: keyof TenantFeatures;
  name: string;
  category: "Messaging" | "Billing" | "Storefront" | "Operations" | "Growth";
  description: string;
  planTierMin: SubscriptionPlanId;
}

export const ALL_PLATFORM_FEATURES: FeatureDefinition[] = [
  {
    key: "whatsappReminders",
    name: "2-Way WhatsApp Reminders",
    category: "Messaging",
    description: "Automated confirmations and interactive '1 to confirm, 2 to reschedule' client replies.",
    planTierMin: "growth",
  },
  {
    key: "interactiveQuotes",
    name: "Digital Quotations & E-Signatures",
    category: "Billing",
    description: "Digital proposals with milestone line-items, legal signature capture, and 1-click invoice conversion.",
    planTierMin: "growth",
  },
  {
    key: "automatedInvoicing",
    name: "Automated Invoicing & Tax",
    category: "Billing",
    description: "Auto deposit crediting, multi-rate tax calculations, and one-click corporate PDF receipts.",
    planTierMin: "growth",
  },
  {
    key: "partialPayments",
    name: "Installments & Net Credit Terms",
    category: "Billing",
    description: "Net 7/15/30 credit terms, multiple milestone installments, and partial payment tracking.",
    planTierMin: "scale",
  },
  {
    key: "themeCustomization",
    name: "Storefront Theme Customizer",
    category: "Storefront",
    description: "Custom brand typography, luxury color palettes, custom hero banners, and monogram avatars.",
    planTierMin: "growth",
  },
  {
    key: "verifiedBadge",
    name: "Official Verified Badge",
    category: "Storefront",
    description: "Verified trust badge on public Ovelink storefront (ovel.lk/l/[slug]).",
    planTierMin: "scale",
  },
  {
    key: "vipPassLinks",
    name: "Single-Use VIP Passes",
    category: "Growth",
    description: "Self-destructing private booking links that burn after 1 redemption for VIP clientele.",
    planTierMin: "growth",
  },
  {
    key: "waitlistRadar",
    name: "Automated Waitlist Radar",
    category: "Growth",
    description: "Automatic waitlist notifications dispatched to queued clients when a slot opens.",
    planTierMin: "scale",
  },
  {
    key: "staffRoundRobin",
    name: "Staff Shifts & Round-Robin",
    category: "Operations",
    description: "Shift buffer calculation, specialist working hours, and fair round-robin appointment distribution.",
    planTierMin: "scale",
  },
  {
    key: "treeTableCategories",
    name: "Tree-Table Categories & Stock",
    category: "Operations",
    description: "Hierarchical parent-child nested categories with tri-state selection and stock control.",
    planTierMin: "free",
  },
  {
    key: "cardOnFileSecurity",
    name: "Card-on-File & No-Show Guard",
    category: "Operations",
    description: "Tokenized payment methods for automated cancellation and no-show fee charging.",
    planTierMin: "free",
  },
  {
    key: "zeroCommissionStripe",
    name: "Direct Merchant Settlement (0% Take-Rate)",
    category: "Billing",
    description: "Direct merchant account payouts with 0% platform commission fee deduction.",
    planTierMin: "free",
  },
  {
    key: "customDomain",
    name: "Custom CNAME Domain Mapping",
    category: "Storefront",
    description: "Route custom business domain directly to merchant Ovelink.",
    planTierMin: "scale",
  },
  {
    key: "analyticsDashboard",
    name: "Advanced Customer CRM & Analytics",
    category: "Growth",
    description: "Lifetime client value, client reliability scores, and booking conversion tracking.",
    planTierMin: "growth",
  },
];

export interface PlanTierConfig {
  id: SubscriptionPlanId;
  name: string;
  priceLkr: number;
  period: "month";
  maxOfferings: number;
  maxMonthlyOrders: number;
  overflowOrderPriceLkr: number;
  tagline: string;
  badge: string;
}

export const ADMIN_PLAN_TIERS: Record<SubscriptionPlanId, PlanTierConfig> = {
  free: {
    id: "free",
    name: "Starter",
    priceLkr: 0,
    period: "month",
    maxOfferings: 3,
    maxMonthlyOrders: 100,
    overflowOrderPriceLkr: 0,
    tagline: "Solo artists & emerging specialists",
    badge: "Free",
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceLkr: 500,
    period: "month",
    maxOfferings: 10,
    maxMonthlyOrders: 500,
    overflowOrderPriceLkr: 0,
    tagline: "Busy studios & automated workflows",
    badge: "Popular",
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceLkr: 1500,
    period: "month",
    maxOfferings: 30,
    maxMonthlyOrders: 1500,
    overflowOrderPriceLkr: 1,
    tagline: "High-volume studio operating system",
    badge: "Verified",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLkr: 4500,
    period: "month",
    maxOfferings: 999,
    maxMonthlyOrders: 10000,
    overflowOrderPriceLkr: 0,
    tagline: "Uncapped atelier network with bespoke support",
    badge: "Custom VIP",
  },
};

export function getDefaultFeaturesForPlan(planId: SubscriptionPlanId): TenantFeatures {
  return {
    whatsappReminders: planId !== "free",
    interactiveQuotes: planId !== "free",
    automatedInvoicing: planId !== "free",
    partialPayments: planId === "scale" || planId === "enterprise",
    themeCustomization: planId !== "free",
    vipPassLinks: planId !== "free",
    waitlistRadar: planId === "scale" || planId === "enterprise",
    staffRoundRobin: planId === "scale" || planId === "enterprise",
    treeTableCategories: true,
    cardOnFileSecurity: true,
    verifiedBadge: planId === "scale" || planId === "enterprise",
    zeroCommissionStripe: true,
    customDomain: planId === "scale" || planId === "enterprise",
    analyticsDashboard: planId !== "free",
  };
}

export interface TenantUser {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  slug: string;
  category: "Salon & Spa" | "Aesthetic Clinic" | "Mobile Detailing" | "Consultant" | "Wellness" | "Artisanal Bakery" | "Studio Rentals" | "Artisan Atelier";
  plan: string; // for backward compatibility
  planId: SubscriptionPlanId;
  planName: string;
  monthlyFeeLkr: number;
  status: "active" | "suspended" | "pending_setup";
  role: "business_owner" | "super_admin" | "staff" | "client";
  joinedDate: string;
  totalBookings: number;
  grossRevenue: number;
  stripeConnected: boolean;
  features: TenantFeatures;
  quotaOverrides?: {
    maxOfferings?: number;
    maxMonthlyOrders?: number;
    customFeeLkr?: number;
    waiveOverflowFee?: boolean;
  };
  notes: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetTenant: string;
  details: string;
}

export const SEED_ADMIN_USERS: TenantUser[] = [
  {
    id: "usr_root",
    businessName: "Ovel Global Platform",
    ownerName: "Platform Administrator",
    email: "admin@ovel.lk",
    phone: "+1 (800) 555-0199",
    slug: "root",
    category: "Consultant",
    plan: "Enterprise ($0/mo)",
    planId: "enterprise",
    planName: "Enterprise Root",
    monthlyFeeLkr: 0,
    status: "active",
    role: "super_admin",
    joinedDate: "2026-08-01",
    totalBookings: 12480,
    grossRevenue: 9840000,
    stripeConnected: true,
    features: {
      whatsappReminders: true,
      interactiveQuotes: true,
      automatedInvoicing: true,
      partialPayments: true,
      themeCustomization: true,
      vipPassLinks: true,
      waitlistRadar: true,
      staffRoundRobin: true,
      treeTableCategories: true,
      cardOnFileSecurity: true,
      verifiedBadge: true,
      zeroCommissionStripe: true,
      customDomain: true,
      analyticsDashboard: true,
    },
    notes: "Master developer platform operator account.",
  },
  {
    id: "usr_leclat",
    businessName: "L'Éclat Boutique",
    ownerName: "Dr. Genevieve Moreau",
    email: "genevieve@ovel.lk",
    phone: "+94 (77) 123-4567",
    slug: "MyBUsiness",
    category: "Aesthetic Clinic",
    plan: "Scale (LKR 1,500/mo)",
    planId: "scale",
    planName: "Scale Tier",
    monthlyFeeLkr: 1500,
    status: "active",
    role: "business_owner",
    joinedDate: "2026-09-12",
    totalBookings: 342,
    grossRevenue: 1850000,
    stripeConnected: true,
    features: getDefaultFeaturesForPlan("scale"),
    notes: "Flagship aesthetic clinic with multiple dermal specialists.",
  },
  {
    id: "usr_apex",
    businessName: "Apex Auto Lab",
    ownerName: "Marcus Vance",
    email: "apex@ovel.lk",
    phone: "+94 (71) 987-6543",
    slug: "apex-studio",
    category: "Mobile Detailing",
    plan: "Growth (LKR 500/mo)",
    planId: "growth",
    planName: "Growth Tier",
    monthlyFeeLkr: 500,
    status: "active",
    role: "business_owner",
    joinedDate: "2026-09-20",
    totalBookings: 128,
    grossRevenue: 940000,
    stripeConnected: true,
    features: getDefaultFeaturesForPlan("growth"),
    notes: "High-end vehicle detailing with multi-stage paint correction packages.",
  },
  {
    id: "usr_bakes",
    businessName: "Velvet Crumb Bakes",
    ownerName: "Sarah Jenkins",
    email: "bakes@ovel.lk",
    phone: "+94 (76) 334-1122",
    slug: "craft-bakes",
    category: "Artisanal Bakery",
    plan: "Starter (Free)",
    planId: "free",
    planName: "Starter Tier",
    monthlyFeeLkr: 0,
    status: "active",
    role: "business_owner",
    joinedDate: "2026-10-01",
    totalBookings: 64,
    grossRevenue: 320000,
    stripeConnected: true,
    features: getDefaultFeaturesForPlan("free"),
    notes: "Artisanal bakery taking custom wedding and event cake bookings.",
  },
  {
    id: "usr_vance",
    businessName: "Vance Production Loft",
    ownerName: "Julian Vance",
    email: "vance@ovel.lk",
    phone: "+94 (70) 555-8899",
    slug: "vance-studio",
    category: "Studio Rentals",
    plan: "Scale (LKR 1,500/mo)",
    planId: "scale",
    planName: "Scale Tier",
    monthlyFeeLkr: 1500,
    status: "active",
    role: "business_owner",
    joinedDate: "2026-09-05",
    totalBookings: 215,
    grossRevenue: 1420000,
    stripeConnected: true,
    features: getDefaultFeaturesForPlan("scale"),
    notes: "Daylight photography cyc with hourly time-slot rentals.",
  },
];

const STORAGE_KEY = "ovel_superadmin_users_v2";
const LOGS_KEY = "ovel_superadmin_logs_v2";
const GLOBAL_OVERRIDES_KEY = "ovel_global_feature_overrides_v1";

export function getAdminUsers(): TenantUser[] {
  if (typeof window === "undefined") return SEED_ADMIN_USERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || !stored.trim() || stored === "undefined" || stored === "null") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ADMIN_USERS));
      return SEED_ADMIN_USERS;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ADMIN_USERS));
    return SEED_ADMIN_USERS;
  } catch {
    return SEED_ADMIN_USERS;
  }
}

export function saveAdminUsers(users: TenantUser[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore quota errors
  }
}

export function addAdminUser(user: Partial<TenantUser> & { businessName: string; email: string; ownerName: string }): TenantUser {
  const users = getAdminUsers();
  const planId: SubscriptionPlanId = user.planId || "growth";
  const planConfig = ADMIN_PLAN_TIERS[planId];

  const newUser: TenantUser = {
    id: "usr_" + Math.random().toString(36).substring(2, 9),
    businessName: user.businessName,
    ownerName: user.ownerName,
    email: user.email,
    phone: user.phone || "+94 (77) 000-0000",
    slug: user.slug || user.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category: user.category || "Consultant",
    plan: `${planConfig.name} (LKR ${planConfig.priceLkr}/mo)`,
    planId,
    planName: planConfig.name,
    monthlyFeeLkr: planConfig.priceLkr,
    status: user.status || "active",
    role: user.role || "business_owner",
    joinedDate: new Date().toISOString().split("T")[0],
    totalBookings: 0,
    grossRevenue: 0,
    stripeConnected: true,
    features: user.features || getDefaultFeaturesForPlan(planId),
    quotaOverrides: user.quotaOverrides,
    notes: user.notes || "New merchant registered by administrator.",
  };

  const updated = [newUser, ...users];
  saveAdminUsers(updated);
  addAdminLog("CREATE_USER", newUser.businessName, `Added user ${newUser.email} under ${planConfig.name} plan.`);
  return newUser;
}

export function updateAdminUser(userId: string, updates: Partial<TenantUser>): TenantUser | null {
  const users = getAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const updatedUser: TenantUser = {
    ...current,
    ...updates,
    features: {
      ...current.features,
      ...(updates.features || {}),
    },
  };

  users[index] = updatedUser;
  saveAdminUsers(users);
  addAdminLog("UPDATE_USER", updatedUser.businessName, `Modified profile/settings for ${updatedUser.email}.`);
  return updatedUser;
}

export function deleteAdminUser(userId: string): boolean {
  const users = getAdminUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) return false;

  const filtered = users.filter((u) => u.id !== userId);
  saveAdminUsers(filtered);
  addAdminLog("DELETE_USER", target.businessName, `Permanently removed tenant user ${target.email}.`);
  return true;
}

export function toggleUserFeature(userId: string, featureKey: keyof TenantFeatures, explicitState?: boolean): boolean {
  const users = getAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const nextVal = explicitState !== undefined ? explicitState : !user.features[featureKey];
  user.features[featureKey] = nextVal;
  saveAdminUsers(users);

  addAdminLog(
    nextVal ? "ENABLE_FEATURE" : "DISABLE_FEATURE",
    user.businessName,
    `${nextVal ? "Enabled" : "Disabled"} feature '${featureKey}' for ${user.email}.`
  );
  return nextVal;
}

export function enableAllUserFeatures(userId: string): boolean {
  const users = getAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const allEnabled: TenantFeatures = {
    whatsappReminders: true,
    interactiveQuotes: true,
    automatedInvoicing: true,
    partialPayments: true,
    themeCustomization: true,
    vipPassLinks: true,
    waitlistRadar: true,
    staffRoundRobin: true,
    treeTableCategories: true,
    cardOnFileSecurity: true,
    verifiedBadge: true,
    zeroCommissionStripe: true,
    customDomain: true,
    analyticsDashboard: true,
  };

  user.features = allEnabled;
  saveAdminUsers(users);
  addAdminLog("ENABLE_ALL_FEATURES", user.businessName, `Granted all platform features to ${user.email}.`);
  return true;
}

export function disableAllUserFeatures(userId: string): boolean {
  const users = getAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const allDisabled: TenantFeatures = {
    whatsappReminders: false,
    interactiveQuotes: false,
    automatedInvoicing: false,
    partialPayments: false,
    themeCustomization: false,
    vipPassLinks: false,
    waitlistRadar: false,
    staffRoundRobin: false,
    treeTableCategories: false,
    cardOnFileSecurity: false,
    verifiedBadge: false,
    zeroCommissionStripe: false,
    customDomain: false,
    analyticsDashboard: false,
  };

  user.features = allDisabled;
  saveAdminUsers(users);
  addAdminLog("DISABLE_ALL_FEATURES", user.businessName, `Disabled all features for ${user.email}.`);
  return true;
}

export function resetUserFeaturesToPlan(userId: string): boolean {
  const users = getAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  user.features = getDefaultFeaturesForPlan(user.planId);
  saveAdminUsers(users);
  addAdminLog("RESET_FEATURES_TO_PLAN", user.businessName, `Restored default ${user.planName} features for ${user.email}.`);
  return true;
}

export function updateUserPlan(userId: string, planId: SubscriptionPlanId): boolean {
  const users = getAdminUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;

  const planConfig = ADMIN_PLAN_TIERS[planId];
  user.planId = planId;
  user.planName = planConfig.name;
  user.monthlyFeeLkr = planConfig.priceLkr;
  user.plan = `${planConfig.name} (LKR ${planConfig.priceLkr}/mo)`;
  user.features = getDefaultFeaturesForPlan(planId);

  saveAdminUsers(users);
  addAdminLog("CHANGE_PLAN", user.businessName, `Switched tier to ${planConfig.name} (LKR ${planConfig.priceLkr}/mo).`);
  return true;
}

export const DEFAULT_LOGS: AdminAuditLog[] = [
  {
    id: "log_init_01",
    timestamp: "2026-10-27 05:45:12",
    actor: "System Kernel",
    action: "SYSTEM_BOOT",
    targetTenant: "Global Infrastructure",
    details: "Admin OS initialized with zero-commission enforcement and 14 active feature flags.",
  },
];

export function getAdminLogs(): AdminAuditLog[] {
  if (typeof window === "undefined") return DEFAULT_LOGS;
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    if (!stored || !stored.trim() || stored === "undefined" || stored === "null") {
      localStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_LOGS;
  } catch {
    return DEFAULT_LOGS;
  }
}

export function addAdminLog(action: string, targetTenant: string, details: string) {
  if (typeof window === "undefined") return;
  const current = getAdminLogs();
  const newLog: AdminAuditLog = {
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    actor: "Administrator (admin@ovel.lk)",
    action,
    targetTenant,
    details,
  };
  const updated = [newLog, ...current].slice(0, 100);
  localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
}

export function clearAdminLogs() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGS_KEY, JSON.stringify([]));
}
