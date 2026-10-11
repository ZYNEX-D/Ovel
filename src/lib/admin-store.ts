export interface TenantUser {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  slug: string;
  category: "Salon & Spa" | "Aesthetic Clinic" | "Mobile Detailing" | "Consultant" | "Wellness";
  plan: "Pilot ($39/mo)" | "Growth ($79/mo)" | "Scale ($149/mo)";
  status: "active" | "suspended" | "pending_setup";
  joinedDate: string;
  totalBookings: number;
  grossRevenue: number;
  stripeConnected: boolean;
  features: {
    whatsappReminders: boolean;
    zeroCommissionStripe: boolean;
    automatedInvoicing: boolean;
    aiReceptionist: boolean;
    calendarSync: boolean;
    customDomain: boolean;
    interactiveQuotes: boolean;
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

const DEFAULT_USERS: TenantUser[] = [];

const STORAGE_KEY = "ovel_superadmin_users_v1";
const LOGS_KEY = "ovel_superadmin_logs_v1";

export function getAdminUsers(): TenantUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || !stored.trim() || stored === "undefined" || stored === "null") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (u) =>
          !["usr_1", "usr_2", "usr_3", "usr_4"].includes(u.id) &&
          !u.email?.includes("leclat.clinic") &&
          !u.email?.includes("apexdetailing.io") &&
          !u.email?.includes("maisonprivee.fr") &&
          !u.email?.includes("kineticlab.co")
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
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

export const DEFAULT_LOGS: AdminAuditLog[] = [];

export function getAdminLogs(): AdminAuditLog[] {
  if (typeof window === "undefined") return DEFAULT_LOGS;
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    if (!stored || !stored.trim() || stored === "undefined" || stored === "null") {
      localStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(
        (l) => !["log_1", "log_2", "log_3", "log_4", "log_5"].includes(l.id)
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(LOGS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
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
    actor: "Developer / Master Admin",
    action,
    targetTenant,
    details,
  };
  const updated = [newLog, ...current].slice(0, 50);
  localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
}
