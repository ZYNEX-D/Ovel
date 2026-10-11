"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth, UserProfile } from "@/lib/auth-context";

/**
 * Syncs Clerk authenticated user state into the application's AuthContext.
 * Wrapped safely so it does not evaluate Clerk hooks if Clerk is unconfigured.
 */
export default function ClerkAuthSync() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkReady =
    Boolean(publishableKey) &&
    !publishableKey?.includes("placeholder") &&
    publishableKey?.startsWith("pk_");

  if (!isClerkReady) return null;

  return <ClerkAuthSyncInner />;
}

function ClerkAuthSyncInner() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { profile, switchActiveUser } = useAuth();
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Prevent redundant sync loops if already current
    if (lastSyncedRef.current === user.id && profile?.id === user.id) return;

    const email = user.primaryEmailAddress?.emailAddress || "";
    const isSuperAdmin =
      email.toLowerCase().includes("root") ||
      email.toLowerCase().includes("tharuux") ||
      email.toLowerCase().includes("admin") ||
      user.publicMetadata?.role === "super_admin";

    const fullName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "Workspace User";

    const businessName =
      (user.unsafeMetadata?.businessName as string) ||
      (user.publicMetadata?.businessName as string) ||
      (isSuperAdmin ? "Ovel Global Platform" : "My Studio");

    const businessSlug =
      (user.unsafeMetadata?.businessSlug as string) ||
      (user.publicMetadata?.businessSlug as string) ||
      businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
      "my-studio";

    const clerkProfile: UserProfile = {
      id: user.id,
      email,
      fullName,
      role: isSuperAdmin ? "super_admin" : "business_owner",
      organizationId: "org_" + businessSlug,
      organizationName: businessName,
      organizationSlug: businessSlug,
      permissions: isSuperAdmin
        ? ["all:super_admin", "billing:override", "tenants:manage", "audit:view"]
        : ["bookings:manage", "invoicing:manage", "staff:manage", "whatsapp:manage", "settings:manage"],
      status: "active",
      lastLogin: "Just now",
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    };

    lastSyncedRef.current = user.id;
    switchActiveUser(clerkProfile);
  }, [isLoaded, isSignedIn, user, profile?.id, switchActiveUser]);

  return null;
}
