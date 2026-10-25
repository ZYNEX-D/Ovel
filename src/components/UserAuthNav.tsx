"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  KeyRound,
  Sparkles,
  Calendar,
  Users,
  Check,
  Palette,
  Trash2
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useChannelTransition } from "@/components/ChannelTransition";

import { UserMenu, type UserMenuItem, type UserStatus } from "@/components/arc/user-menu/user-menu";

export default function UserAuthNav() {
  const router = useRouter();
  const { profile, signOut, isLoading } = useAuth();
  const { playClick } = useAudio();
  const { triggerTransition } = useChannelTransition();
  const [presence, setPresence] = useState<UserStatus>("available");

  const handleSignOut = async () => {
    playClick();
    await signOut();
    triggerTransition(() => {
      router.push("/login");
    });
  };

  const getPlanLabel = (role?: UserRole) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "business_owner":
        return "Owner";
      case "staff":
        return "Specialist";
      case "client":
        return "Client";
      default:
        return "Merchant";
    }
  };

  if (isLoading) return null;

  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          onClick={() => playClick()}
          className="text-xs font-light text-[#105F68] px-3.5 py-2 rounded-full border border-[#105F68]/20 bg-white/70 hover:bg-white hover:border-[#105F68]/40 transition-all shadow-sm"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          onClick={() => playClick()}
          className="text-xs font-light text-white px-4 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] transition-all shadow-sm"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const items: UserMenuItem[] = [
    {
      label: "Merchant Dashboard",
      icon: <Calendar size={16} />,
      onSelect: () => {
        playClick();
        router.push("/dashboard");
      },
    },
    {
      label: "Brand Details & Identity",
      icon: <Palette size={16} />,
      onSelect: () => {
        playClick();
        router.push("/dashboard/settings");
      },
    },
    {
      label: "Team & Auth Management",
      icon: <Users size={16} />,
      onSelect: () => {
        playClick();
        router.push("/dashboard?tab=team_auth");
      },
    },
  ];

  if (profile.role === "super_admin") {
    items.push({
      label: "Super Admin Portal",
      icon: <ShieldCheck size={16} />,
      onSelect: () => {
        playClick();
        router.push("/admin");
      },
    });
  }

  items.push(
    {
      label: "Reset Password",
      icon: <KeyRound size={16} />,
      onSelect: () => {
        playClick();
        router.push("/forgot-password");
      },
    },
    {
      label: "Delete Account & Workspace",
      icon: <Trash2 size={16} className="text-red-500" />,
      onSelect: () => {
        playClick();
        router.push("/dashboard/settings?tab=account");
      },
    }
  );

  return (
    <UserMenu
      user={{
        name: profile.fullName,
        email: profile.email,
        plan: getPlanLabel(profile.role),
        avatarSrc: profile.avatarUrl,
      }}
      showName
      status={presence}
      onStatusChange={setPresence}
      showTheme={true}
      items={items}
      onSignOut={handleSignOut}
      signOutKeys={["⇧", "⌘", "Q"]}
    />
  );
}
