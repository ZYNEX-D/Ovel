import { emitStoreChange } from "./store-events";

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

const STORAGE_KEY_REVIEWS = "ovel_reviews_v1";
const STORAGE_KEY_CONFIG = "ovel_reputation_config_v1";
const reviewCache = new Map<string, { raw: string | null; value: unknown }>();

function readCached<T>(key: string, raw: string | null, fallback: T, parse: (raw: string) => T): T {
  const cached = reviewCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  const value = raw ? parse(raw) : fallback;
  reviewCache.set(key, { raw, value });
  return value;
}

export function getReviews(): CustomerReview[] {
  if (typeof window === "undefined") return INITIAL_REVIEWS;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
  } catch {
    return INITIAL_REVIEWS;
  }
  try {
  return readCached(STORAGE_KEY_REVIEWS, raw, INITIAL_REVIEWS, (stored) => {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return INITIAL_REVIEWS;
    const cleaned = parsed.filter((review: CustomerReview) => !String(review.id).startsWith("rev_10"));
    if (cleaned.length !== parsed.length) {
      const cleanedRaw = JSON.stringify(cleaned);
      localStorage.setItem(STORAGE_KEY_REVIEWS, cleanedRaw);
      raw = cleanedRaw;
    }
    return cleaned;
  });
  } catch {
    return INITIAL_REVIEWS;
  }
}

export function saveReviews(reviews: CustomerReview[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(reviews);
    localStorage.setItem(STORAGE_KEY_REVIEWS, raw);
    reviewCache.set(STORAGE_KEY_REVIEWS, { raw, value: reviews });
    emitStoreChange();
  } catch (err) {
    console.error("Failed to save reviews", err);
  }
}

export function getReputationConfig(): ReputationConfig {
  if (typeof window === "undefined") return DEFAULT_REPUTATION_CONFIG;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY_CONFIG);
  } catch {
    return DEFAULT_REPUTATION_CONFIG;
  }
  try {
  return readCached(STORAGE_KEY_CONFIG, raw, DEFAULT_REPUTATION_CONFIG, (stored) => {
    const parsed = JSON.parse(stored) as ReputationConfig;
    const config = { ...DEFAULT_REPUTATION_CONFIG, ...parsed };
    if (parsed.googleMapsReviewUrl?.includes("leclat-aesthetic-sf")) {
      config.googleMapsReviewUrl = "https://maps.google.com";
      const nextRaw = JSON.stringify(config);
      localStorage.setItem(STORAGE_KEY_CONFIG, nextRaw);
      raw = nextRaw;
    }
    return config;
  });
  } catch {
    return DEFAULT_REPUTATION_CONFIG;
  }
}

export function saveReputationConfig(config: ReputationConfig): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY_CONFIG, raw);
    reviewCache.set(STORAGE_KEY_CONFIG, { raw, value: config });
    emitStoreChange();
  } catch (err) {
    console.error("Failed to save reputation config", err);
  }
}

export function submitCustomerReview(data: Omit<CustomerReview, "id" | "createdAt" | "verifiedBooking">): CustomerReview {
  const current = getReviews();
  const newReview: CustomerReview = {
    ...data,
    id: `rev_${Date.now()}`,
    verifiedBooking: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...current];
  saveReviews(updated);
  return newReview;
}

export function replyToCustomerReview(reviewId: string, replyText: string): CustomerReview[] {
  const current = getReviews();
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
  saveReviews(updated);
  return updated;
}
