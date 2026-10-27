"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  FileText,
  Star,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Filter,
  DollarSign
} from "lucide-react";
import {
  getClientProfiles,
  saveClientProfiles,
  INITIAL_CLIENT_PROFILES,
  ClientProfile,
  getBookings,
  INITIAL_BOOKINGS,
} from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import Toast from "@/components/arc/toast/toast";

export default function DashboardUsersPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const wsId = profile?.organizationId;
  const clients = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);
  const bookings = useClientStore(() => getBookings(wsId), () => INITIAL_BOOKINGS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "vip" | "card_on_file" | "high_reliability">("all");
  const [sortBy, setSortBy] = useState<"visits" | "reliability" | "name">("visits");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlan, setFormPlan] = useState("Studio Member");
  const [formNotes, setFormNotes] = useState("");
  const [formCardBrand, setFormCardBrand] = useState("Visa");
  const [formCardLast4, setFormCardLast4] = useState("");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = clients.length;
    const cardsSecured = clients.filter((c) => c.cardOnFile && c.cardOnFile.last4).length;
    const avgReliability = total > 0
      ? Math.round(clients.reduce((acc, c) => acc + (c.reliabilityScore || 100), 0) / total)
      : 100;
    const vips = clients.filter((c) => c.membershipPlan && c.membershipPlan.toLowerCase().includes("vip")).length;
    return { total, cardsSecured, avgReliability, vips };
  }, [clients]);

  // Filtered & Sorted Clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.formulasOrNotes && c.formulasOrNotes.toLowerCase().includes(q));

        if (!matchesQuery) return false;

        if (activeFilter === "vip") {
          return c.membershipPlan && c.membershipPlan.toLowerCase().includes("vip");
        }
        if (activeFilter === "card_on_file") {
          return Boolean(c.cardOnFile && c.cardOnFile.last4);
        }
        if (activeFilter === "high_reliability") {
          return (c.reliabilityScore || 100) >= 95;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "visits") return b.totalVisits - a.totalVisits;
        if (sortBy === "reliability") return (b.reliabilityScore || 100) - (a.reliabilityScore || 100);
        return a.name.localeCompare(b.name);
      });
  }, [clients, searchQuery, activeFilter, sortBy]);

  // Create Client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    playSuccess();

    if (editingClient) {
      // Update existing
      const updated = clients.map((c) => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            name: formName,
            email: formEmail,
            phone: formPhone,
            membershipPlan: formPlan,
            formulasOrNotes: formNotes,
            cardOnFile: formCardLast4 ? { brand: formCardBrand, last4: formCardLast4 } : c.cardOnFile,
          };
        }
        return c;
      });
      saveClientProfiles(updated, wsId);
      showToast(`Updated user profile for ${formName}`);
      setEditingClient(null);
    } else {
      // Create new
      const newClient: ClientProfile = {
        id: `usr_${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone || "+1 (555) 000-0000",
        totalVisits: 0,
        noShowCount: 0,
        reliabilityScore: 100,
        membershipPlan: formPlan,
        formulasOrNotes: formNotes,
        cardOnFile: formCardLast4 ? { brand: formCardBrand, last4: formCardLast4 } : undefined,
      };

      const updated = [newClient, ...clients];
      saveClientProfiles(updated, wsId);
      showToast(`Registered new client ${newClient.name}`);
      setIsAddModalOpen(false);
    }

    // Reset fields
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPlan("Studio Member");
    setFormNotes("");
    setFormCardLast4("");
  };

  const handleOpenEdit = (c: ClientProfile) => {
    playClick();
    setEditingClient(c);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormPlan(c.membershipPlan || "Studio Member");
    setFormNotes(c.formulasOrNotes || "");
    setFormCardBrand(c.cardOnFile?.brand || "Visa");
    setFormCardLast4(c.cardOnFile?.last4 || "");
  };

  const handleDeleteClient = (id: string, name: string) => {
    playClick();
    if (confirm(`Remove client ${name} from your CRM directory?`)) {
      const updated = clients.filter((c) => c.id !== id);
      saveClientProfiles(updated, wsId);
      if (selectedDossier?.id === id) setSelectedDossier(null);
      showToast(`Removed ${name} from clients`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    playClick();
    const headers = "Name,Email,Phone,Visits,ReliabilityScore,Membership,CardOnFile,Notes\n";
    const rows = clients
      .map(
        (c) =>
          `"${c.name}","${c.email}","${c.phone}",${c.totalVisits},${c.reliabilityScore}%,"${c.membershipPlan || "None"}","${c.cardOnFile ? `${c.cardOnFile.brand} •••• ${c.cardOnFile.last4}` : "None"}","${(c.formulasOrNotes || "").replace(/"/g, '""')}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ovel_clients_crm_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Exported clients CRM to CSV");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50">
        <Toast
          open={Boolean(notification)}
          onOpenChange={(open) => { if (!open) setNotification(null); }}
          title={notification || ""}
          duration={3500}
        />
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
              Users &amp; Client Relationship CRM
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-semibold uppercase tracking-wider">
              Directory
            </span>
          </div>
          <p className="text-xs text-[#3A9295] mt-1">
            Client dossiers, contact records, visit logs, anti-no-show reliability scores, and card-on-file vault.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/10 bg-white hover:bg-slate-50 text-xs text-[#105F68] font-medium transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#3A9295]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setEditingClient(null);
              setFormName("");
              setFormEmail("");
              setFormPhone("");
              setFormPlan("Studio Member");
              setFormNotes("");
              setFormCardLast4("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shadow-md shadow-[#105F68]/20"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Add User / Client</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Total Clients</span>
            <Users className="w-4 h-4 text-[#105F68]" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            {stats.total}
          </div>
          <p className="text-[11px] text-[#3A9295]/80">Active bookers &amp; accounts</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Reliability Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-emerald-700 tracking-tight flex items-baseline gap-1">
            <span>{stats.avgReliability}%</span>
            <span className="text-[10px] text-emerald-600 font-medium">Anti-No-Show</span>
          </div>
          <p className="text-[11px] text-[#3A9295]/80">Average appointment attendance</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>Cards on File</span>
            <CreditCard className="w-4 h-4 text-[#105F68]" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            {stats.cardsSecured}
          </div>
          <p className="text-[11px] text-[#3A9295]/80">Stripe 1-click tokenized vault</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-[#3A9295]">
            <span>VIP &amp; Members</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            {stats.vips}
          </div>
          <p className="text-[11px] text-[#3A9295]/80">Tier &amp; recurring club members</p>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by client name, email, phone, or formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-all"
            />
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-[#3A9295] whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "visits" | "reliability" | "name")}
              className="px-3 py-2 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
            >
              <option value="visits">Most Visits</option>
              <option value="reliability">Reliability Score</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Segment Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: "all", label: `All Users (${clients.length})` },
            { id: "vip", label: `VIP Members (${stats.vips})` },
            { id: "card_on_file", label: `Card on File (${stats.cardsSecured})` },
            { id: "high_reliability", label: "High Reliability (≥95%)" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClick();
                  setActiveFilter(tab.id as typeof activeFilter);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#105F68] text-white shadow-sm font-medium"
                    : "bg-[#F6FAF9] hover:bg-slate-100 text-slate-600 border border-black/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Client Records List / Cards */}
      {filteredClients.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3 select-none">
          <img
            src="/animations/emptyfiles.svg"
            alt="No results"
            className="w-32 h-32 mx-auto object-contain pointer-events-none mb-1"
          />
          <h3 className="text-base font-medium text-[#105F68]">No matching users found</h3>
          <p className="text-xs text-[#3A9295] max-w-sm mx-auto">
            Try adjusting your search query or segment filter, or add a new client directly to your CRM.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                playClick();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-medium shadow-sm hover:bg-[#0D4F57] transition-all"
            >
              + Add Client
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const isReliable = (client.reliabilityScore || 100) >= 95;
            const hasCard = Boolean(client.cardOnFile && client.cardOnFile.last4);

            return (
              <div
                key={client.id}
                className="p-5 rounded-3xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-all space-y-4 relative group"
              >
                {/* Client Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#105F68] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-[#105F68] leading-tight">
                          {client.name}
                        </h3>
                        {client.membershipPlan && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#63C1BB]/20 text-[#105F68]">
                            {client.membershipPlan}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{client.email}</p>
                    </div>
                  </div>

                  {/* Anti-No-Show Reliability Badge */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isReliable
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                      title="Anti-no-show historical reliability rating"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{client.reliabilityScore}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {client.totalVisits} {client.totalVisits === 1 ? "visit" : "visits"}
                    </span>
                  </div>
                </div>

                {/* Contact & Card on File Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {client.phone && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F6FAF9] text-[11px] text-slate-600 border border-black/5">
                      <Phone className="w-3 h-3 text-[#105F68]" />
                      <span>{client.phone}</span>
                    </span>
                  )}

                  {hasCard ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] text-emerald-800 border border-emerald-200 font-medium">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>
                        {client.cardOnFile?.brand} •••• {client.cardOnFile?.last4}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-400 border border-black/5">
                      <CreditCard className="w-3 h-3" />
                      <span>No card on file</span>
                    </span>
                  )}
                </div>

                {/* Service History / Client Notes Preview */}
                {client.formulasOrNotes && (
                  <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs text-slate-600 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3A9295] block">
                      Service History &amp; Client Notes
                    </span>
                    <p className="line-clamp-2 leading-relaxed text-[11px] text-slate-700">
                      {client.formulasOrNotes}
                    </p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Direct Chat */}
                    {client.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hi ${client.name}! This is your team reaching out regarding your account and bookings.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Direct WhatsApp Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Email link */}
                    <a
                      href={`mailto:${client.email}`}
                      className="p-2 rounded-xl bg-[#F6FAF9] text-[#105F68] hover:bg-slate-100 transition-colors"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-2 rounded-xl bg-[#F6FAF9] text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="p-2 rounded-xl bg-[#F6FAF9] text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      playClick();
                      setSelectedDossier(client);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shadow-sm"
                  >
                    <span>Full Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#63C1BB]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Full Client Dossier Drawer */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto border border-black/10">
            {/* Dossier Header */}
            <div className="flex items-start justify-between pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#105F68] text-white flex items-center justify-center text-lg font-bold shadow-md">
                  {selectedDossier.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#105F68]">{selectedDossier.name}</h3>
                    {selectedDossier.membershipPlan && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#63C1BB]/20 text-[#105F68]">
                        {selectedDossier.membershipPlan}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedDossier.email}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedDossier.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDossier(null)}
                className="p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reliability & Security Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] text-[#3A9295] block uppercase font-medium">Reliability</span>
                <span className="text-base font-bold text-emerald-700">
                  {selectedDossier.reliabilityScore}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] text-[#3A9295] block uppercase font-medium">Completed Visits</span>
                <span className="text-base font-bold text-[#105F68]">
                  {selectedDossier.totalVisits}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] text-[#3A9295] block uppercase font-medium">No-Shows</span>
                <span className="text-base font-bold text-slate-700">
                  {selectedDossier.noShowCount}
                </span>
              </div>
            </div>

            {/* Card on file status */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold text-emerald-900 block">Stripe Card on File</span>
                  <span className="text-[11px] text-emerald-700">
                    {selectedDossier.cardOnFile
                      ? `${selectedDossier.cardOnFile.brand} ending in ${selectedDossier.cardOnFile.last4} (Tokenized)`
                      : "No payment method vault attached."}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                0% Take-Rate
              </span>
            </div>

            {/* Technical Formulas & Service History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3A9295]">
                  Technical Specs &amp; Service History
                </h4>
              </div>
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedDossier.formulasOrNotes || "No service specs or notes logged for this client yet."}
              </div>
            </div>

            {/* Past Bookings Logs from Schedule Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3A9295]">
                Associated Appointments &amp; Logs
              </h4>
              {bookings.filter(
                (b) =>
                  b.clientEmail.toLowerCase() === selectedDossier.email.toLowerCase() ||
                  b.clientName.toLowerCase() === selectedDossier.name.toLowerCase()
              ).length === 0 ? (
                <div className="py-6 px-4 text-center space-y-2 rounded-2xl bg-slate-50 border border-black/5">
                  <video
                    src="/animations/noresult.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-20 h-20 mx-auto object-contain pointer-events-none"
                  />
                  <p className="text-xs font-semibold text-[#105F68]">No appointments scheduled yet</p>
                  <p className="text-[11px] text-[#3A9295]">
                    Appointments booked via your branded booking page will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {bookings
                    .filter(
                      (b) =>
                        b.clientEmail.toLowerCase() === selectedDossier.email.toLowerCase() ||
                        b.clientName.toLowerCase() === selectedDossier.name.toLowerCase()
                    )
                    .map((bk) => (
                      <div
                        key={bk.id}
                        className="p-2.5 rounded-xl bg-[#F6FAF9] border border-black/5 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-[#105F68] block">{bk.serviceName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(bk.startTime).toLocaleDateString()} @ {new Date(bk.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {bk.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-black/10 flex items-center justify-between gap-2">
              <a
                href={`https://wa.me/${selectedDossier.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message on WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setSelectedDossier(null);
                  handleOpenEdit(selectedDossier);
                }}
                className="px-5 py-2.5 rounded-full border border-black/15 text-xs font-medium text-[#105F68] hover:bg-[#F6FAF9] transition-all"
              >
                Edit Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Client Modal */}
      {(isAddModalOpen || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-lg font-bold text-[#105F68]">
                  {editingClient ? "Edit Client Dossier" : "Register New Client"}
                </h3>
                <p className="text-xs text-[#3A9295]">
                  {editingClient
                    ? `Updating details for ${editingClient.name}`
                    : "Add a client to your private CRM and client directory."}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingClient(null);
                }}
                className="p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Mitchell"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (415) 000-0000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Membership Plan</label>
                <select
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68] bg-white"
                >
                  <option value="Studio Member">Studio Member</option>
                  <option value="VIP Premier">VIP Premier (Priority Booking)</option>
                  <option value="Gold Studio">Gold Studio</option>
                  <option value="Regular">Regular</option>
                </select>
              </div>

              {/* Card on file optional info */}
              <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
                <span className="text-[11px] font-semibold text-[#105F68] block">
                  Card on File (Vault Status)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Card Brand</label>
                    <select
                      value={formCardBrand}
                      onChange={(e) => setFormCardBrand(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs bg-white"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Amex">Amex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4242"
                      value={formCardLast4}
                      onChange={(e) => setFormCardLast4(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/15 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Service Specs & Client History */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Service Notes / Client Preferences
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Preferences, service requirements, special instructions, order notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2.5 rounded-full border border-black/15 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-md shadow-[#105F68]/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingClient ? "Save Changes" : "Register Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
