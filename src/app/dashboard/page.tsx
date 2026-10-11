"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Check, 
  RotateCcw, 
  Clock, 
  DollarSign, 
  TrendingUp, 
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
  Palette,
  ArrowRight,
  Activity,
  Layers,
  Star,
  ChevronRight,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { 
  getBookings, 
  saveBookings,
  BookingRecord,
  getWaitlist,
  dispatchWaitlistBlast,
  claimWaitlistSlot,
  chargeNoShowFee,
  getClientProfiles,
  ClientProfile,
  WaitlistEntry
} from "@/lib/platform-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";

export default function DashboardOverviewPage() {
  const { profile } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [roundRobinActive, setRoundRobinActive] = useState(true);

  // Modals & Panels
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isSingleUseModalOpen, setIsSingleUseModalOpen] = useState(false);
  const [singleUseLink, setSingleUseLink] = useState("");
  const [copiedVip, setCopiedVip] = useState(false);
  const [selectedClientProfile, setSelectedClientProfile] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setBookings(getBookings());
    setWaitlist(getWaitlist());
    setClientProfiles(getClientProfiles());
    setMounted(true);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPriceCents, 0);
  const depositsCollected = bookings.reduce((sum, b) => sum + b.depositPaidCents, 0);
  const feesSaved = Math.round((totalRevenue / 100) * 0.2);
  const avgOrderValue = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0;
  const activeBookingsCount = bookings.filter(b => b.status === "confirmed").length;

  const handleChargeNoShow = (bookingId: string) => {
    playSuccess();
    const updated = chargeNoShowFee(bookingId, 2500);
    if (updated) {
      setBookings(getBookings());
      showToast(`$25.00 No-Show Penalty charged to card •••• ${updated.cardLast4 || "4242"} on file!`);
    }
  };

  const handleMarkCompleted = (bookingId: string) => {
    playSuccess();
    const all = getBookings();
    const updated = all.map(b => b.id === bookingId ? { ...b, status: "completed" as const } : b);
    saveBookings(updated);
    setBookings(updated);
    showToast("Booking marked completed! Triggered automatic 2h review request & 4-week rebooking schedule.");
  };

  const handleDispatchWaitlist = () => {
    playSuccess();
    const updated = dispatchWaitlistBlast("2:00 PM Today", "Hydrafacial Glow & Lymphatic Drainage");
    setWaitlist(updated);
    showToast("WhatsApp broadcast dispatched to waitlist: 'A 2:00 PM slot just opened today! Tap to claim.'");
  };

  const handleClaimWaitlist = (entryId: string) => {
    playSuccess();
    const newBooking = claimWaitlistSlot(entryId, "Dr. Genevieve Moreau");
    if (newBooking) {
      setBookings(getBookings());
      setWaitlist(getWaitlist());
      setIsWaitlistModalOpen(false);
      showToast(`Slot claimed by ${newBooking.clientName}! Revenue recovered.`);
    }
  };

  const handleGenerateVipLink = () => {
    playClick();
    const token = "vip_" + Math.random().toString(36).substring(2, 10);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ovel.app";
    const slug = profile?.organizationSlug || "leclat";
    const link = `${origin}/l/${slug}?vip_single_use=${token}`;
    setSingleUseLink(link);
    setIsSingleUseModalOpen(true);
  };

  const handleOpenClientDossier = (clientName: string) => {
    playClick();
    const found = clientProfiles.find(p => p.name.toLowerCase() === clientName.toLowerCase()) || {
      id: "cp_custom",
      name: clientName,
      email: "client@example.com",
      phone: "+1 (415) 555-0199",
      totalVisits: 1,
      noShowCount: 0,
      reliabilityScore: 100,
      formulasOrNotes: "Standard clinical roadmap. Card saved on file via Stripe SetupIntent.",
      cardOnFile: { brand: "Visa", last4: "4242" },
    };
    setSelectedClientProfile(found);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#105F68] text-white text-xs shadow-xl flex items-center gap-2 border border-[#63C1BB]/30 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Executive Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-black/5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
              Executive Command Hub
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-[#3A9295]">
              {profile?.organizationName || "Lumina Atelier & Clinic"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight mt-1">
            Operations &amp; Revenue Overview
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Real-time commercial loop • Station allocations • 0% marketplace commission engine.
          </p>
        </div>

        {/* Quick Command Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Link to Dedicated Roster */}
          <Link
            href="/dashboard/roster"
            onClick={() => playClick()}
            className="px-4 py-2 rounded-2xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-md shadow-[#105F68]/20"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Open Full Roster</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 text-white/70" />
          </Link>

          {/* Single-Use VIP Link */}
          <button
            onClick={handleGenerateVipLink}
            className="px-3.5 py-2 rounded-2xl border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-xs text-[#105F68] font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>VIP Pass</span>
          </button>

          {/* Smart Waitlist Engine */}
          <button
            onClick={() => {
              playClick();
              setIsWaitlistModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl border border-amber-300/50 bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Waitlist ({mounted ? waitlist.filter(w => w.status === "waiting").length : 0})</span>
          </button>

          {/* Round-Robin Toggle */}
          <button
            onClick={() => {
              playClick();
              setRoundRobinActive(!roundRobinActive);
              showToast(roundRobinActive ? "Round-Robin disabled (Manual priority)" : "Round-Robin enabled (Equal staff allocation)");
            }}
            className={`px-3 py-2 rounded-2xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
              roundRobinActive
                ? "bg-[#C8E6E2]/40 text-[#105F68] border-[#9ED5D1]"
                : "bg-white text-[#3A9295] border-black/10"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Round-Robin:</span> {roundRobinActive ? "Active" : "Off"}
          </button>
        </div>
      </div>

      {/* Executive Financial & Performance Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Metric 1: Booked Volume */}
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">Booked Volume</span>
            <DollarSign className="w-4 h-4 text-[#105F68]/50" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-light text-[#105F68]">
              ${mounted ? (totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </h3>
            <p className="text-[11px] text-[#3A9295] mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">100%</span> direct to Stripe
            </p>
          </div>
        </div>

        {/* Metric 2: Deposits Secured */}
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">Deposits Secured</span>
            <CreditCard className="w-4 h-4 text-[#63C1BB]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-light text-[#105F68]">
              ${mounted ? (depositsCollected / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </h3>
            <p className="text-[11px] text-[#63C1BB] font-medium mt-1">
              Upfront card verification
            </p>
          </div>
        </div>

        {/* Metric 3: Fees Saved */}
        <div className="p-5 rounded-3xl bg-[#105F68] text-white border border-[#105F68] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#C8E6E2] font-medium">Fees Retained</span>
            <Sparkles className="w-4 h-4 text-[#63C1BB]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-light text-white">
              ${mounted ? feesSaved.toLocaleString() : "0"}
            </h3>
            <p className="text-[11px] text-[#C8E6E2] mt-1">
              Saved vs 20% marketplace cut
            </p>
          </div>
        </div>

        {/* Metric 4: Average Order Value */}
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">Average Ticket</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-light text-[#105F68]">
              ${mounted ? (avgOrderValue / 100).toFixed(2) : "0.00"}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              High-value protocol mix
            </p>
          </div>
        </div>

        {/* Metric 5: Client Reliability */}
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-medium">Reliability Shield</span>
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-light text-[#105F68]">98.5%</h3>
            <p className="text-[11px] text-[#2E7D32] mt-1">
              $25 No-Show late protection
            </p>
          </div>
        </div>
      </div>

      {/* Main Section: Today's Live Schedule Agenda & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Active Schedule Agenda */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-light text-[#105F68] tracking-tight">
                    Today&apos;s Live Schedule &amp; Station Agenda
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-bold">
                    {mounted ? activeBookingsCount : 0} Active
                  </span>
                </div>
                <p className="text-xs text-[#3A9295] mt-0.5">
                  High-touch client timeline with 1-click completion and no-show enforcement.
                </p>
              </div>

              <Link
                href="/dashboard/roster"
                onClick={() => playClick()}
                className="text-xs text-[#105F68] hover:text-[#0D4F57] font-semibold flex items-center gap-1 group"
              >
                <span>Full Roster View</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Schedule Cards Timeline */}
            <div className="space-y-3">
              {!mounted ? (
                <div className="py-12 text-center text-xs text-[#3A9295]">
                  <div className="w-6 h-6 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin mx-auto" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#3A9295] space-y-2">
                  <CalendarIcon className="w-8 h-8 text-[#105F68]/30 mx-auto" />
                  <p className="font-semibold text-[#105F68]">No appointments scheduled for today</p>
                  <p>Bookings created through your Ovelink booking page will appear here live.</p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#F6FAF9]/80 border border-black/5 hover:border-[#105F68]/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Time & Station */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#105F68]/10 text-[#105F68] flex flex-col items-center justify-center shrink-0 border border-[#105F68]/15 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
                        <span className="text-[10px] font-bold">
                          {b.timeDisplay ? b.timeDisplay.split(" ")[0] : "10:00"}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenClientDossier(b.clientName)}
                            className="text-sm font-semibold text-[#105F68] hover:underline flex items-center gap-1"
                          >
                            <span>{b.clientName}</span>
                            <User className="w-3 h-3 text-[#3A9295]" />
                          </button>

                          <span className="text-[10px] font-mono text-[#3A9295]">
                            {b.clientPhone}
                          </span>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            b.status === "confirmed"
                              ? "bg-[#63C1BB]/20 text-[#105F68]"
                              : b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#105F68] font-medium mt-0.5">
                          {b.serviceName}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#3A9295]">
                          <span>Specialist: <b>{b.staffName}</b></span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-black/5 font-medium text-slate-700">
                            {b.stationResource || "Room 1 (Aesthetic Suite)"}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">
                            ${(b.totalPriceCents / 100).toFixed(2)}
                            <span className="text-slate-400 font-normal"> (Dep: ${(b.depositPaidCents / 100).toFixed(2)})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {b.status !== "completed" && (
                        <button
                          onClick={() => handleMarkCompleted(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all border border-emerald-200/60"
                        >
                          ✓ Complete
                        </button>
                      )}

                      {!b.isNoShow && b.status !== "completed" && (
                        <button
                          onClick={() => handleChargeNoShow(b.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all border border-rose-200/60 flex items-center gap-1"
                          title="1-Click $25 No-Show Enforcement Charge"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>No-Show</span>
                        </button>
                      )}

                      <Link
                        href={`/portal/${b.rescheduleToken}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-xl bg-[#105F68]/10 hover:bg-[#105F68]/20 text-[#105F68] text-xs font-semibold transition-all flex items-center gap-1 border border-[#105F68]/20"
                        title="Open Client Portal"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Banner directing to Dedicated Roster */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#105F68]/5 to-[#63C1BB]/10 border border-[#105F68]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#105F68] text-white flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-[#63C1BB]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#105F68]">
                    Looking for Station Filter &amp; Roster Management?
                  </h4>
                  <p className="text-[11px] text-[#3A9295]">
                    Access equipment bays, status filtering, CRM dossier histories, and manual scheduling.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/roster"
                onClick={() => playClick()}
                className="px-4 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shrink-0 shadow-sm"
              >
                Go to Dedicated Roster →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Facility Stations & Operational Radar */}
        <div className="space-y-5">
          {/* Station & Bay Utilization */}
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#105F68]" />
                <h3 className="text-sm font-semibold text-[#105F68]">
                  Station &amp; Equipment Bays
                </h3>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Live Status
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Room 2 */}
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#105F68]">
                    <span>Room 2 (Laser Bay)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">In Use</span>
                  </div>
                  <p className="text-[10px] text-[#3A9295] mt-0.5">
                    Elena Rostova • Bridal Aesthetics
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#105F68]">10:00 - 11:30</span>
              </div>

              {/* Room 1 */}
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#105F68]">
                    <span>Room 1 (Aesthetic Suite)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">In Use</span>
                  </div>
                  <p className="text-[10px] text-[#3A9295] mt-0.5">
                    Tharusha Damsara • Complexion Consult
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#105F68]">12:00 - 12:45</span>
              </div>

              {/* Room 3 */}
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between opacity-80">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#105F68]">
                    <span>Room 3 (Barrier Clinical)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Ready</span>
                  </div>
                  <p className="text-[10px] text-[#3A9295] mt-0.5">
                    Sanitized &amp; available for waitlist fill
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">Open</span>
              </div>

              {/* Chair 1 */}
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between opacity-80">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#105F68]">
                    <span>Chair 1 (Express Lounge)</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Ready</span>
                  </div>
                  <p className="text-[10px] text-[#3A9295] mt-0.5">
                    Available for express protocols
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">Open</span>
              </div>
            </div>
          </div>

          {/* Specialist Utilization */}
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#105F68]" />
                <h3 className="text-sm font-semibold text-[#105F68]">
                  Specialist Roster
                </h3>
              </div>
              <Link
                href="/dashboard/staff"
                className="text-[11px] text-[#105F68] font-semibold hover:underline"
              >
                Manage Staff
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#105F68] text-white font-bold text-xs flex items-center justify-center">
                    GM
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#105F68]">Dr. Genevieve Moreau</h4>
                    <p className="text-[10px] text-[#3A9295]">2 sessions booked today</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">$1,205.00</span>
                  <p className="text-[10px] text-[#3A9295]">100% on-time</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                    CL
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#105F68]">Camille Laurent</h4>
                    <p className="text-[10px] text-[#3A9295]">Shift begins 2:00 PM</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#3A9295]">Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Commercial Loop Radar */}
          <div className="p-5 rounded-3xl bg-[#105F68] text-white shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#63C1BB]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C8E6E2]">
                Instant-Fill Waitlist Radar
              </h3>
            </div>
            <p className="text-xs text-[#E0F2F1] leading-relaxed">
              1 guest ({mounted && waitlist[0] ? waitlist[0].clientName : "Sophia Al-Mansoor"}) is waiting for a slot today. When an opening occurs, click below to ping them via WhatsApp.
            </p>
            <button
              onClick={() => {
                playClick();
                setIsWaitlistModalOpen(true);
              }}
              className="w-full py-2 rounded-xl bg-white text-[#105F68] text-xs font-semibold hover:bg-[#F6FAF9] transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Broadcast to Waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Instant-Fill Waitlist */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#105F68] text-white flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#63C1BB]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#105F68]">
                    Smart Instant-Fill Waitlist Engine
                  </h3>
                  <p className="text-[11px] text-[#3A9295]">
                    Automatic revenue recovery when high-demand slots cancel.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWaitlistModalOpen(false)}
                className="text-xs text-[#3A9295] hover:text-[#105F68]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#103438] leading-relaxed">
              When an opening occurs, Ovel instantly pings your top waitlisted clients on WhatsApp. The first to tap locks the slot automatically with zero manual calling.
            </p>

            <div className="space-y-2.5">
              <h4 className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold">
                Queued Waitlist Clients
              </h4>
              {waitlist.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#F6FAF9] border border-black/5 text-center text-xs text-[#3A9295] space-y-1">
                  <p className="font-medium text-[#105F68]">Waitlist queue is empty</p>
                  <p className="text-[11px]">When fully booked, clients can join the waitlist to auto-claim cancelled slots.</p>
                </div>
              ) : (
                waitlist.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#105F68] block">{entry.clientName}</span>
                      <span className="text-[11px] text-[#3A9295]">{entry.serviceName} • {entry.preferredTime}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        entry.status === "claimed" 
                          ? "bg-emerald-100 text-emerald-800"
                          : entry.status === "notified"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-black/5 text-[#3A9295]"
                      }`}>
                        {entry.status}
                      </span>

                      {entry.status !== "claimed" && (
                        <button
                          onClick={() => handleClaimWaitlist(entry.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#105F68] text-white text-[11px] hover:bg-[#0D4F57] transition-all"
                        >
                          Claim Slot
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={handleDispatchWaitlist}
                className="px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-light transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate WhatsApp Instant-Fill Blast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Single-Use VIP Booking Link */}
      {isSingleUseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#105F68]" />
                <h3 className="text-base font-semibold text-[#105F68]">
                  Single-Use VIP Booking Link
                </h3>
              </div>
              <button
                onClick={() => setIsSingleUseModalOpen(false)}
                className="text-xs text-[#3A9295] hover:text-[#105F68]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#3A9295] leading-relaxed">
              This private URL will self-destruct after exactly <b>one</b> appointment is booked. VIP clients cannot forward or reuse private slots.
            </p>

            <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/10 flex items-center justify-between gap-2">
              <input
                type="text"
                readOnly
                value={singleUseLink}
                className="w-full bg-transparent text-xs text-[#105F68] font-mono focus:outline-none"
              />
              <button
                onClick={() => {
                  playClick();
                  navigator.clipboard?.writeText(singleUseLink);
                  setCopiedVip(true);
                  setTimeout(() => setCopiedVip(false), 2000);
                }}
                className="p-2 rounded-lg bg-[#105F68] text-white text-xs hover:bg-[#0D4F57] transition-all shrink-0"
              >
                {copiedVip ? <Check className="w-3.5 h-3.5 text-[#63C1BB]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Client CRM Dossier */}
      {selectedClientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#105F68] text-white font-semibold text-xs flex items-center justify-center">
                  {selectedClientProfile.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#105F68]">
                    {selectedClientProfile.name}
                  </h3>
                  <p className="text-[11px] text-[#3A9295]">
                    {selectedClientProfile.email} • {selectedClientProfile.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientProfile(null)}
                className="text-xs text-[#3A9295] hover:text-[#105F68]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] uppercase text-[#3A9295]">Visits</span>
                <p className="text-base font-bold text-[#105F68] mt-0.5">{selectedClientProfile.totalVisits}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <span className="text-[10px] uppercase text-[#3A9295]">No-Shows</span>
                <p className="text-base font-bold text-[#105F68] mt-0.5">{selectedClientProfile.noShowCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7]">
                <span className="text-[10px] uppercase text-[#2E7D32]">Reliability</span>
                <p className="text-base font-bold text-[#1B5E20] mt-0.5">{selectedClientProfile.reliabilityScore}%</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-semibold">
                Private Formula / Internal Service Notes:
              </span>
              <p className="p-3 rounded-xl bg-[#FBFDFD] border border-black/10 text-[#103438] leading-relaxed">
                {selectedClientProfile.formulasOrNotes}
              </p>
            </div>

            {selectedClientProfile.membershipPlan && (
              <div className="p-3 rounded-xl bg-[#C8E6E2]/30 border border-[#9ED5D1] text-xs text-[#105F68]">
                <b>Active Membership:</b> {selectedClientProfile.membershipPlan}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedClientProfile(null)}
                className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
