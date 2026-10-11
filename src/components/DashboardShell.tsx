"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Sparkles,
  ShoppingBag,
  Users,
  CreditCard,
  MessageSquare,
  FileText,
  ShieldCheck,
  Palette,
  Link2,
  Copy,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Building2,
  Check,
  ChevronRight,
  Star,
  Settings,
  UserCheck,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOvelink } from "@/lib/ovelink-store";
import { useAudio } from "@/components/AudioController";
import UserAuthNav from "@/components/UserAuthNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Users & Clients", icon: UserCheck, badge: "CRM" },
  { href: "/dashboard/ovelink", label: "Ovelink Studio", icon: Palette, badge: "Customizer" },
  { href: "/dashboard/services", label: "Catalog & Offerings", icon: ShoppingBag },
  { href: "/dashboard/staff", label: "Specialists & Roster", icon: Users },
  { href: "/dashboard/invoices", label: "Invoices & Payouts", icon: CreditCard },
  { href: "/dashboard/reminders", label: "WhatsApp CRM", icon: MessageSquare },
  { href: "/dashboard/quotes", label: "Proposals & Quotes", icon: FileText },
  { href: "/dashboard/reviews", label: "Reviews & Reputation", icon: Star, badge: "Moat" },
  { href: "/dashboard/team", label: "Team & Auth Control", icon: ShieldCheck },
  { href: "/dashboard/settings", label: "Brand Settings", icon: Settings, badge: "Identity" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { playClick } = useAudio();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeOvelink = getOvelink(profile?.organizationSlug || "leclat");

  const handleCopyOvelink = () => {
    playClick();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/l/${activeOvelink.slug}`
      : `https://ovel.app/l/${activeOvelink.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = async () => {
    playClick();
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] font-['Kaleko_105',sans-serif] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-[#105F68]/10 sticky top-0 h-screen z-30 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#105F68]/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-[#C8E6E2]/40 border border-[#9ED5D1]/60 flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-105">
              <Image src="/icon.svg" alt="Ovel" width={24} height={24} />
            </div>
            <span className="font-['Disolve'] text-2xl text-[#105F68] tracking-tight">ovel</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">
            0% Cut
          </span>
        </div>

        {/* Business Tenant Identity */}
        <div className="px-6 py-4 border-b border-[#105F68]/10 bg-[#F6FAF9]/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#105F68]" />
            <h4 className="text-xs font-semibold text-[#105F68] truncate">
              {activeOvelink.businessName}
            </h4>
          </div>

          {/* Shareable Ovelink Pill */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-black/5 text-[11px]">
            <span className="font-mono text-[#3A9295] truncate">/l/{activeOvelink.slug}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyOvelink}
                title="Copy Ovelink"
                className="p-1 text-[#105F68] hover:bg-[#F6FAF9] rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
              <Link
                href={`/l/${activeOvelink.slug}`}
                target="_blank"
                title="Open Live Ovelink"
                className="p-1 text-[#105F68] hover:bg-[#F6FAF9] rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          {copiedLink && (
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Link copied to clipboard
            </p>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => playClick()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                  isActive
                    ? "bg-[#105F68] text-white font-medium shadow-sm"
                    : "text-[#3A9295] hover:text-[#105F68] hover:bg-[#F6FAF9]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#C8E6E2] text-[#105F68]"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="p-4 border-t border-[#105F68]/10 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#105F68] text-white flex items-center justify-center text-xs font-semibold">
                {profile?.fullName
                  ? profile.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                  : "GM"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-[#105F68] leading-tight truncate max-w-[120px]">
                  {profile?.fullName || "Business Owner"}
                </p>
                <span className="text-[10px] text-[#3A9295] capitalize">
                  {profile?.role?.replace("_", " ") || "Owner"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#105F68]/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-black/10 hover:bg-[#F6FAF9]"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3A9295]">Merchant Operating Hub</span>
              <span className="text-xs text-[#3A9295] hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-[#105F68] hidden sm:inline">
                {activeOvelink.businessName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/l/${activeOvelink.slug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#105F68]/20 bg-white text-xs text-[#105F68] hover:bg-[#105F68]/5 transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#3A9295]" />
              <span>View Live Ovelink</span>
            </Link>

            <UserAuthNav />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#105F68]/10 px-4 py-4 space-y-1 shadow-xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    playClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                    isActive ? "bg-[#105F68] text-white font-medium" : "text-[#3A9295]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C8E6E2] text-[#105F68]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
