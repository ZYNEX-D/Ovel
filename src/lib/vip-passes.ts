/**
 * Ovel Single-Use VIP Pass & Secret Offer Engine
 * Merchants can create custom-priced discount links that auto-expire upon first use
 */

import { emitStoreChange } from "@/lib/store-events";
import { getVipPassUrl, getVipPassDisplay } from "@/lib/domain";

export interface VipOfferingOverride {
  offeringId: string;
  name: string;
  originalPriceCents: number;
  vipPriceCents: number;
  vipDepositCents: number;
  description?: string;
}

export interface VipPass {
  id: string;
  token: string;
  merchantSlug: string;
  merchantId?: string;
  title: string; // e.g. "Exclusive Bridal VIP Package - 30% Off"
  clientName?: string;
  clientPhone?: string;
  offerings: VipOfferingOverride[];
  isRedeemed: boolean;
  redeemedAt?: string;
  redeemedBookingId?: string;
  createdAt: string;
  expiresAt: string;
}

const STORAGE_KEY_VIP_PASSES = "ovel_vip_passes";

export function getAllVipPasses(): VipPass[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIP_PASSES);
    if (!raw) return [];
    return JSON.parse(raw) as VipPass[];
  } catch {
    return [];
  }
}

function saveVipPasses(passes: VipPass[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_VIP_PASSES, JSON.stringify(passes));
    emitStoreChange(STORAGE_KEY_VIP_PASSES);
  } catch {
    // ignore
  }
}

/**
 * Retrieve VIP pass by token
 */
export function getVipPassByToken(token: string): VipPass | undefined {
  const passes = getAllVipPasses();
  return passes.find((p) => p.token === token);
}

/**
 * Retrieve all VIP passes for a merchant
 */
export function getMerchantVipPasses(merchantSlugOrId: string): VipPass[] {
  const passes = getAllVipPasses();
  return passes.filter(
    (p) => p.merchantSlug === merchantSlugOrId || p.merchantId === merchantSlugOrId
  );
}

/**
 * Create a new single-use VIP pass link
 */
export function createVipPass(params: {
  merchantSlug: string;
  merchantId?: string;
  title: string;
  clientName?: string;
  clientPhone?: string;
  offerings: VipOfferingOverride[];
  expiresInDays?: number;
}): VipPass {
  const token = `vip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();
  const expiry = new Date(now.getTime() + (params.expiresInDays || 14) * 24 * 60 * 60 * 1000);

  const pass: VipPass = {
    id: `vp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    token,
    merchantSlug: params.merchantSlug,
    merchantId: params.merchantId,
    title: params.title.trim() || "Exclusive VIP Offer",
    clientName: params.clientName?.trim(),
    clientPhone: params.clientPhone?.trim(),
    offerings: params.offerings,
    isRedeemed: false,
    createdAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
  };

  const existing = getAllVipPasses();
  saveVipPasses([pass, ...existing]);
  return pass;
}

/**
 * Redeem and permanently expire the VIP pass (single-use guarantee)
 */
export function redeemVipPass(token: string, bookingId?: string): boolean {
  const passes = getAllVipPasses();
  const passIndex = passes.findIndex((p) => p.token === token);
  if (passIndex === -1) return false;

  const current = passes[passIndex];
  if (current.isRedeemed) return false;

  passes[passIndex] = {
    ...current,
    isRedeemed: true,
    redeemedAt: new Date().toISOString(),
    redeemedBookingId: bookingId,
  };

  saveVipPasses(passes);
  return true;
}
