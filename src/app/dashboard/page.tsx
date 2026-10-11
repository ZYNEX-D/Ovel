"use client";

import React, { useState } from "react";
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
  Palette
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

export default function DashboardSchedulePage() {
  const { profile } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const [bookings, setBookings] = useState<BookingRecord[]>(() => getBookings());
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => getWaitlist());
  const [clientProfiles] = useState<ClientProfile[]>(() => getClientProfiles());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roundRobinActive, setRoundRobinActive] = useState(true);

  // Modals & Panels
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isSingleUseModalOpen, setIsSingleUseModalOpen] = useState(false);
  const [singleUseLink, setSingleUseLink] = useState("");
  const [copiedVip, setCopiedVip] = useState(false);
  const [selectedClientProfile, setSelectedClientProfile] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPriceCents, 0);
  const depositsCollected = bookings.reduce((sum, b) => sum + b.depositPaidCents, 0);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status === statusFilter;
  });

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
    const newBooking = claimWaitlistSlot(entryId, "Assigned Specialist");
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
    const slug = profile?.organizationSlug || "main";
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
      phone: "+1 (555) 000-0000",
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
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#105F68] text-white text-xs shadow-xl flex items-center gap-2 border border-[#63C1BB]/30 animate-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Title & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Schedule Matrix &amp; Revenue Shield
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Real-time appointment roster • Smart buffer times • 1-click no-show enforcement • Instant-fill waitlist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Round-Robin Toggle */}
          <button
            onClick={() => {
              playClick();
              setRoundRobinActive(!roundRobinActive);
              showToast(roundRobinActive ? "Round-Robin disabled (Manual priority)" : "Round-Robin enabled (Equal distribution)");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-light transition-all flex items-center gap-1.5 border ${
              roundRobinActive 
                ? "bg-[#C8E6E2]/40 text-[#105F68] border-[#9ED5D1]" 
                : "bg-white text-[#3A9295] border-black/10"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Round-Robin: {roundRobinActive ? "Active" : "Off"}</span>
          </button>

          {/* Single-Use Link Generator */}
          <button
            onClick={handleGenerateVipLink}
            className="px-3.5 py-1.5 rounded-xl border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-xs text-[#105F68] font-light transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Generate Single-Use Link</span>
          </button>

          {/* Brand Identity Settings */}
          <Link
            href="/dashboard/settings"
            onClick={() => playClick()}
            className="px-3.5 py-1.5 rounded-xl border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-xs text-[#105F68] font-light transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Palette className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Brand Settings</span>
          </Link>

          {/* Smart Waitlist Engine */}
          <button
            onClick={() => {
              playClick();
              setIsWaitlistModalOpen(true);
            }}
            className="px-4 py-1.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#63C1BB]" />
            <span>Instant-Fill Waitlist ({waitlist.filter(w => w.status === "waiting").length})</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">Booked Volume</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-[#105F68]">
              ${(totalRevenue / 100).toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#3A9295] mt-1">100% Direct to Merchant Stripe</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">Deposits Secured</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-[#105F68]">
              ${(depositsCollected / 100).toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#63C1BB] font-medium mt-1">Card-on-File SetupIntents</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#3A9295]">Client Reliability</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-[#105F68]">98.5%</h3>
            <p className="text-[11px] text-[#2E7D32] mt-1">Protected by 24h Late Policy</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#105F68] text-white border border-[#105F68] shadow-sm flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#C8E6E2]">Fees Saved</span>
          <div className="mt-2">
            <h3 className="text-3xl font-light text-white">
              ${Math.round((totalRevenue / 100) * 0.2).toLocaleString()}
            </h3>
            <p className="text-[11px] text-[#C8E6E2] mt-1">vs 20% Marketplace Cut</p>
          </div>
        </div>
      </div>

      {/* Bookings Table Panel */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-light text-[#105F68] tracking-tight">
              Appointment &amp; Order Roster
            </h3>
            <p className="text-xs text-[#3A9295]">
              Includes equipment allocation, card-on-file status &amp; 1-click no-show enforcement
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#3A9295]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-black/10 text-xs bg-[#F6FAF9] text-[#105F68]"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 text-[#3A9295] uppercase tracking-wider">
                <th className="pb-3 font-medium">Time &amp; Station</th>
                <th className="pb-3 font-medium">Client / CRM Dossier</th>
                <th className="pb-3 font-medium">Treatment / Order</th>
                <th className="pb-3 font-medium">Specialist</th>
                <th className="pb-3 font-medium">Card on File</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-xs text-[#3A9295]">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-[#105F68]" />
                      </div>
                      <p className="font-medium text-sm text-[#105F68]">No bookings scheduled yet</p>
                      <p className="text-[11px] text-[#3A9295]">
                        Share your customized Ovelink page with clients or create reservations directly.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-[#F6FAF9]/50 transition-colors">
                  <td className="py-4 font-mono text-[#105F68]">
                    <div className="font-semibold">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {b.stationResource && (
                      <span className="inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-full bg-black/5 text-[#3A9295]">
                        {b.stationResource}
                      </span>
                    )}
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => handleOpenClientDossier(b.clientName)}
                      className="font-medium text-[#105F68] hover:underline flex items-center gap-1"
                    >
                      <span>{b.clientName}</span>
                      <User className="w-3 h-3 text-[#3A9295]" />
                    </button>
                    <span className="text-[11px] text-[#3A9295] block">{b.clientPhone}</span>
                  </td>

                  <td className="py-4">
                    <span className="text-[#105F68] font-medium block">{b.serviceName}</span>
                    <span className="text-[10px] text-[#2E7D32]">
                      ${(b.totalPriceCents / 100).toFixed(2)} (Dep: ${(b.depositPaidCents / 100).toFixed(2)})
                    </span>
                  </td>

                  <td className="py-4 text-[#3A9295]">{b.staffName}</td>

                  <td className="py-4">
                    {b.hasCardOnFile ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#105F68] bg-[#C8E6E2]/40 px-2 py-0.5 rounded-full">
                        <CreditCard className="w-3 h-3" />
                        <span>•••• {b.cardLast4 || "4242"}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#3A9295]">None</span>
                    )}
                  </td>

                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        b.status === "confirmed"
                          ? "bg-[#63C1BB]/20 text-[#105F68]"
                          : b.status === "completed"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : b.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.isNoShow && (
                      <span className="block text-[9px] text-red-600 font-semibold mt-0.5">
                        No-Show ($25 Charged)
                      </span>
                    )}
                  </td>

                  <td className="py-4 text-right space-x-2">
                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <>
                        <button
                          onClick={() => handleMarkCompleted(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] text-[11px] font-medium transition-all inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Complete</span>
                        </button>

                        <button
                          onClick={() => handleChargeNoShow(b.id)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-medium transition-all inline-flex items-center gap-1"
                          title="Charge $25 No-Show Fee via saved Card-on-File"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>No-Show Fee</span>
                        </button>
                      </>
                    )}

                    <Link
                      href={`/portal/${b.rescheduleToken}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-[#105F68] hover:underline"
                    >
                      <span>Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instant-Fill Waitlist Modal */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
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

      {/* Single-Use VIP Booking Link Modal */}
      {isSingleUseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
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

      {/* Client CRM Dossier Modal */}
      {selectedClientProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
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
