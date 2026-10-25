import {
  getRegisteredWorkspaceAliases,
  getWorkspaceAliases,
  purgeWorkspaceStorage,
  setActiveWorkspaceId,
} from "./platform-store";
import { purgeOvelinkWorkspace } from "./ovelink-store";
import { purgeVipPassesForWorkspace } from "./vip-passes";

export interface WorkspaceIdentity {
  organizationId?: string | null;
  organizationSlug?: string | null;
  userId?: string | null;
}

export interface WorkspacePurgeResult {
  removedKeys: number;
  removedStorefronts: string[];
  removedVipPasses: number;
}

function identityAliases(identity: WorkspaceIdentity): string[] {
  const aliases = new Set<string>();
  const add = (value?: string | null) => {
    const clean = value?.trim();
    if (!clean) return;
    aliases.add(clean);
    if (clean.startsWith("org_")) {
      aliases.add(clean.slice(4));
    } else {
      aliases.add(`org_${clean}`);
    }
  };

  add(identity.organizationId);
  add(identity.organizationSlug);
  add(identity.userId);

  // Only expand aliases from the organization/user ids. Scanning a bare slug
  // can return a storefront owned by a different account if a slug was reused.
  const safeLookups = [identity.organizationId, identity.userId].filter(Boolean) as string[];
  if (!identity.organizationId && identity.organizationSlug) {
    safeLookups.push(identity.organizationSlug);
  }
  for (const value of safeLookups) {
    for (const alias of getWorkspaceAliases(value)) add(alias);
    for (const alias of getRegisteredWorkspaceAliases(value)) add(alias);
  }

  return Array.from(aliases);
}

/**
 * Delete every trace of a merchant workspace from browser persistence:
 * catalog, bookings, clients, reviews, subscriptions, storefronts, VIP links,
 * onboarding drafts, and the active workspace/session pointers.
 *
 * This is the single cleanup entry point used when a Clerk account is deleted.
 * It must run before the Clerk session is removed so we still know which
 * organization and slug belonged to the account.
 */
export function purgeWorkspace(identity: WorkspaceIdentity): WorkspacePurgeResult {
  if (typeof window === "undefined") {
    return { removedKeys: 0, removedStorefronts: [], removedVipPasses: 0 };
  }

  const aliases = identityAliases(identity);
  const removedStorefronts = purgeOvelinkWorkspace({
    organizationId: identity.organizationId,
    aliases,
  });
  for (const slug of removedStorefronts) aliases.push(slug);

  const manualKeys = [
    "ovel_onboarding_draft_v1",
    "ovel_onboarding_completed",
    "ovel_selected_business_type",
    "ovel_active_auth_profile_v2",
    "ovel_active_workspace_id",
  ];
  let removedManualKeys = 0;
  for (const key of manualKeys) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removedManualKeys += 1;
      }
    } catch {
      // ignore
    }
  }

  const removedVipPasses = purgeVipPassesForWorkspace(aliases);
  const removedKeys = purgeWorkspaceStorage(aliases, aliases) + removedManualKeys;

  setActiveWorkspaceId("");

  return {
    removedKeys,
    removedStorefronts,
    removedVipPasses,
  };
}
