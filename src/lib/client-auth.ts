/**
 * Ovel Client Authentication & Portal Engine
 * Enables frictionless client signup (Name, Phone, Password) and portal access
 */

import { getBookings, saveBookings, BookingRecord, INITIAL_BOOKINGS } from "@/lib/platform-store";
import { submitCustomerReview } from "@/lib/reviews-store";
import { emitStoreChange } from "@/lib/store-events";

export interface ClientAccount {
  id: string;
  fullName: string;
  phone: string;
  password?: string;
  keepSignedIn: boolean;
  avatarUrl?: string;
  createdAt: string;
}

const STORAGE_KEY_CLIENT_ACCOUNTS = "ovel_client_accounts";
const STORAGE_KEY_ACTIVE_CLIENT = "ovel_active_client_session";

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "").trim();
}

export function getAllClientAccounts(): ClientAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENT_ACCOUNTS);
    if (!raw) return [];
    return JSON.parse(raw) as ClientAccount[];
  } catch {
    return [];
  }
}

function saveClientAccounts(accounts: ClientAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CLIENT_ACCOUNTS, JSON.stringify(accounts));
    emitStoreChange(STORAGE_KEY_CLIENT_ACCOUNTS);
  } catch {
    // ignore
  }
}

export function getActiveClientSession(): ClientAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_CLIENT);
    if (!raw) return null;
    return JSON.parse(raw) as ClientAccount;
  } catch {
    return null;
  }
}

export function setActiveClientSession(account: ClientAccount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CLIENT, JSON.stringify(account));
    emitStoreChange(STORAGE_KEY_ACTIVE_CLIENT);
  } catch {
    // ignore
  }
}

export function clearActiveClientSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CLIENT);
    emitStoreChange(STORAGE_KEY_ACTIVE_CLIENT);
  } catch {
    // ignore
  }
}

/**
 * Check if a client account with phone number already exists
 */
export function findClientByPhone(phone: string): ClientAccount | undefined {
  const norm = normalizePhone(phone);
  if (!norm) return undefined;
  const accounts = getAllClientAccounts();
  return accounts.find((a) => normalizePhone(a.phone) === norm);
}

/**
 * Register a new client or update existing profile during checkout
 */
export function registerOrLoginClient(
  fullName: string,
  phone: string,
  password?: string,
  keepSignedIn: boolean = true
): ClientAccount {
  const normPhone = normalizePhone(phone);
  const accounts = getAllClientAccounts();
  const existing = accounts.find((a) => normalizePhone(a.phone) === normPhone);

  if (existing) {
    const updated: ClientAccount = {
      ...existing,
      fullName: fullName || existing.fullName,
      password: password || existing.password,
      keepSignedIn,
    };
    const updatedAccounts = accounts.map((a) => (a.id === existing.id ? updated : a));
    saveClientAccounts(updatedAccounts);
    setActiveClientSession(updated);
    return updated;
  }

  const newAccount: ClientAccount = {
    id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName: fullName.trim(),
    phone: normPhone,
    password: password?.trim() || "123456",
    keepSignedIn,
    createdAt: new Date().toISOString(),
  };

  saveClientAccounts([newAccount, ...accounts]);
  setActiveClientSession(newAccount);
  return newAccount;
}

/**
 * Authenticate client with phone number and password
 */
export function loginClientWithPhone(
  phone: string,
  password: string
): { success: boolean; account?: ClientAccount; error?: string } {
  const normPhone = normalizePhone(phone);
  if (!normPhone) {
    return { success: false, error: "Please enter your mobile phone number." };
  }

  const account = findClientByPhone(normPhone);
  if (!account) {
    return { success: false, error: "No client account found for this phone number." };
  }

  if (account.password && account.password !== password.trim()) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  setActiveClientSession(account);
  return { success: true, account };
}

/**
 * Fetch all appointments and orders across merchants tied to client's phone number
 */
export function getClientBookings(phone: string): BookingRecord[] {
  if (typeof window === "undefined" || !phone) return [];
  const norm = normalizePhone(phone);
  const allBookings: BookingRecord[] = [];

  try {
    // Scan local storage for all booking keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === "ovel_bookings" || key.startsWith("ovel_bookings_"))) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw) as BookingRecord[];
            if (Array.isArray(list)) {
              allBookings.push(...list);
            }
          }
        } catch {
          // ignore parse error
        }
      }
    }
  } catch {
    // fallback
  }

  if (allBookings.length === 0) {
    allBookings.push(...INITIAL_BOOKINGS);
  }

  // Deduplicate and filter by client phone
  const seen = new Set<string>();
  return allBookings
    .filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return normalizePhone(b.clientPhone).includes(norm.slice(-7)) ||
             norm.includes(normalizePhone(b.clientPhone).slice(-7));
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}
