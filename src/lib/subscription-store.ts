/**
 * Ovel Tiered Subscription & Quota Engine (in LKR)
 * 
 * Plan 1: Free (Starter)
 * - Up to 3 services / products
 * - Up to 100 orders/appts / month (orders > 100 received but details blurred)
 * - Standard Ovelink customization (theme switching locked)
 * 
 * Plan 2: Growth (LKR 500 / month)
 * - Up to 10 services / products
 * - Up to 500 orders/appts / month
 * - Full theme changing unlocked
 * - Invoicing & Quotations enabled
 * 
 * Plan 3: Scale (LKR 1,500 / month)
 * - Up to 30 services / products
 * - Up to 1,500 orders/appts / month (+1 LKR per overflow order)
 * - Official Verification Badge on Ovelink
 * - All advanced features & unlimited VIP links
 */

import { emitStoreChange } from "@/lib/store-events";

export type SubscriptionTierId = "free" | "growth" | "scale";
export type SubscriptionTier = SubscriptionTierId;

export interface PlanConfig {
  id: SubscriptionTierId;
  tier: SubscriptionTierId;
  name: string;
  tagline: string;
  priceLkr: number;
  monthlyFeeLkr: number;
  period: "month";
  maxOfferings: number;
  maxMonthlyOrders: number;
  maxOrdersPerMonth: number;
  allowThemeCustomization: boolean;
  hasThemeCustomization: boolean;
  allowInvoicingAndQuotes: boolean;
  hasInvoicing: boolean;
  hasVerificationBadge: boolean;
  hasVipPassLinks: boolean;
  overflowOrderPriceLkr?: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTierId, PlanConfig> = {
  free: {
    id: "free",
    tier: "free",
    name: "Starter",
    tagline: "Essential tools for independent artists & new businesses",
    priceLkr: 0,
    monthlyFeeLkr: 0,
    period: "month",
    maxOfferings: 3,
    maxMonthlyOrders: 100,
    maxOrdersPerMonth: 100,
    allowThemeCustomization: false,
    hasThemeCustomization: false,
    allowInvoicingAndQuotes: false,
    hasInvoicing: false,
    hasVerificationBadge: false,
    hasVipPassLinks: false,
  },
  growth: {
    id: "growth",
    tier: "growth",
    name: "Growth",
    tagline: "For busy studios, clinics & salons ready to scale",
    priceLkr: 500,
    monthlyFeeLkr: 500,
    period: "month",
    maxOfferings: 10,
    maxMonthlyOrders: 500,
    maxOrdersPerMonth: 500,
    allowThemeCustomization: true,
    hasThemeCustomization: true,
    allowInvoicingAndQuotes: true,
    hasInvoicing: true,
    hasVerificationBadge: false,
    hasVipPassLinks: true,
  },
  scale: {
    id: "scale",
    tier: "scale",
    name: "Scale",
    tagline: "Uncapped high-volume operating system with verified status",
    priceLkr: 1500,
    monthlyFeeLkr: 1500,
    period: "month",
    maxOfferings: 30,
    maxMonthlyOrders: 1500,
    maxOrdersPerMonth: 1500,
    allowThemeCustomization: true,
    hasThemeCustomization: true,
    allowInvoicingAndQuotes: true,
    hasInvoicing: true,
    hasVerificationBadge: true,
    hasVipPassLinks: true,
    overflowOrderPriceLkr: 1, // +1 LKR per extra order
  },
};

export interface MerchantSubscriptionState {
  merchantId: string;
  planId: SubscriptionTierId;
  currentMonthlyOrders: number;
  activatedAt: string;
}

const STORAGE_KEY_SUBSCRIPTIONS = "ovel_merchant_subscriptions";

export function getMerchantSubscription(merchantId?: string): PlanConfig {
  const ws = merchantId || "default";
  if (typeof window === "undefined") return SUBSCRIPTION_PLANS.free;

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_SUBSCRIPTIONS}_${ws}`);
    if (raw) {
      const parsed = JSON.parse(raw) as MerchantSubscriptionState;
      if (parsed.planId && SUBSCRIPTION_PLANS[parsed.planId]) {
        return SUBSCRIPTION_PLANS[parsed.planId];
      }
    }
  } catch {
    // fallback
  }

  return SUBSCRIPTION_PLANS.free;
}

export function updateMerchantSubscription(merchantId: string, planId: SubscriptionTierId): PlanConfig {
  const ws = merchantId || "default";
  const state: MerchantSubscriptionState = {
    merchantId: ws,
    planId,
    currentMonthlyOrders: 0,
    activatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_KEY_SUBSCRIPTIONS}_${ws}`, JSON.stringify(state));
      emitStoreChange(`${STORAGE_KEY_SUBSCRIPTIONS}_${ws}`);
    } catch {
      // ignore
    }
  }

  return SUBSCRIPTION_PLANS[planId];
}

export const setMerchantSubscription = updateMerchantSubscription;

/**
 * Validates if the merchant can add another service or product
 */
export function checkOfferingCapacity(
  merchantId: string | undefined,
  currentOfferingsCount: number
): {
  allowed: boolean;
  isAtCapacity: boolean;
  max: number;
  maxOfferings: number;
  remainingCapacity: number;
  currentPlan: PlanConfig;
} {
  const plan = getMerchantSubscription(merchantId);
  const isAtCapacity = currentOfferingsCount >= plan.maxOfferings;
  return {
    allowed: !isAtCapacity,
    isAtCapacity,
    max: plan.maxOfferings,
    maxOfferings: plan.maxOfferings,
    remainingCapacity: Math.max(0, plan.maxOfferings - currentOfferingsCount),
    currentPlan: plan,
  };
}

/**
 * Checks order quota and whether client details should be blurred
 */
export function checkOrderQuotaStatus(
  merchantId: string | undefined,
  ordersCountThisMonth: number
): {
  isOverQuota: boolean;
  isExceeded: boolean;
  shouldBlurDetails: boolean;
  ordersCount: number;
  maxMonthlyOrders: number;
  tierLimit: number;
  overflowOrders: number;
  overflowFeeLkr: number;
  currentPlan: PlanConfig;
} {
  const plan = getMerchantSubscription(merchantId);
  const isOverQuota = ordersCountThisMonth > plan.maxMonthlyOrders;
  const shouldBlurDetails = plan.id === "free" && isOverQuota;

  const overflowOrders = Math.max(0, ordersCountThisMonth - plan.maxMonthlyOrders);
  const overflowFeeLkr = plan.overflowOrderPriceLkr ? overflowOrders * plan.overflowOrderPriceLkr : 0;

  return {
    isOverQuota,
    isExceeded: isOverQuota,
    shouldBlurDetails,
    ordersCount: ordersCountThisMonth,
    maxMonthlyOrders: plan.maxMonthlyOrders,
    tierLimit: plan.maxMonthlyOrders,
    overflowOrders,
    overflowFeeLkr,
    currentPlan: plan,
  };
}

export function calculateOverflowFee(
  merchantId: string | undefined,
  ordersCountThisMonth: number
): {
  overflowOrders: number;
  overflowFeeLkr: number;
} {
  const status = checkOrderQuotaStatus(merchantId, ordersCountThisMonth);
  return {
    overflowOrders: status.overflowOrders,
    overflowFeeLkr: status.overflowFeeLkr,
  };
}
