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
  Palette
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useChannelTransition } from "@/components/ChannelTransition";

export default function UserAuthNav() {
  const router = useRouter();
  const { profile, signOut, isLoading } = useAuth();
  const { playClick } = useAudio();
  const { triggerTransition } = useChannelTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    playClick();
    setIsOpen(false);
    await signOut();
    triggerTransition(() => {
      router.push("/login");
    });
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case "super_admin":
        return { label: "Super Admin", bg: "bg-[#105F68] text-white" };
      case "business_owner":
        return { label: "Owner", bg: "bg-[#3A9295] text-white" };
      case "staff":
        return { label: "Specialist", bg: "bg-[#63C1BB]/30 text-[#105F68]" };
      case "client":
        return { label: "Client", bg: "bg-[#9ED5D1]/40 text-[#105F68]" };
      default:
        return { label: "Member", bg: "bg-gray-100 text-gray-700" };
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

  const roleInfo = getRoleBadge(profile.role);
  const parts = profile.fullName.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
  const initials = parts.length === 0 ? "U" : parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          playClick();
          setIsOpen(!isOpen)
        }
        }
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#105F68]/20 bg-white/90 hover:bg-white hover:border-[#105F68]/40 transition-all shadow-sm group"
        aria-label="User Account Menu"
      >
        <div className="relative w-7 h-7 rounded-full bg-[#105F68] text-white flex items-center justify-center text-xs font-medium tracking-tight shadow-sm">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-[#105F68] leading-tight line-clamp-1 max-w-[120px]">
            {profile.fullName}
          </p>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-light tracking-wide ${roleInfo.bg}`}>
            {roleInfo.label}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#3A9295] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Flyout Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#105F68]/15 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-['Kaleko_105',sans-serif]">
          {/* Header Info */}
          <div className="pb-3 border-b border-[#105F68]/10">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-light ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Clerk Auth Active
              </span>
            </div>
            <h4 className="text-sm font-semibold text-[#105F68]">{profile.fullName}</h4>
            <p className="text-xs text-[#3A9295] font-light truncate">{profile.email}</p>
            {profile.organizationName && (
              <p className="text-[11px] text-[#105F68]/70 font-light flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3 text-[#3A9295]" />
                {profile.organizationName}
              </p>
            )}
          </div>

          {/* Navigation Items */}
          <div className="py-2 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => { playClick(); setIsOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#105F68] rounded-xl hover:bg-[#F6FAF9] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#3A9295]" />
              <span>Merchant Dashboard</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => { playClick(); setIsOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#105F68] rounded-xl hover:bg-[#F6FAF9] transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-[#3A9295]" />
              <span>Brand Details &amp; Identity</span>
            </Link>

            <Link
              href="/dashboard?tab=team_auth"
              onClick={() => { playClick(); setIsOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#105F68] rounded-xl hover:bg-[#F6FAF9] transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#3A9295]" />
              <span>Team &amp; Auth Management</span>
            </Link>

            {profile.role === "super_admin" && (
              <Link
                href="/admin"
                onClick={() => { playClick(); setIsOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#105F68] rounded-xl hover:bg-[#F6FAF9] transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#105F68]" />
                <span>Super Admin Portal</span>
              </Link>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#105F68]/10 flex items-center justify-between">
            <Link
              href="/forgot-password"
              onClick={() => { playClick(); setIsOpen(false); }}
              className="text-[11px] text-[#3A9295] hover:text-[#105F68] flex items-center gap-1 font-light"
            >
              <KeyRound className="w-3 h-3" />
              Reset Pass
            </Link>

            <button
              onClick={handleSignOut}
              className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
