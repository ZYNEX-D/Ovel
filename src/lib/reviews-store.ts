import { emitStoreChange } from "./store-events";
import { resolveWorkspace } from "./platform-store";

/**
 * Customer Reviews & Reputation Store
 * Powers:
 * 1. Post-service review capture in Client Portal
 * 2. Automatic Google Maps 5-Star Redirection Funnel (Moat Feature #4)
 * 3. Merchant Reviews & Reputation Hub (/dashboard/reviews)
 * 4. Public Ovelink Social Proof Showcase (/l/[slug])
 */

export interface CustomerReview {
  id: string;
  bookingId: string;
  clientName: string;
  clientAvatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  serviceName: string;
  comment: string;
  photos?: string[];
  status: "published" | "google_pushed" | "private_feedback" | "flagged";
  merchantReply?: string;
  merchantReplyAt?: string;
  googleReviewUrl?: string;
  verifiedBooking: boolean;
  createdAt: string;
}

export interface ReputationConfig {
  businessSlug: string;
  googleMapsReviewUrl: string;
  autoRedirectThreshold: number; // e.g. 4 or 5 stars automatically prompt Google Maps
  privateFeedbackAlerts: boolean; // 1-3 stars routes privately to manager
  automatedNudgeHoursPostService: number; // e.g. 2 hours after completion
  rebookingReminderWeeks: number; // e.g. 4 weeks later
}

export const DEFAULT_REPUTATION_CONFIG: ReputationConfig = {
  businessSlug: "main",
  googleMapsReviewUrl: "https://maps.google.com",
  autoRedirectThreshold: 4,
  privateFeedbackAlerts: true,
  automatedNudgeHoursPostService: 2,
  rebookingReminderWeeks: 4,
};

export const INITIAL_REVIEWS: CustomerReview[] = [];

const STORAGE_KEY_REVIEWS = "ovel_reviews_v2";
const STORAGE_KEY_CONFIG = "ovel_reputation_config_v2";
const reviewCache = new Map<string, { raw: string | null; value: unknown }>();

function readCached<T>(key: string, raw: string | null, fallback: T, parse: (raw: string) => T): T {
  const cached = reviewCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  const value = raw ? parse(raw) : fallback;
  reviewCache.set(key, { raw, value });
  return value;
}

export function getReviews(workspaceId?: string): CustomerReview[] {
  const ws = resolveWorkspace(workspaceId);
  const scopedKey = `${STORAGE_KEY_REVIEWS}_${ws}`;
  if (typeof window === "undefined") return INITIAL_REVIEWS;

  let raw: string | null = null;
  let effectiveKey = scopedKey;
  try {
    raw = localStorage.getItem(scopedKey);
    if (raw === null && (ws === "demo" || ws === "root" || ws === "org_root")) {
      raw = localStorage.getItem(STORAGE_KEY_REVIEWS) || localStorage.getItem("ovel_reviews_v1");
      if (raw !== null) effectiveKey = STORAGE_KEY_REVIEWS;
    }
  } catch {
    return INITIAL_REVIEWS;
  }

  try {
    return readCached(effectiveKey, raw, INITIAL_REVIEWS, (stored) => {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return INITIAL_REVIEWS;
      const cleaned = parsed.filter((review: CustomerReview) => !String(review.id).startsWith("rev_10"));
      if (cleaned.length !== parsed.length) {
        const cleanedRaw = JSON.stringify(cleaned);
        localStorage.setItem(effectiveKey, cleanedRaw);
        raw = cleanedRaw;
      }
      return cleaned;
    });
  } catch {
    return INITIAL_REVIEWS;
  }
}

export function saveReviews(reviews: CustomerReview[], workspaceId?: string): void {
  if (typeof window === "undefined") return;
  const ws = resolveWorkspace(workspaceId);
  const scopedKey = `${STORAGE_KEY_REVIEWS}_${ws}`;
  try {
    const raw = JSON.stringify(reviews);
    localStorage.setItem(scopedKey, raw);
    reviewCache.set(scopedKey, { raw, value: reviews });
    if (ws === "demo" || ws === "root" || ws === "org_root") {
      localStorage.setItem(STORAGE_KEY_REVIEWS, raw);
      reviewCache.set(STORAGE_KEY_REVIEWS, { raw, value: reviews });
    }
    emitStoreChange();
  } catch (err) {
    console.error("Failed to save reviews", err);
  }
}

export function getReputationConfig(workspaceId?: string): ReputationConfig {
  const ws = resolveWorkspace(workspaceId);
  const scopedKey = `${STORAGE_KEY_CONFIG}_${ws}`;
  if (typeof window === "undefined") return DEFAULT_REPUTATION_CONFIG;

  let raw: string | null = null;
  let effectiveKey = scopedKey;
  try {
    raw = localStorage.getItem(scopedKey);
    if (raw === null && (ws === "demo" || ws === "root" || ws === "org_root")) {
      raw = localStorage.getItem(STORAGE_KEY_CONFIG) || localStorage.getItem("ovel_reputation_config_v1");
      if (raw !== null) effectiveKey = STORAGE_KEY_CONFIG;
    }
  } catch {
    return DEFAULT_REPUTATION_CONFIG;
  }

  try {
    return readCached(effectiveKey, raw, DEFAULT_REPUTATION_CONFIG, (stored) => {
      const parsed = JSON.parse(stored) as ReputationConfig;
      const config = { ...DEFAULT_REPUTATION_CONFIG, ...parsed };
      if (parsed.googleMapsReviewUrl?.includes("leclat-aesthetic-sf")) {
        config.googleMapsReviewUrl = "https://maps.google.com";
        const nextRaw = JSON.stringify(config);
        localStorage.setItem(effectiveKey, nextRaw);
        raw = nextRaw;
      }
      return config;
    });
  } catch {
    return DEFAULT_REPUTATION_CONFIG;
  }
}

export function saveReputationConfig(config: ReputationConfig, workspaceId?: string): void {
  if (typeof window === "undefined") return;
  const ws = resolveWorkspace(workspaceId);
  const scopedKey = `${STORAGE_KEY_CONFIG}_${ws}`;
  try {
    const raw = JSON.stringify(config);
    localStorage.setItem(scopedKey, raw);
    reviewCache.set(scopedKey, { raw, value: config });
    if (ws === "demo" || ws === "root" || ws === "org_root") {
      localStorage.setItem(STORAGE_KEY_CONFIG, raw);
      reviewCache.set(STORAGE_KEY_CONFIG, { raw, value: config });
    }
    emitStoreChange();
  } catch (err) {
    console.error("Failed to save reputation config", err);
  }
}

export function submitCustomerReview(
  data: Omit<CustomerReview, "id" | "createdAt" | "verifiedBooking">,
  workspaceId?: string
): CustomerReview {
  const ws = resolveWorkspace(workspaceId);
  const current = getReviews(ws);
  const newReview: CustomerReview = {
    ...data,
    id: `rev_${Date.now()}`,
    verifiedBooking: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...current];
  saveReviews(updated, ws);
  return newReview;
}

export function replyToCustomerReview(
  reviewId: string,
  replyText: string,
  workspaceId?: string
): CustomerReview[] {
  const ws = resolveWorkspace(workspaceId);
  const current = getReviews(ws);
  const updated = current.map((r) => {
    if (r.id === reviewId) {
      return {
        ...r,
        merchantReply: replyText,
        merchantReplyAt: new Date().toISOString(),
      };
    }
    return r;
  });
  saveReviews(updated, ws);
  return updated;
}
