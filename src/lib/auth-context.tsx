"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useClerk, useUser, useSession } from "@clerk/nextjs";
import { clerkSessionView } from "./auth-session";
import { setActiveWorkspaceId } from "./platform-store";
import { purgeWorkspace } from "./workspace-cleanup";

export type UserRole = "super_admin" | "business_owner" | "staff" | "client";
export type BusinessType = "services" | "products" | "both";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  businessType?: BusinessType;
  avatarUrl?: string;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  permissions?: string[];
  status?: "active" | "invited" | "suspended";
  lastLogin?: string;
  phone?: string;
  createdAt?: string;
  logoUrl?: string;
  businessBio?: string;
  businessTagline?: string;
  greetings?: string;
  onboardingCompleted?: boolean;
}

export interface InvitePayload {
  fullName: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  teamMembers: UserProfile[];
  allSystemUsers: UserProfile[];
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string, businessName: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  switchDemoRole: (role: UserRole) => void;
  switchActiveUser: (user: UserProfile) => void;
  inviteTeamMember: (data: InvitePayload) => Promise<{ error: string | null; inviteToken?: string }>;
  updateTeamMember: (id: string, updates: Partial<UserProfile>) => void;
  removeTeamMember: (id: string) => void;
  sendMagicLinkToUser: (email: string) => Promise<{ error: string | null }>;
  impersonateUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateOrganizationDetails: (name: string, slug: string, avatarUrl?: string, businessType?: BusinessType) => void;
  updateBusinessType: (type: BusinessType) => void;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    id: "usr_root",
    email: "admin@ovel.app",
    fullName: "Platform Administrator",
    role: "super_admin",
    organizationId: "org_root",
    organizationName: "Ovel Global Platform",
    organizationSlug: "root",
    permissions: ["all:super_admin", "billing:override", "tenants:manage", "audit:view"],
    status: "active",
    lastLogin: "Just now",
    phone: "+1 (800) 555-0199",
    createdAt: "2026-08-01",
  },
  {
    id: "usr_leclat",
    email: "genevieve@ovel.lk",
    fullName: "Dr. Genevieve Moreau",
    role: "business_owner",
    organizationId: "org_MyBUsiness",
    organizationName: "L'Éclat Boutique",
    organizationSlug: "MyBUsiness",
    permissions: ["bookings:manage", "invoicing:manage", "staff:manage"],
    status: "active",
    lastLogin: "Just now",
    phone: "+94 (77) 123-4567",
    createdAt: "2026-09-12",
  },
  {
    id: "usr_apex",
    email: "apex@ovel.lk",
    fullName: "Marcus Vance",
    role: "business_owner",
    organizationId: "org_apex-studio",
    organizationName: "Apex Auto Lab",
    organizationSlug: "apex-studio",
    permissions: ["bookings:manage", "invoicing:manage", "staff:manage"],
    status: "active",
    lastLogin: "Just now",
    phone: "+94 (71) 987-6543",
    createdAt: "2026-09-20",
  },
  {
    id: "usr_bakes",
    email: "bakes@ovel.lk",
    fullName: "Sarah Jenkins",
    role: "business_owner",
    organizationId: "org_craft-bakes",
    organizationName: "Velvet Crumb Bakes",
    organizationSlug: "craft-bakes",
    permissions: ["bookings:manage", "invoicing:manage", "staff:manage"],
    status: "active",
    lastLogin: "Just now",
    phone: "+94 (76) 334-1122",
    createdAt: "2026-10-01",
  },
];

const AUTH_STORAGE_KEY = "ovel_active_auth_profile_v2";
const EMPTY_TEAM: UserProfile[] = [];

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  teamMembers: [],
  allSystemUsers: [],
  signInWithPassword: async () => ({ error: null }),
  signUpWithPassword: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => {},
  resetPasswordForEmail: async () => ({ error: null }),
  switchDemoRole: () => {},
  switchActiveUser: () => {},
  inviteTeamMember: async () => ({ error: null }),
  updateTeamMember: () => {},
  removeTeamMember: () => {},
  sendMagicLinkToUser: async () => ({ error: null }),
  impersonateUser: () => {},
  updateProfile: () => {},
  updateOrganizationDetails: () => {},
  updateBusinessType: () => {},
  deleteAccount: async () => ({ error: null }),
});

function clerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    publishableKey &&
    !publishableKey.includes("placeholder") &&
    publishableKey.startsWith("pk_"),
  );
}

function FallbackAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AuthContextType>(() => ({
    user: null,
    profile: null,
    session: null,
    isLoading: false,
    teamMembers: [],
    allSystemUsers: [],
    signInWithPassword: async () => ({ error: "Use the Clerk sign-in form at /login." }),
    signUpWithPassword: async () => ({ error: "Use the Clerk sign-in form at /login." }),
    signInWithMagicLink: async () => ({ error: "Use the Clerk sign-in form at /login." }),
    signOut: async () => {},
    resetPasswordForEmail: async () => ({ error: "Manage account invitations and recovery through Clerk." }),
    switchDemoRole: () => {},
    switchActiveUser: () => {},
    inviteTeamMember: async () => ({ error: "Manage account invitations and recovery through Clerk." }),
    updateTeamMember: () => {},
    removeTeamMember: () => {},
    sendMagicLinkToUser: async () => ({ error: "Manage account invitations and recovery through Clerk." }),
    impersonateUser: () => {},
    updateProfile: () => {},
    updateOrganizationDetails: () => {},
    updateBusinessType: () => {},
    deleteAccount: async () => ({ error: null }),
  }), []);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { session: clerkSession, isLoaded: sessionLoaded } = useSession();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const clerkReady = isLoaded && sessionLoaded;
  const activeUserId = clerkUser?.id ?? null;
  const sessionRef = useRef(clerkSession);
  const view = clerkSessionView(clerkReady, activeUserId, loadedFor, profile);
  const [directProfile, setDirectProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const activeProfile = view.profile || (!activeUserId ? directProfile : null);
  const team = useMemo(() => (activeProfile ? [activeProfile] : EMPTY_TEAM), [activeProfile]);

  useEffect(() => {
    sessionRef.current = clerkSession;
  });

  useEffect(() => {
    if (!clerkReady || !activeUserId) return;
    const controller = new AbortController();
    let ignore = false;
    const userId = activeUserId;
    localStorage.removeItem(AUTH_STORAGE_KEY);

    async function loadProfile() {
      try {
        const token = await sessionRef.current?.getToken();
        const response = await fetch("/api/user/me", {
          cache: "no-store",
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error("Unable to verify session");
        const data = await response.json();
        if (ignore || controller.signal.aborted) return;
        const loadedProfile: UserProfile | null = data.profile ?? null;
        if (loadedProfile?.organizationId && typeof window !== "undefined") {
          const customSlug = localStorage.getItem(`ovel_custom_slug_${loadedProfile.organizationId}`);
          const customName = localStorage.getItem(`ovel_custom_name_${loadedProfile.organizationId}`);
          const customAvatar = localStorage.getItem(`ovel_custom_avatar_${loadedProfile.organizationId}`);
          const customType = localStorage.getItem(`ovel_business_type_${loadedProfile.organizationId}`) as BusinessType | null;
          const initialSelected = localStorage.getItem("ovel_selected_business_type") as BusinessType | null;
          if (customSlug) loadedProfile.organizationSlug = customSlug;
          if (customName) loadedProfile.organizationName = customName;
          if (customAvatar) loadedProfile.avatarUrl = customAvatar;
          if (customType) {
            loadedProfile.businessType = customType;
          } else if (loadedProfile.businessType) {
            // keep server value
          } else if (initialSelected) {
            loadedProfile.businessType = initialSelected;
          } else {
            loadedProfile.businessType = "both";
          }
        }
        setProfile(loadedProfile);
        setLoadedFor(userId);
        if (loadedProfile?.organizationId) {
          setActiveWorkspaceId(loadedProfile.organizationId);
        }
      } catch {
        if (ignore || controller.signal.aborted) return;
        setProfile(null);
        setLoadedFor(userId);
        setActiveWorkspaceId("");
      }
    }
    void loadProfile();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [clerkReady, activeUserId]);

  const signOut = useCallback(async () => {
    try {
      await clerk.signOut();
    } catch {}
    try {
      await fetch("/api/auth/admin-session", { method: "DELETE" });
    } catch {}
    setProfile(null);
    setLoadedFor(null);
    setDirectProfile(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setActiveWorkspaceId("");
  }, [clerk]);

  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    // Capture the tenant identity before the Clerk session is removed.
    const metadataSlug =
      typeof clerkUser?.unsafeMetadata?.businessSlug === "string"
        ? clerkUser.unsafeMetadata.businessSlug
        : undefined;
    const identity = {
      organizationId:
        profile?.organizationId || (clerkUser?.id ? `org_${clerkUser.id}` : undefined),
      organizationSlug: profile?.organizationSlug || metadataSlug,
      userId: profile?.id || clerkUser?.id,
    };

    try {
      let serverDeleted = false;
      let deletionError: string | null = null;

      try {
        const token = await sessionRef.current?.getToken();
        const response = await fetch("/api/user/delete", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; error?: string }
          | null;

        if (response.ok) {
          serverDeleted = true;
        } else {
          deletionError =
            payload?.message ||
            payload?.error ||
            `Account deletion failed (HTTP ${response.status}).`;
        }
      } catch (err: unknown) {
        deletionError = (err as Error)?.message || "Could not reach the account deletion service.";
      }

      // Fallback for deployments where the server route cannot access the
      // Clerk backend key. The signed-in user can delete their own account.
      if (!serverDeleted && clerkUser) {
        try {
          await clerkUser.delete();
          serverDeleted = true;
          deletionError = null;
        } catch (err: unknown) {
          deletionError = (err as Error)?.message || deletionError;
        }
      }

      if (!serverDeleted) {
        return {
          error: deletionError || "Failed to delete account. Please try again.",
        };
      }

      // Only purge after the server confirms the Clerk account is gone.
      // Otherwise a failed deletion would destroy the user's working data.
      purgeWorkspace(identity);

      try {
        await clerk.signOut();
      } catch {
        // The server may already have invalidated the session.
      }

      setProfile(null);
      setLoadedFor(null);
      setActiveWorkspaceId("");

      return { error: null };
    } catch (err: unknown) {
      return { error: (err as Error)?.message || "Failed to delete account" };
    }
  }, [clerk, clerkUser, profile]);

  const switchDemoRole = useCallback((role: UserRole) => {
    let p: UserProfile;
    if (role === "super_admin") {
      p = INITIAL_SYSTEM_USERS[0];
      try {
        fetch("/api/auth/admin-session", { method: "POST" });
      } catch {}
    } else {
      p = INITIAL_SYSTEM_USERS[1] || INITIAL_SYSTEM_USERS[0];
    }
    setDirectProfile(p);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(p));
      if (p.organizationId) {
        setActiveWorkspaceId(p.organizationId);
      }
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const clean = email.trim().toLowerCase();
    const isAdmin = clean === "admin@ovel.app" || clean === "admin@ovel.lk" || clean.includes("root");
    if (isAdmin) {
      const adminProfile = INITIAL_SYSTEM_USERS[0];
      setDirectProfile(adminProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminProfile));
        setActiveWorkspaceId("org_root");
      }
      try {
        await fetch("/api/auth/admin-session", { method: "POST" });
      } catch {}
      return { error: null };
    }

    const match = INITIAL_SYSTEM_USERS.find(u => u.email.toLowerCase() === clean);
    const p: UserProfile = match || {
      id: "usr_" + Math.random().toString(36).substring(2, 8),
      email: clean,
      fullName: clean.split("@")[0],
      role: "business_owner",
      organizationId: "org_" + clean.split("@")[0],
      organizationName: `${clean.split("@")[0]}'s Studio`,
      organizationSlug: clean.split("@")[0].replace(/[^a-z0-9]+/g, "-"),
      status: "active",
    };

    setDirectProfile(p);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(p));
      if (p.organizationId) {
        setActiveWorkspaceId(p.organizationId);
      }
    }
    return { error: null };
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string, _fullName: string, _businessName: string) => {
    return signInWithPassword(email, password);
  }, [signInWithPassword]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return signInWithPassword(email, "");
  }, [signInWithPassword]);

  const unavailable = useCallback(async () => ({ error: "Manage account invitations and recovery through Clerk." }), []);
  const noIdentityChange = useCallback(() => {}, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      if (typeof window !== "undefined" && current.organizationId && updates.avatarUrl !== undefined) {
        if (updates.avatarUrl) {
          localStorage.setItem(`ovel_custom_avatar_${current.organizationId}`, updates.avatarUrl);
        } else {
          localStorage.removeItem(`ovel_custom_avatar_${current.organizationId}`);
        }
      }
      return next;
    });
  }, []);

  const updateOrganizationDetails = useCallback(async (name: string, slug: string, avatarUrl?: string, businessType?: BusinessType) => {
    if (!profile) return;
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "") || "my-brand";
    const cleanName = name.trim() || profile.organizationName || "My Business";
    const nextType = businessType || profile.businessType || "both";

    const updatedProfile: UserProfile = {
      ...profile,
      organizationName: cleanName,
      organizationSlug: cleanSlug,
      organizationId: profile.organizationId || ("org_" + cleanSlug),
      businessType: nextType,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    };

    setProfile(updatedProfile);

    // Save to local storage for instant retrieval across browser sessions
    try {
      if (profile.organizationId) {
        localStorage.setItem(`ovel_custom_slug_${profile.organizationId}`, cleanSlug);
        localStorage.setItem(`ovel_custom_name_${profile.organizationId}`, cleanName);
        localStorage.setItem(`ovel_business_type_${profile.organizationId}`, nextType);
        localStorage.setItem("ovel_selected_business_type", nextType);
        if (avatarUrl !== undefined) {
          if (avatarUrl) {
            localStorage.setItem(`ovel_custom_avatar_${profile.organizationId}`, avatarUrl);
          } else {
            localStorage.removeItem(`ovel_custom_avatar_${profile.organizationId}`);
          }
        }
      }
    } catch {
      // ignore
    }

    // Persist to Clerk user unsafeMetadata via PATCH /api/user/me
    try {
      const token = await sessionRef.current?.getToken();
      await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessName: cleanName,
          businessSlug: cleanSlug,
          businessType: nextType,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        }),
      });
    } catch {
      // safe fallback
    }
  }, [profile]);

  const updateBusinessType = useCallback(async (type: BusinessType) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      businessType: type,
    };
    setProfile(updatedProfile);

    try {
      if (profile.organizationId) {
        localStorage.setItem(`ovel_business_type_${profile.organizationId}`, type);
      }
      localStorage.setItem("ovel_selected_business_type", type);
    } catch {
      // ignore
    }

    try {
      const token = await sessionRef.current?.getToken();
      await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessType: type,
        }),
      });
    } catch {
      // safe fallback
    }
  }, [profile]);

  const value = useMemo<AuthContextType>(() => ({
    user: null,
    session: null,
    profile: activeProfile,
    isLoading: view.isLoading,
    teamMembers: team,
    allSystemUsers: team,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signOut,
    resetPasswordForEmail: unavailable,
    switchDemoRole,
    switchActiveUser: noIdentityChange,
    inviteTeamMember: unavailable,
    updateTeamMember: noIdentityChange,
    removeTeamMember: noIdentityChange,
    sendMagicLinkToUser: unavailable,
    impersonateUser: noIdentityChange,
    updateProfile,
    updateOrganizationDetails,
    updateBusinessType,
    deleteAccount,
  }), [
    activeProfile,
    view.isLoading,
    team,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signOut,
    unavailable,
    switchDemoRole,
    noIdentityChange,
    updateProfile,
    updateOrganizationDetails,
    updateBusinessType,
    deleteAccount,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkConfigured()) return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

export const useAuth = () => useContext(AuthContext);
