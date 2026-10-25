/**
 * Ovel Domain & Canonical URL Configuration
 * Primary production domains: ovel.lk, ovel.zynexdev.com
 */

export const PRIMARY_DOMAIN = "ovel.lk";
export const DEV_DOMAIN = "ovel.zynexdev.com";

/**
 * Returns current window origin or falls back to production https://ovel.lk
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return `https://${PRIMARY_DOMAIN}`;
}

/**
 * Returns canonical public Ovelink URL for a business slug
 */
export function getOvelinkUrl(slug: string): string {
  return `${getBaseUrl()}/l/${slug}`;
}

/**
 * Returns clean display handle like ovel.lk/l/apex-studio
 */
export function getOvelinkDisplay(slug: string): string {
  return `${PRIMARY_DOMAIN}/l/${slug}`;
}

/**
 * Returns canonical VIP offer pass URL for a business slug and pass token
 */
export function getVipPassUrl(slug: string, token: string): string {
  return `${getBaseUrl()}/l/${slug}/vip/${token}`;
}

/**
 * Returns clean display VIP link like ovel.lk/l/apex-studio/vip/xyz
 */
export function getVipPassDisplay(slug: string, token: string): string {
  return `${PRIMARY_DOMAIN}/l/${slug}/vip/${token}`;
}

/**
 * Returns canonical Client Portal URL
 */
export function getClientPortalUrl(): string {
  return `${getBaseUrl()}/portal`;
}
