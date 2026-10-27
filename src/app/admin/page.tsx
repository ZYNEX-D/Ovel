"use client";

import React, { useState, useMemo } from "react";
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
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Zap,
  Tag,
  CheckCircle2,
  XCircle,
  Filter,
  MoreVertical,
  ChevronRight,
  UserX,
  UserPlus,
  Settings,
  FolderTree,
  FileCheck,
  Receipt,
  Phone,
  DollarSign,
  Copy,
} from "lucide-react";
import {
  TenantUser,
  TenantFeatures,
  SubscriptionPlanId,
  ADMIN_PLAN_TIERS,
  ALL_PLATFORM_FEATURES,
  AdminAuditLog,
  getAdminUsers,
  saveAdminUsers,
  addAdminUser,
  updateAdminUser,
  deleteAdminUser,
  toggleUserFeature,
  enableAllUserFeatures,
  disableAllUserFeatures,
  resetUserFeaturesToPlan,
  updateUserPlan,
  getAdminLogs,
  addAdminLog,
  clearAdminLogs,
} from "@/lib/admin-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

type AdminTab = "users" | "features" | "plans" | "audit_logs" | "credentials";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<AdminTab>("users");

  // Store data
  const [users, setUsers] = useState<TenantUser[]>(() => getAdminUsers());
  const [logs, setLogs] = useState<AdminAuditLog[]>(() => getAdminLogs());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Selected User for feature management / details drawer
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(() => getAdminUsers()[0] || null);

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // New Tenant Form
  const [formBusinessName, setFormBusinessName] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<TenantUser["category"]>("Aesthetic Clinic");
  const [formPlan, setFormPlan] = useState<SubscriptionPlanId>("growth");

  // Edit Tenant Form
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState<TenantUser["category"]>("Aesthetic Clinic");
  const [editStatus, setEditStatus] = useState<TenantUser["status"]>("active");
  const [editRole, setEditRole] = useState<TenantUser["role"]>("business_owner");

  const { impersonateUser } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshState = () => {
    const freshUsers = getAdminUsers();
    setUsers(freshUsers);
    setLogs(getAdminLogs());
    if (selectedUser) {
      const refreshed = freshUsers.find((u) => u.id === selectedUser.id);
      if (refreshed) setSelectedUser(refreshed);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesPlan = planFilter === "all" || u.planId === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, searchTerm, statusFilter, planFilter]);

  // Financial & Stats calculations
  const totalMRR = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.status === "active" ? u.monthlyFeeLkr : 0), 0);
  }, [users]);

  const activeTenantsCount = useMemo(() => {
    return users.filter((u) => u.status === "active").length;
  }, [users]);

  // Feature Toggle Handlers
  const handleFeatureToggle = (featureKey: keyof TenantFeatures) => {
    if (!selectedUser) return;
    playClick();
    const nextState = toggleUserFeature(selectedUser.id, featureKey);
    refreshState();
    showToast(`Feature '${featureKey}' is now ${nextState ? "ENABLED" : "DISABLED"} for ${selectedUser.businessName}`);
  };

  const handleEnableAllFeatures = () => {
    if (!selectedUser) return;
    playSuccess();
    enableAllUserFeatures(selectedUser.id);
    refreshState();
    showToast(`All 14 platform features ENABLED for ${selectedUser.businessName}`);
  };

  const handleDisableAllFeatures = () => {
    if (!selectedUser) return;
    playClick();
    disableAllUserFeatures(selectedUser.id);
    refreshState();
    showToast(`All optional features DISABLED for ${selectedUser.businessName}`);
  };

  const handleResetFeaturesToPlan = () => {
    if (!selectedUser) return;
    playClick();
    resetUserFeaturesToPlan(selectedUser.id);
    refreshState();
    showToast(`Restored default ${selectedUser.planName} feature bundle for ${selectedUser.businessName}`);
  };

  // Plan Switch Handler
  const handlePlanChange = (targetPlanId: SubscriptionPlanId) => {
    if (!selectedUser) return;
    playSuccess();
    updateUserPlan(selectedUser.id, targetPlanId);
    refreshState();
    setIsChangePlanModalOpen(false);
    showToast(`Upgraded ${selectedUser.businessName} to ${ADMIN_PLAN_TIERS[targetPlanId].name} tier.`);
  };

  // Status Change Handler
  const handleStatusChange = (userId: string, newStatus: TenantUser["status"]) => {
    playClick();
    updateAdminUser(userId, { status: newStatus });
    refreshState();
    showToast(`Tenant status updated to ${newStatus.toUpperCase()}`);
  };

  // Impersonate Tenant
  const handleImpersonate = (user: TenantUser) => {
    playSuccess();
    impersonateUser(user.id);
    addAdminLog("IMPERSONATE", user.businessName, `Administrator impersonated session as ${user.email}`);
    router.push("/dashboard");
  };

  // Add User Submission
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBusinessName || !formEmail) return;

    playSuccess();
    const newUser = addAdminUser({
      businessName: formBusinessName,
      ownerName: formOwnerName || "Merchant Owner",
      email: formEmail,
      phone: formPhone || "+94 (77) 000-0000",
      slug: formSlug || formBusinessName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: formCategory,
      planId: formPlan,
    });

    refreshState();
    setSelectedUser(newUser);
    setIsAddUserModalOpen(false);

    // reset fields
    setFormBusinessName("");
    setFormOwnerName("");
    setFormEmail("");
    setFormPhone("");
    setFormSlug("");
    showToast(`New tenant ${newUser.businessName} successfully created!`);
  };

  // Open Edit User Modal
  const openEditModal = (u: TenantUser) => {
    setSelectedUser(u);
    setEditBusinessName(u.businessName);
    setEditOwnerName(u.ownerName);
    setEditEmail(u.email);
    setEditPhone(u.phone || "");
    setEditSlug(u.slug);
    setEditCategory(u.category);
    setEditStatus(u.status);
    setEditRole(u.role);
    setIsEditUserModalOpen(true);
  };

  // Edit User Submission
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    playSuccess();
    updateAdminUser(selectedUser.id, {
      businessName: editBusinessName,
      ownerName: editOwnerName,
      email: editEmail,
      phone: editPhone,
      slug: editSlug,
      category: editCategory,
      status: editStatus,
      role: editRole,
    });

    refreshState();
    setIsEditUserModalOpen(false);
    showToast(`Saved modifications for ${editBusinessName}`);
  };

  // Delete User Confirmation
  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    playClick();
    deleteAdminUser(userToDelete.id);
    refreshState();
    setIsDeleteConfirmOpen(false);
    if (selectedUser?.id === userToDelete.id) {
      setSelectedUser(users.find((u) => u.id !== userToDelete.id) || null);
    }
    showToast(`Tenant ${userToDelete.businessName} permanently purged.`);
    setUserToDelete(null);
  };

  // Password Reset simulation
  const handleGeneratePassword = () => {
    if (!selectedUser) return;
    playSuccess();
    const tempPass = "OvelPass-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "!";
    setNewPassword(tempPass);
    addAdminLog("RESET_PASSWORD", selectedUser.businessName, `Generated temporary access credentials for ${selectedUser.email}`);
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#105F68] text-white text-xs font-light shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Super Admin Architectural Header */}
      <header className="sticky top-0 z-40 bg-[#F6FAF9]/90 backdrop-blur-md border-b border-[#105F68]/15 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-['Disolve'] text-2xl text-[#105F68] tracking-tight">Ovel</span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#105F68]/10 text-[#105F68] border border-[#105F68]/20">
                Root Kernel
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#3A9295] pl-3 border-l border-[#105F68]/15">
              <span className="w-2 h-2 rounded-full bg-[#105F68] animate-pulse" />
              <span>Zero-Take Engine Online</span>
              <span className="opacity-40">•</span>
              <span>14 Feature Flags</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playClick();
                setIsAddUserModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-tight transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Merchant</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#105F68]/20 hover:border-[#105F68]/40 text-[#105F68] text-xs font-light transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#3A9295]" />
              <span>Dashboard View</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68] transition-colors"
            >
              <span>Sign Out</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => {
              playClick();
              setCurrentTab("users");
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === "users"
                ? "bg-[#105F68] text-white font-medium shadow-sm"
                : "bg-white/60 text-[#3A9295] hover:bg-white hover:text-[#105F68]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setCurrentTab("features");
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === "features"
                ? "bg-[#105F68] text-white font-medium shadow-sm"
                : "bg-white/60 text-[#3A9295] hover:bg-white hover:text-[#105F68]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Feature Flag Matrix (14)</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setCurrentTab("plans");
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === "plans"
                ? "bg-[#105F68] text-white font-medium shadow-sm"
                : "bg-white/60 text-[#3A9295] hover:bg-white hover:text-[#105F68]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Plan Management</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setCurrentTab("audit_logs");
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === "audit_logs"
                ? "bg-[#105F68] text-white font-medium shadow-sm"
                : "bg-white/60 text-[#3A9295] hover:bg-white hover:text-[#105F68]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setCurrentTab("credentials");
            }}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              currentTab === "credentials"
                ? "bg-[#105F68] text-white font-medium shadow-sm"
                : "bg-white/60 text-[#3A9295] hover:bg-white hover:text-[#105F68]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Credentials.txt</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3A9295] font-mono uppercase">
              <span>Total Tenants</span>
              <Users className="w-4 h-4 text-[#105F68]" />
            </div>
            <div className="text-3xl font-light text-[#105F68]">{users.length}</div>
            <div className="text-[11px] text-[#3A9295]">
              {activeTenantsCount} active • {users.length - activeTenantsCount} suspended/pending
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3A9295] font-mono uppercase">
              <span>Active Platform MRR</span>
              <DollarSign className="w-4 h-4 text-[#63C1BB]" />
            </div>
            <div className="text-3xl font-light text-[#105F68]">LKR {totalMRR.toLocaleString()}</div>
            <div className="text-[11px] text-[#3A9295]">Flat software recurring revenue</div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3A9295] font-mono uppercase">
              <span>Commission Take-Rate</span>
              <ShieldCheck className="w-4 h-4 text-[#105F68]" />
            </div>
            <div className="text-3xl font-light text-[#105F68]">0.0%</div>
            <div className="text-[11px] text-[#3A9295]">100% merchant settlement guaranteed</div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-[#3A9295] font-mono uppercase">
              <span>Platform Feature Flags</span>
              <Sliders className="w-4 h-4 text-[#105F68]" />
            </div>
            <div className="text-3xl font-light text-[#105F68]">14 / 14</div>
            <div className="text-[11px] text-[#3A9295]">Granular per-user override enabled</div>
          </div>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {currentTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter & Search Bar */}
            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by business, owner, email, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#3A9295]">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#F6FAF9] border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending_setup">Pending</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[#3A9295]">Plan:</span>
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-[#F6FAF9] border border-black/10 rounded-xl px-2.5 py-1.5 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="all">All Plans</option>
                    <option value="free">Starter (Free)</option>
                    <option value="growth">Growth (500)</option>
                    <option value="scale">Scale (1500)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-white border border-[#105F68]/15 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/5 bg-[#F6FAF9]/50 text-[#3A9295] font-mono uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6 font-medium">Merchant &amp; Studio</th>
                      <th className="py-4 px-6 font-medium">Tier &amp; Quota</th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium">Feature Flags</th>
                      <th className="py-4 px-6 font-medium">Public Storefront</th>
                      <th className="py-4 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 font-light text-[#103438]">
                    {filteredUsers.map((u) => {
                      const enabledCount = Object.values(u.features).filter(Boolean).length;
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-[#F6FAF9]/50 transition-colors ${
                            selectedUser?.id === u.id ? "bg-[#C8E6E2]/15" : ""
                          }`}
                        >
                          {/* Business Info */}
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[#105F68]">{u.businessName}</span>
                                {u.role === "super_admin" && (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold uppercase">
                                    Root
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#3A9295]">
                                {u.ownerName} • <span className="font-mono">{u.email}</span>
                              </div>
                              <div className="text-[10px] text-[#3A9295]/70 font-mono">
                                Cat: {u.category} • Tel: {u.phone || "N/A"}
                              </div>
                            </div>
                          </td>

                          {/* Tier */}
                          <td className="py-4 px-6">
                            <span
                              className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-medium ${
                                u.planId === "scale"
                                  ? "bg-[#105F68]/10 text-[#105F68] border border-[#105F68]/30"
                                  : u.planId === "growth"
                                  ? "bg-amber-100 text-amber-800"
                                  : u.planId === "enterprise"
                                  ? "bg-purple-100 text-purple-800 font-bold"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.planName} (LKR {u.monthlyFeeLkr}/mo)
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <button
                              onClick={() => {
                                const nextStatus =
                                  u.status === "active"
                                    ? "suspended"
                                    : u.status === "suspended"
                                    ? "active"
                                    : "active";
                                handleStatusChange(u.id, nextStatus);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
                                u.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : u.status === "suspended"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === "active"
                                    ? "bg-emerald-600"
                                    : u.status === "suspended"
                                    ? "bg-rose-600"
                                    : "bg-amber-600"
                                }`}
                              />
                              <span>{u.status}</span>
                            </button>
                          </td>

                          {/* Feature Count */}
                          <td className="py-4 px-6">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setCurrentTab("features");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#105F68]/20 hover:border-[#105F68] text-[#105F68] font-mono text-xs transition-all shadow-sm"
                            >
                              <Sliders className="w-3 h-3 text-[#3A9295]" />
                              <span>{enabledCount} / 14 Active</span>
                            </button>
                          </td>

                          {/* Storefront Link */}
                          <td className="py-4 px-6">
                            <Link
                              href={`/l/${u.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 font-mono text-xs text-[#105F68] hover:underline"
                            >
                              <span>/l/{u.slug}</span>
                              <ExternalLink className="w-3 h-3 text-[#3A9295]" />
                            </Link>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Manage Features */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setCurrentTab("features");
                                }}
                                title="Manage Features"
                                className="p-2 rounded-xl bg-[#F6FAF9] hover:bg-[#C8E6E2]/40 text-[#105F68] border border-black/5 transition-all"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit User Details"
                                className="p-2 rounded-xl bg-[#F6FAF9] hover:bg-[#C8E6E2]/40 text-[#105F68] border border-black/5 transition-all"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>

                              {/* Impersonate */}
                              <button
                                onClick={() => handleImpersonate(u)}
                                title="Log In As User (Impersonate)"
                                className="p-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white transition-all shadow-sm"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete (prevent deleting root) */}
                              {u.role !== "super_admin" && (
                                <button
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  title="Delete Tenant"
                                  className="p-2 rounded-xl bg-[#F6FAF9] hover:bg-rose-50 text-rose-600 border border-black/5 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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

        {/* TAB 2: FEATURE FLAG MATRIX */}
        {currentTab === "features" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* User Selector Strip */}
            <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#3A9295]">
                  FEATURE CONTROL MATRIX
                </span>
                <h3 className="text-2xl font-light text-[#105F68]">
                  Enabling &amp; Disabling Capabilities for:{" "}
                  <span className="font-semibold">{selectedUser?.businessName}</span>
                </h3>
                <p className="text-xs text-[#3A9295] font-light">
                  Active Tier: <span className="font-mono text-[#105F68] font-medium">{selectedUser?.planName}</span> •
                  Slug: <span className="font-mono text-[#105F68]">/l/{selectedUser?.slug}</span>
                </p>
              </div>

              {/* Target User Selector Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#3A9295]">Selected Merchant:</span>
                  <select
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const u = users.find((usr) => usr.id === e.target.value);
                      if (u) setSelectedUser(u);
                    }}
                    className="bg-[#F6FAF9] border border-[#105F68]/20 rounded-2xl px-3 py-2 text-xs text-[#105F68] font-medium focus:outline-none focus:border-[#105F68]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.businessName} ({u.planName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEnableAllFeatures}
                    className="px-3.5 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-tight transition-all shadow-sm"
                  >
                    Enable All (14)
                  </button>
                  <button
                    onClick={handleDisableAllFeatures}
                    className="px-3.5 py-2 rounded-full bg-white border border-black/15 hover:border-black/30 text-xs text-[#103438] transition-all"
                  >
                    Disable All
                  </button>
                  <button
                    onClick={handleResetFeaturesToPlan}
                    className="px-3.5 py-2 rounded-full bg-[#C8E6E2]/40 hover:bg-[#C8E6E2]/70 text-xs text-[#105F68] font-medium transition-all"
                  >
                    Reset to Plan Default
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_PLATFORM_FEATURES.map((feat) => {
                const isEnabled = Boolean(selectedUser?.features[feat.key]);
                return (
                  <div
                    key={feat.key}
                    className={`p-6 rounded-3xl transition-all border ${
                      isEnabled
                        ? "bg-white border-[#105F68]/30 shadow-md"
                        : "bg-[#F6FAF9]/60 border-black/5 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68]">
                          {feat.category}
                        </span>
                        <h4 className="text-base font-medium text-[#105F68]">{feat.name}</h4>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleFeatureToggle(feat.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? "bg-[#105F68]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-[#3A9295] font-light leading-relaxed mb-4">
                      {feat.description}
                    </p>

                    <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#3A9295]">Tier Requirement:</span>
                      <span className="uppercase text-[#105F68] font-semibold">{feat.planTierMin}+</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PLAN MANAGEMENT */}
        {currentTab === "plans" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#3A9295]">
                  SUBSCRIPTION ARCHITECTURE
                </span>
                <h3 className="text-2xl font-light text-[#105F68] mt-1">
                  Plan Quotas &amp; Tier Configuration
                </h3>
                <p className="text-xs text-[#3A9295] font-light mt-1">
                  Manage commercial tiers, monthly booking quotas, and assign subscription packages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSuccess();
                    showToast("Plan matrix synchronized with subscription store.");
                  }}
                  className="px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light tracking-tight hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  Sync Store Matrix
                </button>
              </div>
            </div>

            {/* Plan Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(Object.keys(ADMIN_PLAN_TIERS) as SubscriptionPlanId[]).map((planKey) => {
                const plan = ADMIN_PLAN_TIERS[planKey];
                const tenantsOnPlan = users.filter((u) => u.planId === planKey);
                return (
                  <div
                    key={planKey}
                    className="p-8 rounded-[2.5rem] bg-white border border-[#105F68]/15 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] font-semibold">
                          {plan.badge}
                        </span>
                        <span className="text-xs font-mono text-[#3A9295]">
                          {tenantsOnPlan.length} Tenants
                        </span>
                      </div>

                      <div>
                        <h4 className="text-2xl font-light text-[#105F68]">{plan.name}</h4>
                        <p className="text-xs text-[#3A9295] font-light mt-1">{plan.tagline}</p>
                      </div>

                      <div className="py-3 border-y border-black/5 flex items-baseline gap-1.5">
                        <span className="text-xs font-mono text-[#3A9295]">LKR</span>
                        <span className="text-4xl font-light text-[#105F68]">{plan.priceLkr.toLocaleString()}</span>
                        <span className="text-xs text-[#3A9295] font-light">/ mo</span>
                      </div>

                      <ul className="space-y-2 text-xs font-light text-[#103438]">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
                          <span>Max {plan.maxOfferings} Services / Offerings</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
                          <span>Max {plan.maxMonthlyOrders} Orders/Bookings / mo</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
                          <span>0% Platform Commission</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#63C1BB]" />
                          <span>
                            {plan.overflowOrderPriceLkr > 0
                              ? `+${plan.overflowOrderPriceLkr} LKR / overflow order`
                              : "No overflow penalty"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-black/5 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-[#3A9295] block">
                        Quick Assign to {selectedUser?.businessName}:
                      </span>
                      <button
                        onClick={() => handlePlanChange(planKey)}
                        disabled={selectedUser?.planId === planKey}
                        className={`w-full py-2.5 rounded-full text-xs font-light tracking-tight transition-all ${
                          selectedUser?.planId === planKey
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-[#105F68] hover:bg-[#0D4F57] text-white shadow-sm"
                        }`}
                      >
                        {selectedUser?.planId === planKey ? "Current Plan" : `Assign ${plan.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {currentTab === "audit_logs" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-white border border-[#105F68]/15 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#3A9295]">
                  AUDIT LOG DIRECTORY
                </span>
                <h3 className="text-2xl font-light text-[#105F68] mt-1">
                  Administrative Action Timelines
                </h3>
              </div>

              <button
                onClick={() => {
                  playClick();
                  clearAdminLogs();
                  setLogs([]);
                  showToast("Audit logs cleared.");
                }}
                className="px-4 py-2 rounded-full border border-black/15 text-xs text-[#3A9295] hover:text-[#105F68] hover:border-[#105F68] transition-all"
              >
                Clear Logs
              </button>
            </div>

            <div className="rounded-3xl bg-white border border-[#105F68]/15 shadow-sm overflow-hidden">
              <div className="divide-y divide-black/5 text-xs font-mono">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-[#3A9295]">No administrative logs recorded yet.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6FAF9]/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#105F68]/10 text-[#105F68] font-semibold text-[10px]">
                            {log.action}
                          </span>
                          <span className="text-[#103438] font-medium">{log.targetTenant}</span>
                        </div>
                        <p className="text-[11px] text-[#3A9295]">{log.details}</p>
                      </div>

                      <div className="text-right text-[10px] text-[#3A9295]/70 shrink-0">
                        <div>{log.timestamp}</div>
                        <div>{log.actor}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CREDENTIALS REFERENCE */}
        {currentTab === "credentials" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-8 rounded-[2.5rem] bg-white border border-[#105F68]/15 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#3A9295]">
                    CREDENTIALS.TXT REFERENCE
                  </span>
                  <h3 className="text-2xl font-light text-[#105F68] mt-1">
                    System Master Access Records
                  </h3>
                  <p className="text-xs text-[#3A9295] font-light mt-1">
                    These credentials are synchronized with <code className="bg-[#C8E6E2]/40 px-2 py-0.5 rounded text-[#105F68]">credentials.txt</code> in the repository root.
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText("admin@ovel.lk / OvelAdmin@2026!");
                    playSuccess();
                    showToast("Copied admin login credentials to clipboard!");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Admin Auth</span>
                </button>
              </div>

              {/* Admin Credentials Card */}
              <div className="p-6 rounded-3xl bg-[#F6FAF9] border border-[#105F68]/20 space-y-4">
                <div className="flex items-center gap-2 font-medium text-sm text-[#105F68]">
                  <ShieldCheck className="w-4 h-4 text-[#63C1BB]" />
                  <span>Platform Super Administrator</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-white rounded-xl border border-black/5">
                    <span className="text-[#3A9295] block text-[10px] uppercase">Primary Email:</span>
                    <span className="text-[#105F68] font-bold">admin@ovel.lk</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-black/5">
                    <span className="text-[#3A9295] block text-[10px] uppercase">Master Password:</span>
                    <span className="text-[#105F68] font-bold">OvelAdmin@2026!</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-black/5">
                    <span className="text-[#3A9295] block text-[10px] uppercase">Access URL:</span>
                    <span className="text-[#105F68] font-bold">http://localhost:3000/admin</span>
                  </div>
                </div>
              </div>

              {/* Demo Accounts List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[#105F68] font-mono uppercase">
                  Verified Demo Merchant Accounts:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 bg-[#F6FAF9] rounded-2xl border border-black/5 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#105F68]">
                      <span>L&apos;Éclat Boutique (Care Clinic)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#105F68]/10 text-[#105F68]">Scale</span>
                    </div>
                    <div>Email: <span className="text-[#105F68]">genevieve@ovel.lk</span></div>
                    <div>Password: <span className="text-[#105F68]">MerchantPass@2026!</span></div>
                    <div>Storefront: <span className="text-[#3A9295]">/l/MyBUsiness</span></div>
                  </div>

                  <div className="p-4 bg-[#F6FAF9] rounded-2xl border border-black/5 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#105F68]">
                      <span>Apex Auto Lab (Detailing)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">Growth</span>
                    </div>
                    <div>Email: <span className="text-[#105F68]">apex@ovel.lk</span></div>
                    <div>Password: <span className="text-[#105F68]">MerchantPass@2026!</span></div>
                    <div>Storefront: <span className="text-[#3A9295]">/l/apex-studio</span></div>
                  </div>

                  <div className="p-4 bg-[#F6FAF9] rounded-2xl border border-black/5 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#105F68]">
                      <span>Velvet Crumb Bakes (Bakery)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">Starter</span>
                    </div>
                    <div>Email: <span className="text-[#105F68]">bakes@ovel.lk</span></div>
                    <div>Password: <span className="text-[#105F68]">MerchantPass@2026!</span></div>
                    <div>Storefront: <span className="text-[#3A9295]">/l/craft-bakes</span></div>
                  </div>

                  <div className="p-4 bg-[#F6FAF9] rounded-2xl border border-black/5 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#105F68]">
                      <span>Vance Production Loft (Studio)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#105F68]/10 text-[#105F68]">Scale</span>
                    </div>
                    <div>Email: <span className="text-[#105F68]">vance@ovel.lk</span></div>
                    <div>Password: <span className="text-[#105F68]">MerchantPass@2026!</span></div>
                    <div>Storefront: <span className="text-[#3A9295]">/l/vance-studio</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD NEW MERCHANT */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 border border-[#105F68]/20 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="text-xl font-light text-[#105F68]">Register New Merchant Tenant</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-[#3A9295] hover:text-[#105F68] text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-light">
              <div>
                <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumina Hair Studio"
                  value={formBusinessName}
                  onChange={(e) => setFormBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Miller"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@lumina.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Public Slug (ovel.lk/l/...)
                  </label>
                  <input
                    type="text"
                    placeholder="lumina-studio"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+94 (77) 123-4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Industry Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TenantUser["category"])}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="Aesthetic Clinic">Aesthetic Clinic</option>
                    <option value="Salon & Spa">Salon & Spa</option>
                    <option value="Mobile Detailing">Mobile Detailing</option>
                    <option value="Studio Rentals">Studio Rentals</option>
                    <option value="Artisanal Bakery">Artisanal Bakery</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Artisan Atelier">Artisan Atelier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Initial Plan Tier
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as SubscriptionPlanId)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="free">Starter (LKR 0 / mo)</option>
                    <option value="growth">Growth (LKR 500 / mo)</option>
                    <option value="scale">Scale (LKR 1,500 / mo)</option>
                    <option value="enterprise">Enterprise (LKR 4,500 / mo)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-black/10 text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-tight shadow-md"
                >
                  Create Merchant Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER PROFILE */}
      {isEditUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 border border-[#105F68]/20 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="text-xl font-light text-[#105F68]">Edit Tenant: {selectedUser.businessName}</h3>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-[#3A9295] hover:text-[#105F68] text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs font-light">
              <div>
                <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TenantUser["status"])}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending_setup">Pending Setup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#3A9295] uppercase font-mono text-[10px] mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as TenantUser["role"])}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="business_owner">Business Owner</option>
                    <option value="staff">Staff Specialist</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-black/10 text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-tight shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-rose-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-medium text-rose-950">Confirm Permanent Removal</h3>
            </div>

            <p className="text-xs text-[#3A9295] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#105F68]">{userToDelete.businessName}</strong> ({userToDelete.email})? This action cannot be undone.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-full border border-black/10 text-xs text-[#3A9295] hover:text-[#105F68]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-light shadow-md"
              >
                Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
