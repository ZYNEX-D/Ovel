"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ExternalLink,
  Check,
  RotateCcw,
  Clock,
  DollarSign,
  TrendingUp,
  Filter,
  Sparkles,
  ShieldAlert,
  CreditCard,
  User,
  Zap,
  Lock,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Search,
  Plus,
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import {
  getBookings,
  saveBookings,
  createBooking,
  INITIAL_BOOKINGS,
  INITIAL_CLIENT_PROFILES,
  chargeNoShowFee,
  getClientProfiles,
  staffIdFromName,
  ClientProfile,
} from "@/lib/platform-store";
import { addMinutes, dollarsToCents, localDateString } from "@/lib/booking-time";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink, PRESET_OVELINKS } from "@/lib/ovelink-store";
import { getMerchantSubscription, checkOrderQuotaStatus } from "@/lib/subscription-store";

function temporaryClientId(): string {
  return `cp_temp_${Date.now()}`;
}

export default function DashboardRosterPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId;
  const bookings = useClientStore(() => getBookings(wsId), () => INITIAL_BOOKINGS);
  const clientProfiles = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);

  const defaultSlug = profile?.organizationSlug || "leclat";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => PRESET_OVELINKS[defaultSlug] || PRESET_OVELINKS.leclat
  );
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;
  const symbol = getCurrencySymbol(currency);

  const merchantTarget = wsId || defaultSlug;
  const subscription = getMerchantSubscription(merchantTarget);
  const quota = checkOrderQuotaStatus(merchantTarget, bookings.length);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState<string>("all");

  // Modals & Panels
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedClientProfile, setSelectedClientProfile] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Booking Form State
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newServiceName, setNewServiceName] = useState("Hydrafacial Glow & Lymphatic Drainage");
  const [newPrice, setNewPrice] = useState(195);
  const [newDeposit, setNewDeposit] = useState(50);
  const [newStaff, setNewStaff] = useState("Dr. Genevieve Moreau");
  const [newStation, setNewStation] = useState("Room 2 (Laser Bay)");
  const [newTime, setNewTime] = useState("10:00");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Station lists (universal for any salon, studio, office, clinic, or consulting space)
  const availableStations = [
    "Station 1 (Main Suite)",
    "Station 2 (Studio / Bay)",
    "Room 1 (Private Suite)",
    "Room 2 (Meeting & Consult)",
  ];

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesStation =
        selectedStation === "all" ||
        (b.stationResource && b.stationResource.toLowerCase().includes(selectedStation.toLowerCase()));
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientPhone.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        b.staffName.toLowerCase().includes(q) ||
        (b.stationResource && b.stationResource.toLowerCase().includes(q));

      return matchesStatus && matchesStation && matchesQuery;
    });
  }, [bookings, statusFilter, selectedStation, searchQuery]);

  const handleChargeNoShow = (bookingId: string) => {
    playSuccess();
    const updated = chargeNoShowFee(bookingId, 2500, wsId);
    if (updated) {
      showToast(`${formatCurrency(2500, currency)} no-show fee charged to card •••• ${updated.cardLast4 || "4242"}.`);
    } else {
      showToast("No-show fee was not charged. A card must be on file, and the booking cannot already be closed.");
    }
  };

  const handleMarkCompleted = (bookingId: string) => {
    playSuccess();
    const all = getBookings(wsId);
    const updated = all.map((b) =>
      b.id === bookingId ? { ...b, status: "completed" as const } : b
    );
    saveBookings(updated, wsId);
    showToast("Booking marked completed! Triggered automatic review request.");
  };

  const handleOpenClientDossier = (clientName: string) => {
    playClick();
    const found = clientProfiles.find((cp) => cp.name.toLowerCase() === clientName.toLowerCase());
    if (found) {
      setSelectedClientProfile(found);
    } else {
      setSelectedClientProfile({
        id: temporaryClientId(),
        name: clientName,
        email: "client@example.com",
        phone: "+1 (415) 555-0199",
        totalVisits: 1,
        noShowCount: 0,
        reliabilityScore: 100,
        formulasOrNotes: "Standard client profile created from booking roster.",
      });
    }
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newServiceName) return;

    if (!/^\d{2}:\d{2}$/.test(newTime)) return;
    const priceCents = dollarsToCents(newPrice);
    const depositCents = dollarsToCents(newDeposit);
    if (priceCents == null || depositCents == null || depositCents > priceCents) {
      showToast("Enter a valid price and a deposit that does not exceed it.");
      return;
    }
    const startTime = `${localDateString(new Date())}T${newTime}:00`;
    const endTime = addMinutes(startTime, 45);
    if (!endTime) return;

    const created = createBooking({
      serviceId: "srv_custom",
      serviceName: newServiceName,
      staffId: staffIdFromName(newStaff),
      staffName: newStaff,
      clientName: newClientName,
      clientEmail: newClientEmail || "client@lumina.co",
      clientPhone: newClientPhone || "+1 (415) 773-9011",
      startTime,
      endTime,
      status: "confirmed",
      totalPriceCents: priceCents,
      depositPaidCents: depositCents,
      stationResource: newStation,
      hasCardOnFile: true,
      cardLast4: "4242",
    }, wsId);
    if (!created) {
      showToast("That specialist is already booked at this time.");
      return;
    }
    playSuccess();
    setIsAddBookingOpen(false);
    showToast(`Appointment reserved for ${newClientName} at ${newStation}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#105F68] text-white text-xs shadow-xl flex items-center gap-2 border border-white/20 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Roster Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
              Appointment &amp; Order Roster
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-semibold uppercase tracking-wider">
              Live Matrix
            </span>
          </div>
          <p className="text-xs text-[#3A9295] mt-1">
            Includes equipment &amp; station allocation, card-on-file status, and 1-click no-show enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playClick();
              setIsAddBookingOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shadow-md shadow-[#105F68]/20"
          >
            <Plus className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>New Appointment / Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by client name, service, specialist, phone, or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-all"
            />
          </div>

          {/* Station Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#3A9295] whitespace-nowrap">Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
            >
              <option value="all">All Stations &amp; Rooms</option>
              <option value="Station 1">Station 1 (Main Suite)</option>
              <option value="Station 2">Station 2 (Studio / Bay)</option>
              <option value="Room 1">Room 1 (Private Suite)</option>
              <option value="Room 2">Room 2 (Meeting &amp; Consult)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {[
            { id: "all", label: "All Bookings" },
            { id: "confirmed", label: "Confirmed" },
            { id: "rescheduled", label: "Rescheduled" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClick();
                  setStatusFilter(tab.id);
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

      {/* Main Roster Table Panel */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-5 sm:p-7 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 text-[#3A9295] uppercase tracking-wider font-semibold">
                <th className="pb-3">Time &amp; Station</th>
                <th className="pb-3">Client / CRM Dossier</th>
                <th className="pb-3">Service / Order</th>
                <th className="pb-3">Specialist</th>
                <th className="pb-3">Card on File</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-[#3A9295] select-none">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <video
                        src="/animations/noresult.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain pointer-events-none mb-1"
                      />
                      <p className="font-semibold text-sm text-[#105F68]">No appointments scheduled</p>
                      <p className="text-[11px] text-[#3A9295]">
                        Appointments booked via your branded booking page will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, index) => {
                  const isBlurred = quota.isExceeded && subscription.tier === "free" && index >= 100;
                  return (
                    <tr key={b.id} className="hover:bg-[#F6FAF9]/60 transition-colors">
                      {/* Time & Station */}
                      <td className="py-4 font-mono text-[#105F68] whitespace-nowrap">
                        <div className="font-semibold">
                          {b.timeDisplay || (
                            <>
                              {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" - "}
                              {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </>
                          )}
                        </div>
                        {b.stationResource ? (
                          <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-sans font-medium">
                            {b.stationResource}
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 font-sans">
                            Unassigned Station
                          </span>
                        )}
                      </td>

                      {/* Client / CRM Dossier */}
                      <td className="py-4">
                        {isBlurred ? (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 blur-xs select-none block">
                              Confidential Client
                            </span>
                            <Link
                              href="/dashboard/settings?tab=plans"
                              className="inline-block text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                            >
                              Upgrade to View
                            </Link>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenClientDossier(b.clientName)}
                              className="font-semibold text-[#105F68] hover:underline flex items-center gap-1.5"
                            >
                              <span>{b.clientName}</span>
                              <User className="w-3 h-3 text-[#3A9295]" />
                            </button>
                            <span className="text-[11px] text-[#3A9295] block font-mono mt-0.5">
                              {b.clientPhone}
                            </span>
                          </>
                        )}
                      </td>

                    {/* Service / Order */}
                    <td className="py-4">
                      <span className="text-[#105F68] font-semibold block leading-tight">
                        {b.serviceName}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {formatCurrency(b.totalPriceCents, currency)}{" "}
                        <span className="text-slate-400">
                          (Dep: {formatCurrency(b.depositPaidCents, currency)})
                        </span>
                      </span>
                    </td>

                    {/* Specialist */}
                    <td className="py-4 text-[#3A9295] font-medium whitespace-nowrap">
                      {b.staffName}
                    </td>

                    {/* Card on File */}
                    <td className="py-4">
                      {b.hasCardOnFile ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                          <CreditCard className="w-3 h-3 text-emerald-600" />
                          <span>•••• {b.cardLast4 || "----"}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">None</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          b.status === "confirmed"
                            ? "bg-[#63C1BB]/20 text-[#105F68]"
                            : b.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                      {b.isNoShow && (
                        <span className="block mt-1 text-[10px] text-rose-600 font-bold">
                          ⚠️ No-Show Penalty Billed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {b.status !== "completed" && (
                          <button
                            onClick={() => handleMarkCompleted(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-all border border-emerald-200/60"
                          >
                            ✓ Complete
                          </button>
                        )}

                        {!b.isNoShow && b.status !== "completed" && (
                          <button
                            onClick={() => handleChargeNoShow(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-all border border-rose-200/60 flex items-center gap-1"
                            title={`1-Click ${formatCurrency(2500, currency)} No-Show Enforcement Charge`}
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>No-Show Fee</span>
                          </button>
                        )}

                        <Link
                          href={`/portal/${b.rescheduleToken}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-[#105F68]/10 hover:bg-[#105F68]/20 text-[#105F68] text-[11px] font-semibold transition-all flex items-center gap-1 border border-[#105F68]/20"
                          title="Open Client Portal"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Client CRM Dossier View */}
      {selectedClientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-black/10">
            <div className="flex items-start justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#105F68] text-white flex items-center justify-center text-base font-bold shadow-sm">
                  {selectedClientProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#105F68]">{selectedClientProfile.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedClientProfile.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientProfile(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] text-[#3A9295] block uppercase font-medium">Reliability</span>
                <span className="text-base font-bold text-emerald-700">
                  {selectedClientProfile.reliabilityScore}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] text-[#3A9295] block uppercase font-medium">Completed Visits</span>
                <span className="text-base font-bold text-[#105F68]">
                  {selectedClientProfile.totalVisits}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>
                  {selectedClientProfile.cardOnFile
                    ? `${selectedClientProfile.cardOnFile.brand} •••• ${selectedClientProfile.cardOnFile.last4}`
                    : "No card on file"}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 uppercase">Tokenized</span>
            </div>

            {selectedClientProfile.formulasOrNotes && (
              <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs text-slate-700 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3A9295] block">
                  Service History &amp; Client Notes
                </span>
                <p className="leading-relaxed font-mono text-[11px]">
                  {selectedClientProfile.formulasOrNotes}
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <a
                href={`https://wa.me/${selectedClientProfile.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={() => setSelectedClientProfile(null)}
                className="px-5 py-2.5 rounded-full border border-black/15 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Appointment / Order Booking */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <h3 className="text-lg font-bold text-[#105F68]">New Appointment or Order</h3>
                <p className="text-xs text-[#3A9295]">
                  Schedule directly onto the roster with station allocation.
                </p>
              </div>
              <button
                onClick={() => setIsAddBookingOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Mitchell"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Client Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (415) 000-0000"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service / Order</label>
                <input
                  type="text"
                  required
                  placeholder="Service Name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Price ({symbol})</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deposit Paid ({symbol})</label>
                  <input
                    type="number"
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Specialist</label>
                  <select
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs bg-white"
                  >
                    <option value="Dr. Genevieve Moreau">Dr. Genevieve Moreau</option>
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="Julian Vance">Julian Vance</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Station / Bay</label>
                  <select
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs bg-white"
                  >
                    <option value="Station 1 (Main Suite)">Station 1 (Main Suite)</option>
                    <option value="Station 2 (Studio / Bay)">Station 2 (Studio / Bay)</option>
                    <option value="Room 1 (Private Suite)">Room 1 (Private Suite)</option>
                    <option value="Room 2 (Meeting &amp; Consult)">Room 2 (Meeting &amp; Consult)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scheduled Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-black/15 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 rounded-full border border-black/15 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-md shadow-[#105F68]/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Reserve Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
