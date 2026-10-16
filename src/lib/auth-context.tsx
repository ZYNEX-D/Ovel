"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useClerk, useUser, useSession } from "@clerk/nextjs";
import { clerkSessionView } from "./auth-session";

export type UserRole = "super_admin" | "business_owner" | "staff" | "client";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  permissions?: string[];
  status?: "active" | "invited" | "suspended";
  lastLogin?: string;
  phone?: string;
  createdAt?: string;
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
  updateOrganizationDetails: (name: string, slug: string) => void;
}

export const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    id: "usr_root",
    email: "tharuux@ovel.app",
    fullName: "Tharuux (Developer Root)",
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
];

const AUTH_STORAGE_KEY = "ovel_active_auth_profile_v2";
const USERS_STORAGE_KEY = "ovel_system_users_v2";
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
  const team = useMemo(() => (view.profile ? [view.profile] : EMPTY_TEAM), [view.profile]);

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
        setProfile(data.profile ?? null);
        setLoadedFor(userId);
      } catch {
        if (ignore || controller.signal.aborted) return;
        setProfile(null);
        setLoadedFor(userId);
      }
    }
    void loadProfile();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [clerkReady, activeUserId]);

  const signOut = useCallback(async () => {
    await clerk.signOut();
    setProfile(null);
    setLoadedFor(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [clerk]);
  const useLogin = useCallback(async () => ({ error: "Use the Clerk sign-in form at /login." }), []);
  const unavailable = useCallback(async () => ({ error: "Manage account invitations and recovery through Clerk." }), []);
  const noIdentityChange = useCallback(() => {}, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const updateOrganizationDetails = useCallback((name: string, slug: string) => {
    setProfile((current) => current ? {
      ...current,
      organizationName: name,
      organizationSlug: slug,
      organizationId: "org_" + slug,
    } : current);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user: null,
    session: null,
    profile: view.profile,
    isLoading: view.isLoading,
    teamMembers: team,
    allSystemUsers: team,
    signInWithPassword: useLogin,
    signUpWithPassword: useLogin,
    signInWithMagicLink: useLogin,
    signOut,
    resetPasswordForEmail: unavailable,
    switchDemoRole: noIdentityChange,
    switchActiveUser: noIdentityChange,
    inviteTeamMember: unavailable,
    updateTeamMember: noIdentityChange,
    removeTeamMember: noIdentityChange,
    sendMagicLinkToUser: unavailable,
    impersonateUser: noIdentityChange,
    updateProfile,
    updateOrganizationDetails,
  }), [
    view.profile,
    view.isLoading,
    team,
    useLogin,
    signOut,
    unavailable,
    noIdentityChange,
    updateProfile,
    updateOrganizationDetails,
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
