"use client";

import React, { useState, useEffect } from "react";
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
import { getOvelink, PRESET_OVELINKS } from "@/lib/ovelink-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import UserAuthNav from "@/components/UserAuthNav";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/roster", label: "Appointments", icon: CalendarIcon },
      { href: "/dashboard/users", label: "Clients", icon: UserCheck },
    ],
  },
  {
    title: "Services & Sales",
    items: [
      { href: "/dashboard/services", label: "Services", icon: ShoppingBag },
      { href: "/dashboard/invoices", label: "Invoices", icon: CreditCard },
      { href: "/dashboard/quotes", label: "Quotes", icon: FileText },
    ],
  },
  {
    title: "Online Presence",
    items: [
      { href: "/dashboard/ovelink", label: "Booking Page", icon: Link2 },
      { href: "/dashboard/reminders", label: "Reminders", icon: MessageSquare },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/dashboard/staff", label: "Staff", icon: Users },
      { href: "/dashboard/team", label: "Team & Roles", icon: ShieldCheck },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
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

  const ovelinkSlug = profile?.organizationSlug || (profile?.role === "super_admin" ? "root" : "leclat");
  const activeOvelink = useClientStore(
    () => getOvelink(ovelinkSlug, profile?.organizationName, profile?.organizationId),
    () => PRESET_OVELINKS[ovelinkSlug] || PRESET_OVELINKS.leclat,
  );

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
          <Link href="/" className="flex items-center group">
            <span className="font-['Disolve'] text-2xl text-[#105F68] tracking-tight">Ovel</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">
            0% Commission
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
                title="Copy Link"
                className="p-1 text-[#105F68] hover:bg-[#F6FAF9] rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
              <Link
                href={`/l/${activeOvelink.slug}`}
                target="_blank"
                title="Open Booking Page"
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

        {/* Categorized Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-[#3A9295]/70 uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => playClick()}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-[#105F68] text-white font-medium shadow-sm"
                          : "text-[#3A9295] hover:text-[#105F68] hover:bg-[#F6FAF9]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive ? "bg-white/20 text-white" : "bg-[#C8E6E2] text-[#105F68]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
              <span className="text-xs text-[#3A9295]">Workspace</span>
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
              <span>Booking Page</span>
            </Link>

            <UserAuthNav />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#105F68]/10 px-4 py-4 space-y-3.5 shadow-xl max-h-[80vh] overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-[#3A9295]/70 uppercase">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          playClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? "bg-[#105F68] text-white font-medium"
                            : "text-[#3A9295] hover:bg-[#F6FAF9]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                              isActive ? "bg-white/20 text-white" : "bg-[#C8E6E2] text-[#105F68]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
