"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  Sliders, 
  KeyRound, 
  Plus, 
  Search, 
  ExternalLink, 
  Check, 
  Lock, 
  TrendingUp, 
  Terminal, 
  ArrowLeft,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Database,
  Building2,
  Calendar,
  CreditCard,
  MessageSquare,
  Bot,
  Mail,
  Fingerprint,
  UserCheck,
  Shield,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { 
  TenantUser, 
  AdminAuditLog, 
  getAdminUsers, 
  saveAdminUsers, 
  getAdminLogs, 
  addAdminLog 
} from "@/lib/admin-store";
import { useAuth, UserRole, UserProfile } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useChannelTransition } from "@/components/ChannelTransition";
import ProgressiveBlur from "@/components/ProgressiveBlur";
import UserAuthNav from "@/components/UserAuthNav";

type AdminTab = "tenants" | "auth_identities" | "agency_reseller" | "audit_logs";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<AdminTab>("tenants");

  // Store slices
  const [users, setUsers] = useState<TenantUser[]>(() => getAdminUsers());
  const [logs, setLogs] = useState<AdminAuditLog[]>(() => getAdminLogs());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(() => getAdminUsers()[0] || null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Auth Context integration
  const { 
    allSystemUsers, 
    impersonateUser, 
    updateTeamMember, 
    sendMagicLinkToUser, 
    resetPasswordForEmail, 
    inviteTeamMember,
    removeTeamMember
  } = useAuth();

  // Create Identity Modal
  const [isCreateIdentityOpen, setIsCreateIdentityOpen] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityEmail, setIdentityEmail] = useState("");
  const [identityRole, setIdentityRole] = useState<UserRole>("business_owner");
  const [identityBusiness, setIdentityBusiness] = useState("");

  // New Tenant Form State
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCategory, setNewCategory] = useState<TenantUser["category"]>("Salon & Spa");
  const [newPlan, setNewPlan] = useState<TenantUser["plan"]>("Growth ($79/mo)");

  const { playClick, playSuccess } = useAudio();
  const { triggerTransition } = useChannelTransition();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleFeature = (userId: string, featureKey: keyof TenantUser["features"]) => {
    playClick();
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        const currentVal = u.features[featureKey];
        const nextFeatures = { ...u.features, [featureKey]: !currentVal };
        return { ...u, features: nextFeatures };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveAdminUsers(updatedUsers);

    const target = updatedUsers.find((u) => u.id === userId);
    if (target) {
      setSelectedUser(target);
      addAdminLog(
        `TOGGLE_${featureKey.toUpperCase()}`,
        target.businessName,
        `Status set to ${!target.features[featureKey] ? "DISABLED" : "ENABLED"}`
      );
      setLogs(getAdminLogs());
      showToast(`Updated ${featureKey} for ${target.businessName}`);
    }
  };

  const handleStatusChange = (userId: string, newStatus: TenantUser["status"]) => {
    playClick();
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    setUsers(updatedUsers);
    saveAdminUsers(updatedUsers);
    const target = updatedUsers.find((u) => u.id === userId);
    if (target) {
      setSelectedUser(target);
      addAdminLog("CHANGE_STATUS", target.businessName, `Status modified to ${newStatus}`);
      setLogs(getAdminLogs());
      showToast(`Status changed to ${newStatus}`);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    playSuccess();
    addAdminLog(
      "RESET_PASSWORD",
      selectedUser.businessName,
      `SuperAdmin updated credentials for user ${selectedUser.email}`
    );
    setLogs(getAdminLogs());
    setIsPasswordModalOpen(false);
    setNewPassword("");
    showToast(`Credentials successfully updated for ${selectedUser.email}`);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName || !newEmail) return;
    playSuccess();

    const slug = newBusinessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newTenant: TenantUser = {
      id: "usr_" + Date.now(),
      businessName: newBusinessName,
      ownerName: newOwnerName || newBusinessName + " Owner",
      email: newEmail,
      slug,
      category: newCategory,
      plan: newPlan,
      status: "active",
      joinedDate: new Date().toISOString().split("T")[0],
      totalBookings: 0,
      grossRevenue: 0,
      stripeConnected: true,
      features: {
        whatsappReminders: true,
        zeroCommissionStripe: true,
        automatedInvoicing: true,
        aiReceptionist: true,
        calendarSync: true,
        customDomain: false,
        interactiveQuotes: true,
      },
      notes: "Newly onboarded via SuperAdmin console.",
    };

    const updated = [newTenant, ...users];
    setUsers(updated);
    saveAdminUsers(updated);
    setSelectedUser(newTenant);
    addAdminLog("ONBOARD_TENANT", newTenant.businessName, `Created tenant with slug /${slug}`);
    setLogs(getAdminLogs());

    // Also register in system users
    inviteTeamMember({
      fullName: newOwnerName || newBusinessName + " Owner",
      email: newEmail,
      role: "business_owner",
      permissions: ["bookings:manage", "invoicing:manage", "staff:manage"],
    });

    setIsAddUserModalOpen(false);
    setNewBusinessName("");
    setNewOwnerName("");
    setNewEmail("");
    showToast(`Tenant "${newTenant.businessName}" onboarded!`);
  };

  const handleImpersonate = (user: UserProfile) => {
    playSuccess();
    impersonateUser(user.id);
    addAdminLog("IMPERSONATE_USER", user.fullName, `SuperAdmin impersonated identity ${user.email}`);
    setLogs(getAdminLogs());
    showToast(`Now impersonating ${user.fullName} (${user.role})`);
    
    // Redirect appropriately
    triggerTransition(() => {
      if (user.role === "client") {
        router.push("/portal/tok_davenport_99a");
      } else {
        router.push("/dashboard");
      }
    });
  };

  const handleSendIdentityMagicLink = async (email: string) => {
    playClick();
    await sendMagicLinkToUser(email);
    addAdminLog("MAGIC_LINK_DISPATCH", email, "Dispatched Supabase passwordless OTP link");
    setLogs(getAdminLogs());
    showToast(`Passwordless magic link dispatched to ${email}`);
  };

  const handleSendIdentityPasswordReset = async (email: string) => {
    playClick();
    await resetPasswordForEmail(email);
    addAdminLog("PASSWORD_RESET_DISPATCH", email, "Dispatched password reset email via Supabase");
    setLogs(getAdminLogs());
    showToast(`Password reset instructions sent to ${email}`);
  };

  const handleUpdateIdentityRole = (userId: string, newRole: UserRole) => {
    playClick();
    updateTeamMember(userId, { role: newRole });
    addAdminLog("ROLE_ASSIGNMENT", userId, `Role changed to ${newRole}`);
    setLogs(getAdminLogs());
    showToast(`Role updated to ${newRole.toUpperCase()}`);
  };

  const handleCreateNewIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityName || !identityEmail) return;
    playSuccess();

    await inviteTeamMember({
      fullName: identityName,
      email: identityEmail,
      role: identityRole,
      permissions: identityRole === "super_admin" ? ["all:super_admin"] : ["bookings:manage", "invoicing:manage"],
    });

    addAdminLog("CREATE_AUTH_IDENTITY", identityName, `Created Supabase identity for ${identityEmail}`);
    setLogs(getAdminLogs());
    setIsCreateIdentityOpen(false);
    setIdentityName("");
    setIdentityEmail("");
    showToast(`Auth user ${identityEmail} successfully created & invited`);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col">
      <ProgressiveBlur position="top" height="h-20" />

      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#105F68] text-white px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              playClick();
              triggerTransition(() => router.push("/"));
            }}
            className="flex items-center gap-2 text-xs text-[#C8E6E2] hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#63C1BB]" />
            <span className="text-xs uppercase tracking-widest font-semibold text-[#C8E6E2]">
              Root Developer &amp; Super Admin Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-light">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10">
            <Database className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Supabase: dqfthhflydpnltsfbrvc (Live RLS)</span>
          </div>

          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Merchant Hub</span>
          </Link>

          {/* User Auth Dropdown */}
          <UserAuthNav />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1550px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* KPI Metric Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#3A9295] text-xs">
              <span className="uppercase tracking-wider">Active Tenants</span>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-light text-[#105F68]">{users.length}</h3>
              <p className="text-[11px] text-[#3A9295] mt-1">Multi-tenant RLS Isolated</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#3A9295] text-xs">
              <span className="uppercase tracking-wider">Auth Identities</span>
              <Users className="w-4 h-4 text-[#105F68]" />
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-light text-[#105F68]">{allSystemUsers.length}</h3>
              <p className="text-[11px] text-[#63C1BB] font-medium mt-1">Supabase Auth Users</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#3A9295] text-xs">
              <span className="uppercase tracking-wider">Completed Bookings</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-light text-[#105F68]">
                {users.reduce((acc, u) => acc + u.totalBookings, 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-[#3A9295] mt-1">100% WhatsApp Reminders Dispatched</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#105F68] text-white border border-[#105F68] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#C8E6E2] text-xs">
              <span className="uppercase tracking-wider">Saved For Merchants</span>
              <TrendingUp className="w-4 h-4 text-[#63C1BB]" />
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-light text-white">
                ${Math.round(users.reduce((acc, u) => acc + u.grossRevenue, 0) * 0.2).toLocaleString()}
              </h3>
              <p className="text-[11px] text-[#C8E6E2] mt-1">vs Fresha 20% Marketplace Take</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-black/5 pb-2">
          <button
            onClick={() => { playClick(); setCurrentTab("tenants"); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-light transition-all ${
              currentTab === "tenants"
                ? "bg-[#105F68] text-white shadow-sm"
                : "bg-white text-[#3A9295] hover:text-[#105F68] border border-black/5"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tenant Businesses &amp; Feature Flags</span>
          </button>

          <button
            onClick={() => { playClick(); setCurrentTab("auth_identities"); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-light transition-all ${
              currentTab === "auth_identities"
                ? "bg-[#105F68] text-white shadow-sm"
                : "bg-white text-[#3A9295] hover:text-[#105F68] border border-black/5"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Supabase Auth &amp; User Identities</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => { playClick(); setCurrentTab("agency_reseller"); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-light transition-all ${
              currentTab === "agency_reseller"
                ? "bg-[#105F68] text-white shadow-sm"
                : "bg-white text-[#3A9295] hover:text-[#105F68] border border-black/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Agency Reseller &amp; Multi-Gateway Hub</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-medium">Unfair Moat</span>
          </button>

          <button
            onClick={() => { playClick(); setCurrentTab("audit_logs"); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-light transition-all ${
              currentTab === "audit_logs"
                ? "bg-[#105F68] text-white shadow-sm"
                : "bg-white text-[#3A9295] hover:text-[#105F68] border border-black/5"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Security Audit Logs</span>
          </button>
        </div>

        {/* TAB 1: TENANTS & FEATURE FLAGS */}
        {currentTab === "tenants" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* User List Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-light text-[#105F68] tracking-tight">Businesses &amp; Tenants</h2>
                  <p className="text-xs text-[#3A9295]">Manage credentials, tiers &amp; status</p>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    setIsAddUserModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tenant</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#3A9295]" />
                <input
                  type="text"
                  placeholder="Search by business name, email, niche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#F6FAF9] border border-black/5 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              {/* User Cards List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#3A9295] bg-[#F6FAF9] rounded-2xl border border-black/5 p-4">
                    <p className="font-medium text-[#105F68]">No merchant tenants provisioned</p>
                    <p className="text-[11px] mt-1">Click &quot;Add Merchant Tenant&quot; above to provision a business account.</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          playClick();
                          setSelectedUser(user);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#C8E6E2]/25 border-[#105F68] shadow-sm"
                            : "bg-[#FBFDFD] border-black/5 hover:border-[#105F68]/30"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-[#105F68]">{user.businessName}</h4>
                            <p className="text-xs text-[#3A9295] font-light">{user.email}</p>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                              user.status === "active"
                                ? "bg-[#63C1BB]/20 text-[#105F68]"
                                : user.status === "suspended"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-[#3A9295]">
                          <span className="font-mono">ovel.lk/l/{user.slug}</span>
                          <span className="font-semibold text-[#105F68]">${user.grossRevenue.toLocaleString()} GMV</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected User Management & Feature Matrix (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedUser ? (
                <>
                  {/* Account Overview Box */}
                  <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C8E6E2]/40 text-[#105F68] font-medium uppercase">
                            {selectedUser.category}
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#105F68] text-white font-medium">
                            {selectedUser.plan}
                          </span>
                        </div>
                        <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                          {selectedUser.businessName}
                        </h3>
                        <p className="text-xs text-[#3A9295] mt-0.5">
                          Owner: <b>{selectedUser.ownerName}</b> • {selectedUser.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            playClick();
                            setIsPasswordModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#105F68]/20 hover:bg-[#105F68]/5 text-xs text-[#105F68] transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Credentials</span>
                        </button>

                        <button
                          onClick={() => {
                            const next = selectedUser.status === "active" ? "suspended" : "active";
                            handleStatusChange(selectedUser.id, next);
                          }}
                          className={`px-3.5 py-2 rounded-full text-xs font-light transition-all ${
                            selectedUser.status === "active"
                              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {selectedUser.status === "active" ? "Suspend Account" : "Activate Account"}
                        </button>
                      </div>
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs">
                      <div>
                        <span className="text-[#3A9295] block text-[11px]">Direct Stripe Link</span>
                        <span className="font-semibold text-[#105F68] flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-[#63C1BB]" />
                          Connected (0% Cut)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#3A9295] block text-[11px]">Total Appointments</span>
                        <span className="font-semibold text-[#105F68] mt-0.5 block">
                          {selectedUser.totalBookings} Completed
                        </span>
                      </div>
                      <div>
                        <span className="text-[#3A9295] block text-[11px]">Public Booking URL</span>
                        <Link
                          href={`/book/${selectedUser.slug}`}
                          target="_blank"
                          className="font-mono text-[#105F68] hover:underline flex items-center gap-1 mt-0.5 text-[11px]"
                        >
                          <span>/{selectedUser.slug}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Feature Toggles (SuperAdmin Instant Override) */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#105F68]" />
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-[#3A9295]">
                            Instant Feature Toggles
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#3A9295]">Immediate live DB sync</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(selectedUser.features).map(([key, enabled]) => {
                          const featureKey = key as keyof TenantUser["features"];
                          return (
                            <div
                              key={featureKey}
                              onClick={() => handleToggleFeature(selectedUser.id, featureKey)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                enabled
                                  ? "bg-[#C8E6E2]/20 border-[#105F68]/30"
                                  : "bg-[#FBFDFD] border-black/5 opacity-70"
                              }`}
                            >
                              <div>
                                <span className="text-xs font-medium text-[#105F68] block capitalize">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="text-[10px] text-[#3A9295]">
                                  {enabled ? "Active for Tenant" : "Disabled"}
                                </span>
                              </div>
                              <div>
                                {enabled ? (
                                  <ToggleRight className="w-7 h-7 text-[#105F68]" />
                                ) : (
                                  <ToggleLeft className="w-7 h-7 text-gray-300" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-[#105F68]/10">
                  <Building2 className="w-12 h-12 text-[#3A9295] mx-auto mb-3 opacity-60" />
                  <p className="text-sm text-[#105F68]">Select a business to view details and features</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE AUTH & USER IDENTITIES */}
        {currentTab === "auth_identities" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                      Supabase Auth Cloud
                    </span>
                    <span className="text-xs text-[#3A9295] font-mono">
                      https://dqfthhflydpnltsfbrvc.supabase.co
                    </span>
                  </div>
                  <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                    Global User &amp; Authentication Control
                  </h3>
                  <p className="text-xs text-[#3A9295] mt-0.5">
                    Live directory of identity accounts across all tenants. 1-click impersonation &amp; passwordless dispatch.
                  </p>
                </div>

                <button
                  onClick={() => {
                    playClick();
                    setIsCreateIdentityOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create User Identity</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-black/5 text-[#3A9295] uppercase tracking-wider">
                      <th className="pb-3 font-medium">User Identity</th>
                      <th className="pb-3 font-medium">Tenant Organization</th>
                      <th className="pb-3 font-medium">System Role</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Last Login</th>
                      <th className="pb-3 font-medium text-right">SuperAdmin Auth Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {allSystemUsers.map((u) => {
                      const initials = u.fullName.split(" ").map(n => n[0]).join("").slice(0, 2);
                      return (
                        <tr key={u.id} className="hover:bg-[#F6FAF9]/50 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#105F68] text-white flex items-center justify-center font-medium text-xs">
                                {initials}
                              </div>
                              <div>
                                <span className="font-medium text-[#105F68] block">{u.fullName}</span>
                                <span className="text-[11px] text-[#3A9295] font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="text-[#105F68] font-medium block">
                              {u.organizationName || "Global Root"}
                            </span>
                            <span className="text-[10px] text-[#3A9295] font-mono">
                              {u.organizationSlug ? `/${u.organizationSlug}` : "root"}
                            </span>
                          </td>

                          <td className="py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateIdentityRole(u.id, e.target.value as UserRole)}
                              className="px-2.5 py-1 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-medium focus:outline-none"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="business_owner">Business Owner</option>
                              <option value="staff">Specialist Staff</option>
                              <option value="client">Client</option>
                            </select>
                          </td>

                          <td className="py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                              u.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : u.status === "invited"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                u.status === "active" ? "bg-emerald-500" : u.status === "invited" ? "bg-amber-500" : "bg-red-500"
                              }`}></span>
                              {u.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </td>

                          <td className="py-4 text-[#3A9295] font-mono text-[11px]">
                            {u.lastLogin || "Active Session"}
                          </td>

                          <td className="py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* 1-Click Impersonate Button */}
                              <button
                                onClick={() => handleImpersonate(u)}
                                title="1-Click Impersonate User View"
                                className="px-3 py-1 rounded-full bg-[#105F68] text-white text-[11px] font-light hover:bg-[#0D4F57] transition-all flex items-center gap-1 shadow-sm"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Impersonate</span>
                              </button>

                              {/* Send Magic Link */}
                              <button
                                onClick={() => handleSendIdentityMagicLink(u.email)}
                                title="Send Supabase Magic Link"
                                className="p-1.5 rounded-lg border border-black/10 hover:bg-[#F6FAF9] text-[#105F68] transition-all"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>

                              {/* Send Password Reset */}
                              <button
                                onClick={() => handleSendIdentityPasswordReset(u.email)}
                                title="Send Password Reset Email"
                                className="p-1.5 rounded-lg border border-black/10 hover:bg-[#F6FAF9] text-[#3A9295] transition-all"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AGENCY RESELLER & MULTI-GATEWAY HUB (UNFAIR MOAT) */}
        {currentTab === "agency_reseller" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Agency Reseller Header */}
            <div className="bg-gradient-to-br from-[#105F68] to-[#0D4F57] text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#63C1BB]/20 border border-[#63C1BB]/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#63C1BB]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-light tracking-tight">
                        Agency Reseller Engine
                      </h2>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#63C1BB] text-[#105F68] font-bold">
                        Unfair Moat #6
                      </span>
                    </div>
                    <p className="text-xs text-[#C8E6E2] font-light">
                      Master agency distribution • 1-click industry template cloning • White-label CNAME custom domains.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xs">
                  <span className="text-[#C8E6E2]">Active Master Seats:</span>
                  <span className="font-semibold text-white">4 Sub-Tenants Managed</span>
                </div>
              </div>
            </div>

            {/* 1-Click Industry Starter Kit Template Cloners */}
            <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-light text-[#105F68] tracking-tight">
                  1-Click Industry Starter Kit Cloners
                </h3>
                <p className="text-xs text-[#3A9295]">
                  Deploy pre-configured booking catalogs, intake forms, buffer rules &amp; WhatsApp scripts in 1 click.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Aesthetic & Medical Clinic",
                    niche: "Clinical Services",
                    desc: "Hydrafacial, microneedling protocols, prescription barrier intake, Dr. Moreau staff hours & 15m buffers.",
                    slug: "leclat",
                    color: "border-[#105F68]/20 bg-[#F6FAF9]",
                  },
                  {
                    title: "Automotive Detailing Pro",
                    niche: "Bay & Equipment Rental",
                    desc: "Ceramic coating add-on pricing, vehicle size routing, lift bay 1-3 equipment allocation & deposit rules.",
                    slug: "apex-studio",
                    color: "border-sky-200 bg-sky-50/40",
                  },
                  {
                    title: "Artisanal Bakery Express",
                    niche: "Custom Orders & Pre-Orders",
                    desc: "Sourdough batches, morning pickup time slots, dietary intake questions & custom cake size toggles.",
                    slug: "craft-bakes",
                    color: "border-amber-200 bg-amber-50/40",
                  },
                  {
                    title: "Creative Studio & Podcast",
                    niche: "Hourly Time Rentals",
                    desc: "Podcast booth A/B, photography cyclorama wall, strobe equipment gear locker add-ons & instant entry tokens.",
                    slug: "vance-studio",
                    color: "border-purple-200 bg-purple-50/40",
                  },
                ].map((tpl, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border ${tpl.color} flex flex-col justify-between space-y-4 shadow-sm`}
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295]">
                        {tpl.niche}
                      </span>
                      <h4 className="text-sm font-semibold text-[#105F68]">{tpl.title}</h4>
                      <p className="text-xs text-[#103438]/80 leading-relaxed font-light">{tpl.desc}</p>
                    </div>

                    <button
                      onClick={() => {
                        playSuccess();
                        showToast(`Cloned '${tpl.title}' into new isolated tenant instance! Generated ovel.lk/l/${tpl.slug}-clone`);
                      }}
                      className="w-full py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#63C1BB]" />
                      <span>Clone to Client Instance</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* White-Label CNAME Domains & Multi-Gateway Agility Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* White-Label Custom Domains */}
              <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#105F68]" />
                    <h3 className="text-base font-semibold text-[#105F68]">
                      White-Label Custom CNAME Domains
                    </h3>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#A5D6A7]">
                    Cloudflare SSL Active
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { domain: "book.leclat.clinic", tenant: "L'Éclat Aesthetic Clinic", status: "Active (SSL Verified)" },
                    { domain: "schedule.apexdetailing.io", tenant: "Apex Precision Auto Detailing", status: "Active (Cloudflare CNAME)" },
                    { domain: "orders.craftbakes.co", tenant: "Craft & Crust Artisanal Bakes", status: "Active (SSL Verified)" },
                    { domain: "rentals.vancestudios.com", tenant: "Vance Production Studios", status: "Pending DNS Propagation" },
                  ].map((item, dIdx) => (
                    <div key={dIdx} className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-[#105F68] block">{item.domain}</span>
                        <span className="text-[11px] text-[#3A9295]">{item.tenant}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.status.includes("Active") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Gateway Agility (0% Platform Cut Guarantee) */}
              <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#105F68]" />
                    <h3 className="text-base font-semibold text-[#105F68]">
                      Multi-Gateway Agility (0% Platform Take-Rate)
                    </h3>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#63C1BB]/20 text-[#105F68] font-bold">
                    $0.00 Transaction Cuts
                  </span>
                </div>

                <p className="text-xs text-[#3A9295] leading-relaxed">
                  Never lock merchants into Square hardware or Fresha&apos;s 20% marketplace take-rate. Connect direct Stripe Standard accounts or international regional gateways.
                </p>

                <div className="space-y-3">
                  {[
                    { name: "Stripe Connect Standard", desc: "Direct merchant settlement • SetupIntent card-on-file", cut: "0% Ovel Cut", active: true },
                    { name: "LemonSqueezy Global MoR", desc: "Automated international VAT/tax compliance", cut: "0% Ovel Cut", active: false },
                    { name: "Mollie European Gateway", desc: "iDEAL, Bancontact, SEPA instant recurring debits", cut: "0% Ovel Cut", active: false },
                    { name: "Custom Webhook Processor", desc: "Direct HTTP POST notification to merchant POS", cut: "0% Ovel Cut", active: true },
                  ].map((gw, gIdx) => (
                    <div key={gIdx} className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#105F68] block">{gw.name}</span>
                        <span className="text-[11px] text-[#3A9295]">{gw.desc}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68] text-white font-medium block">
                          {gw.cut}
                        </span>
                        <span className="text-[10px] text-[#2E7D32] mt-0.5 block">
                          {gw.active ? "● Primary Connected" : "Available"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {currentTab === "audit_logs" && (
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-light text-[#105F68] tracking-tight">
                  Security &amp; Developer Telemetry Stream
                </h3>
                <p className="text-xs text-[#3A9295]">Immutable log of authentication mutations and policy checks</p>
              </div>

              <span className="text-xs font-mono text-[#3A9295] bg-[#F6FAF9] px-3 py-1 rounded-full border border-black/5">
                {logs.length} Total Telemetry Records
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs" suppressHydrationWarning>
              {logs.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#3A9295] bg-[#F6FAF9] rounded-2xl border border-black/5 p-4 font-sans">
                  <p className="font-medium text-[#105F68]">No audit telemetry recorded yet</p>
                  <p className="text-[11px] mt-1">Tenant provisioning, role mutations, and security events will log here.</p>
                </div>
              ) : (
                logs.map((lg) => (
                  <div
                    key={lg.id}
                    suppressHydrationWarning
                    className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#3A9295] text-[10px]" suppressHydrationWarning>{lg.timestamp}</span>
                      <span className="text-[#105F68] font-bold">[{lg.action}]</span>
                      <span className="text-[#103438]">{lg.details}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/5 text-[#3A9295]">
                      {lg.targetTenant}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Password Reset Modal */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-light text-[#105F68]">Manage Credentials</h3>
                <p className="text-xs text-[#3A9295]">{selectedUser.businessName}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">
                  New Password for {selectedUser.email}
                </label>
                <input
                  type="text"
                  placeholder="Enter secure password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#C8E6E2]/30 border border-[#9ED5D1]/50 text-[11px] text-[#105F68]">
                Alternatively, a tokenized passwordless magic-link can be dispatched directly to {selectedUser.email}.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-light text-[#105F68]">Onboard New Tenant</h3>
                <p className="text-xs text-[#3A9295]">Instantly creates custom booking slug &amp; DB isolation</p>
              </div>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lumina Skin Studio"
                  required
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="owner@company.com"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Industry Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TenantUser["category"])}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="Aesthetic Clinic">Aesthetic Clinic</option>
                    <option value="Salon & Spa">Salon &amp; Spa</option>
                    <option value="Mobile Detailing">Mobile Detailing</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Wellness">Wellness</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#3A9295] font-medium block mb-1">Flat Subscription Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as TenantUser["plan"])}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="Pilot ($39/mo)">Pilot ($39/mo)</option>
                    <option value="Growth ($79/mo)">Growth ($79/mo)</option>
                    <option value="Scale ($149/mo)">Scale ($149/mo)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deploy Tenant Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Auth Identity Modal */}
      {isCreateIdentityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-light text-[#105F68]">Create Auth Identity</h3>
                <p className="text-xs text-[#3A9295]">Register Supabase user with assigned role</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewIdentity} className="space-y-4">
              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Julian Vance"
                  required
                  value={identityName}
                  onChange={(e) => setIdentityName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="julian@vancestudios.co"
                  required
                  value={identityEmail}
                  onChange={(e) => setIdentityEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Global System Role</label>
                <select
                  value={identityRole}
                  onChange={(e) => setIdentityRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                >
                  <option value="business_owner">Business Owner (Merchant Org Head)</option>
                  <option value="staff">Specialist Staff Member</option>
                  <option value="super_admin">Developer Super Admin</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsCreateIdentityOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Identity &amp; Send Magic Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-[#63C1BB]/30 animate-fadeUp">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
