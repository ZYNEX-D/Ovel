"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useClerk, useUser, useSession } from "@clerk/nextjs";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { session: clerkSession, isLoaded: sessionLoaded } = useSession();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!isLoaded || !sessionLoaded) return () => controller.abort();
    setProfile(null);
    setProfileLoaded(false);
    // A cached demo identity must never become an authenticated profile.
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (!clerkUser) {
      setAllUsers([]);
      setProfileLoaded(true);
      return () => controller.abort();
    }
    async function loadProfile() {
      try {
        const token = await clerkSession?.getToken();
        const response = await fetch("/api/user/me", {
          cache: "no-store", signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error("Unable to verify session");
        const data = await response.json();
        if (!controller.signal.aborted) {
          setProfile(data.profile);
          setAllUsers(data.profile ? [data.profile] : []);
        }
      } catch {
        if (!controller.signal.aborted) setProfile(null);
      } finally {
        if (!controller.signal.aborted) setProfileLoaded(true);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [isLoaded, sessionLoaded, clerkUser?.id, clerkSession?.id]);

  const signOut = async () => {
    await clerk.signOut();
    setProfile(null);
    setAllUsers([]);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };
  const useLogin = async () => ({ error: "Use the Clerk sign-in form at /login." });
  const unavailable = async () => ({ error: "Manage account invitations and recovery through Clerk." });
  // Client-side role switches and impersonation cannot change verified identity.
  const noIdentityChange = () => {};

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (profile) setProfile({ ...profile, ...updates });
  };

  const updateOrganizationDetails = (name: string, slug: string) => {
    if (profile) {
      setProfile({
        ...profile,
        organizationName: name,
        organizationSlug: slug,
        organizationId: "org_" + slug,
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user: null, session: null, profile,
      isLoading: !isLoaded || !profileLoaded,
      teamMembers: allUsers, allSystemUsers: allUsers,
      signInWithPassword: useLogin, signUpWithPassword: useLogin,
      signInWithMagicLink: useLogin, signOut,
      resetPasswordForEmail: unavailable,
      switchDemoRole: noIdentityChange, switchActiveUser: noIdentityChange,
      inviteTeamMember: unavailable, updateTeamMember: noIdentityChange,
      removeTeamMember: noIdentityChange, sendMagicLinkToUser: unavailable,
      impersonateUser: noIdentityChange,
      updateProfile,
      updateOrganizationDetails,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
