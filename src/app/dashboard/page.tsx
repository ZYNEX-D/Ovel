"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ExternalLink, 
  Check, 
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
  Building2,
  Users,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Package
} from "lucide-react";
import { 
  getBookings, 
  saveBookings,
  INITIAL_BOOKINGS,
  INITIAL_WAITLIST,
  INITIAL_CLIENT_PROFILES,
  getWaitlist,
  dispatchWaitlistBlast,
  selectWaitlistRecipient,
  claimWaitlistSlot,
  chargeNoShowFee,
  getClientProfiles,
  summarizeBookings,
  getStaff,
  StaffMember,
  INITIAL_STAFF,
  BookingRecord,
  WaitlistEntry,
  ClientProfile,
  getProducts,
  INITIAL_PRODUCTS,
} from "@/lib/platform-store";
import { formatCurrency, formatCurrencyRaw, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink, PRESET_OVELINKS } from "@/lib/ovelink-store";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth, BusinessType } from "@/lib/auth-context";
import { Coins } from "lucide-react";
import { getMerchantSubscription, checkOrderQuotaStatus } from "@/lib/subscription-store";
import LottieAnimation from "@/components/LottieAnimation";
import { livePulseLottie, clockLottie, waitlistRadarLottie } from "@/lib/animations/dashboard-lotties";
import { ArcMetricCard } from "@/components/ui/ArcMetricCard";
import { ArcBadge } from "@/components/ui/ArcBadge";
import Toast from "@/components/arc/toast/toast";

export default function DashboardOverviewPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const mounted = useHydrated();
  const wsId = profile?.organizationId;

  const businessType: BusinessType = profile?.businessType || (
    typeof window !== "undefined"
      ? (localStorage.getItem(`ovel_business_type_${profile?.organizationId || profile?.organizationSlug}`) as BusinessType)
        || (localStorage.getItem("ovel_selected_business_type") as BusinessType)
        || "both"
      : "both"
  );

  const bookings = useClientStore(() => getBookings(wsId), () => INITIAL_BOOKINGS);
  const products = useClientStore(() => getProducts(wsId), () => INITIAL_PRODUCTS);
  const waitlist = useClientStore(() => getWaitlist(wsId), () => INITIAL_WAITLIST);
  const clientProfiles = useClientStore(() => getClientProfiles(wsId), () => INITIAL_CLIENT_PROFILES);
  const staff = useClientStore(() => getStaff(wsId), () => INITIAL_STAFF);
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

  const { totalRevenue, depositsCollected, avgOrderValue, activeBookingsCount } = summarizeBookings(bookings);
  const feesSaved = Math.round((totalRevenue / 100) * 0.2);

  const defaultSlug = profile?.organizationSlug || "leclat";
  const activeOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, wsId),
    () => PRESET_OVELINKS[defaultSlug] || PRESET_OVELINKS.leclat
  );
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;

  const merchantTarget = wsId || defaultSlug;
  const subscription = getMerchantSubscription(merchantTarget);
  const quota = checkOrderQuotaStatus(merchantTarget, bookings.length);

  const handleChargeNoShow = (bookingId: string) => {
    const updated = chargeNoShowFee(bookingId, 2500, wsId);
    if (updated) {
      playSuccess();
      showToast(`${formatCurrency(2500, currency)} no-show fee charged to card •••• ${updated.cardLast4 || "4242"}.`);
    } else {
      showToast("No-show fee was not charged. A card must be on file, and the booking cannot already be closed.");
    }
  };

  const handleMarkCompleted = (bookingId: string) => {
    playSuccess();
    const all = getBookings(wsId);
    const updated = all.map(b => b.id === bookingId ? { ...b, status: "completed" as const } : b);
    saveBookings(updated, wsId);
    showToast("Booking marked completed! Triggered automatic 2h review request & 4-week rebooking schedule.");
  };

  const handleDispatchWaitlist = () => {
    const recipientIndex = selectWaitlistRecipient(waitlist, "");
    const recipient = recipientIndex >= 0 ? waitlist[recipientIndex] : undefined;
    if (!recipient) {
      showToast("No one is waiting for a slot.");
      return;
    }
    playSuccess();
    dispatchWaitlistBlast(recipient.preferredTime, recipient.serviceName, wsId);
    showToast(`WhatsApp sent to ${recipient.clientName} for ${recipient.serviceName}.`);
  };

  const handleClaimWaitlist = (entryId: string) => {
    playSuccess();
    const assignedStaff = staff[0]?.name || "Dr. Genevieve Moreau";
    const newBooking = claimWaitlistSlot(entryId, assignedStaff, wsId);
    if (newBooking) {
      setIsWaitlistModalOpen(false);
      showToast(`Slot claimed by ${newBooking.clientName}! Revenue recovered.`);
    } else {
      showToast("That waitlist spot could not be claimed. It may already be taken or the time is booked.");
    }
  };

  const handleGenerateVipLink = () => {
    playClick();
    const token = "vip_" + Math.random().toString(36).substring(2, 10);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ovel.lk";
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
      formulasOrNotes: "Standard clinical roadmap.",
    };
    setSelectedClientProfile(found);
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50">
        <Toast
          open={Boolean(notification)}
          onOpenChange={(open) => { if (!open) setNotification(null); }}
          title={notification || ""}
          duration={3500}
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          {/* Workspace Status Pill */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <ArcBadge variant="teal" pulseDot size="sm">
              {profile?.organizationName || "Lumina Atelier & Clinic"}
            </ArcBadge>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
              Overview
            </h1>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              {mounted && new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor daily appointments, specialist capacity, and direct revenue collection in real time.
          </p>
        </div>

        {/* Minimal Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {businessType !== "products" && (
            <Link
              href="/dashboard/roster"
              onClick={() => playClick()}
              className="px-3.5 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Full Schedule</span>
            </Link>
          )}

          {businessType !== "services" && (
            <Link
              href="/dashboard/products"
              onClick={() => playClick()}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs ${
                businessType === "products"
                  ? "bg-[#105F68] hover:bg-[#0D4F57] text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Products ({products.length})</span>
            </Link>
          )}

          <button
            onClick={handleGenerateVipLink}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium transition-all flex items-center gap-1.5 shadow-xs"
            title="Generate a self-destructing VIP link"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>VIP Pass</span>
          </button>

          {businessType !== "products" && (
            <button
              onClick={() => {
                playClick();
                setIsWaitlistModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Waitlist ({waitlist.filter(w => w.status === "waiting").length})</span>
            </button>
          )}

          {/* Minimalist Round-Robin Switch for appointments */}
          {businessType !== "products" && (
            <button
              onClick={() => {
                playClick();
                setRoundRobinActive(!roundRobinActive);
                showToast(roundRobinActive ? "Staff auto-distribution disabled" : "Staff auto-distribution enabled");
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border shadow-xs ${
                roundRobinActive
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Auto-Assign: {roundRobinActive ? "On" : "Off"}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <ArcMetricCard
          label="Booked Volume"
          value={mounted ? formatCurrency(totalRevenue, currency) : formatCurrency(0, currency)}
          subValue="100% direct to account"
          trend={{ value: "+14.2% mo/mo", isPositive: true }}
          icon={Coins}
          statusDot="live"
        />

        <ArcMetricCard
          label="Deposits Held"
          value={mounted ? formatCurrency(depositsCollected, currency) : formatCurrency(0, currency)}
          subValue="Zero chargebacks"
          trend={{ value: "Card authorized", isPositive: true }}
          icon={CreditCard}
          variant="emerald"
          statusDot="live"
        />

        <ArcMetricCard
          label="Commission Saved"
          value={mounted ? formatCurrencyRaw(feesSaved, currency, { showDecimals: false }) : formatCurrencyRaw(0, currency, { showDecimals: false })}
          subValue="vs 20% marketplace cut"
          trend={{ value: "0% cut", isPositive: true }}
          icon={Sparkles}
          variant="brand"
          badgeText="0% FEE"
        />

        <ArcMetricCard
          label="Average Ticket"
          value={mounted ? formatCurrency(avgOrderValue, currency) : formatCurrency(0, currency)}
          subValue={businessType === "products" ? "Average order total" : "Average per booking"}
          trend={{ value: "+8.4%", isPositive: true }}
          icon={TrendingUp}
        />

        <ArcMetricCard
          label="Attendance Rate"
          value="98.5%"
          subValue="$25 no-show card coverage"
          trend={{ value: "99.1% target", isPositive: true }}
          icon={ShieldCheck}
          statusDot="live"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Today&apos;s Schedule
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {mounted ? activeBookingsCount : 0} {activeBookingsCount === 1 ? "Session" : "Sessions"}
                </span>
              </div>

              <Link
                href="/dashboard/roster"
                onClick={() => playClick()}
                className="text-xs text-[#105F68] hover:text-[#0D4F57] font-medium flex items-center gap-1 group transition-colors"
              >
                <span>Full Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Schedule Items List */}
            <div className="space-y-3">
              {!mounted ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 rounded-full border-2 border-[#105F68] border-t-transparent animate-spin mx-auto" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto flex items-center justify-center opacity-85">
                    <LottieAnimation animationData={clockLottie} className="w-full h-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">No appointments scheduled today</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Appointments booked via your branded booking page will appear here automatically.
                    </p>
                  </div>
                  <div className="pt-1">
                    <Link
                      href="/dashboard/roster"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-medium transition-all"
                    >
                      <span>Create Appointment</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {quota.isExceeded && subscription.tier === "free" && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900 block">
                            Free Plan Monthly Quota Exceeded (100+ Orders)
                          </span>
                          <span className="text-[11px] text-amber-800">
                            Client details on orders exceeding your 100 free monthly threshold are blurred. Upgrade to Growth (LKR 500/mo) to unlock client info.
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/dashboard/settings?tab=plans"
                        className="shrink-0 px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-xs text-center text-xs"
                      >
                        Upgrade to Growth
                      </Link>
                    </div>
                  )}

                  {bookings.map((b, index) => {
                    const isBlurred = quota.isExceeded && subscription.tier === "free" && index >= 100;
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Time & Client Details */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center shrink-0 font-mono shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
                            <span className="text-[10px] font-semibold">
                              {b.timeDisplay ? b.timeDisplay.split(" ")[0] : "10:00"}
                            </span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {isBlurred ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-400 blur-xs select-none">
                                    Customer Confidential
                                  </span>
                                  <Link
                                    href="/dashboard/settings?tab=plans"
                                    className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                                  >
                                    Upgrade to View
                                  </Link>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenClientDossier(b.clientName)}
                                    className="text-sm font-medium text-slate-900 hover:text-[#105F68] transition-colors flex items-center gap-1"
                                  >
                                    <span>{b.clientName}</span>
                                    <User className="w-3 h-3 text-slate-400" />
                                  </button>

                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {b.clientPhone}
                                  </span>
                                </>
                              )}

                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                b.status === "confirmed"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                  : b.status === "completed"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
                              }`}>
                                {b.status === "confirmed" ? "Confirmed" : b.status === "completed" ? "Completed" : "Cancelled"}
                              </span>
                            </div>

                        <p className="text-xs text-[#105F68] font-medium mt-0.5">
                          {b.serviceName}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>Team Member: <b className="text-slate-700">{b.staffName}</b></span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200/60 font-medium text-slate-600">
                            {b.stationResource || "Station 1"}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(b.totalPriceCents, currency)}
                            <span className="text-slate-400 font-normal"> (Deposit: {formatCurrency(b.depositPaidCents, currency)})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {b.status !== "completed" && (
                        <button
                          onClick={() => handleMarkCompleted(b.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition-all border border-emerald-200/80"
                        >
                          Complete
                        </button>
                      )}

                      {!b.isNoShow && b.status !== "completed" && (
                        <button
                          onClick={() => handleChargeNoShow(b.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium transition-all border border-slate-200 hover:border-rose-200 flex items-center gap-1"
                          title="Apply $25 late cancellation or no-show policy"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          <span>No-Show</span>
                        </button>
                      )}

                      <Link
                        href={`/portal/${b.rescheduleToken}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs transition-all border border-slate-200"
                        title="Open Client Portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Facility Stations & Operational Radar */}
        <div className="space-y-4">
          {/* Station & Bay Utilization */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#105F68]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Stations &amp; Rooms
                </h3>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium">
                Live Status
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {bookings.filter((b) => b.status === "confirmed" || b.status === "pending_deposit").length > 0 ? (
                bookings
                  .filter((b) => b.status === "confirmed" || b.status === "pending_deposit")
                  .slice(0, 3)
                  .map((b, idx) => {
                    const start = new Date(b.startTime);
                    const end = new Date(b.endTime);
                    const timeStr = !isNaN(start.getTime()) && !isNaN(end.getTime())
                      ? `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
                      : "In Session";

                    return (
                      <div key={b.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <span>Suite {idx + 1}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">In Use</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {b.clientName} • {b.serviceName}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-medium text-slate-700">{timeStr}</span>
                      </div>
                    );
                  })
              ) : (
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-emerald-800 font-medium text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    All Stations Ready &amp; Open
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    No active sessions occupying stations right now. Utilization updates live as appointments begin.
                  </p>
                </div>
              )}

              {/* Ready / Open Bay Status if some are occupied */}
              {bookings.filter((b) => b.status === "confirmed" || b.status === "pending_deposit").length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/50 flex items-center justify-between opacity-85">
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <span>Suite {bookings.filter((b) => b.status === "confirmed" || b.status === "pending_deposit").length + 1}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Available</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Sanitized and ready for scheduling
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-medium">Open</span>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Utilization */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#105F68]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Team Members
                </h3>
              </div>
              <Link
                href="/dashboard/staff"
                className="text-xs text-[#105F68] font-medium hover:underline"
              >
                Manage Team
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {staff.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 text-center space-y-2 text-xs">
                  <p className="text-slate-500 text-[11px]">No team members registered in this workspace yet.</p>
                  <Link
                    href="/dashboard/staff"
                    className="inline-block px-3 py-1.5 rounded-xl bg-[#105F68] text-white text-[11px] font-medium hover:bg-[#0D4F57] transition-all"
                  >
                    + Add Team Member
                  </Link>
                </div>
              ) : (
                staff.slice(0, 3).map((member) => {
                  const memberBookings = bookings.filter(
                    (b) => b.staffId === member.id || b.staffName === member.name
                  );
                  const initials = member.name
                    ? member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    : "ST";
                  const revenueCents = memberBookings.reduce(
                    (sum, b) => sum + (b.totalPriceCents || 0),
                    0
                  );

                  return (
                    <div key={member.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#105F68] text-white font-semibold text-[10px] flex items-center justify-center">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{member.name}</h4>
                          <p className="text-[10px] text-slate-500">
                            {memberBookings.length === 0
                              ? `${member.role || "Specialist"} • Available`
                              : `${memberBookings.length} session${memberBookings.length === 1 ? "" : "s"} scheduled`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {revenueCents > 0 ? (
                          <>
                            <span className="font-semibold text-emerald-800">{formatCurrency(revenueCents, currency)}</span>
                            <p className="text-[10px] text-slate-400">Booked</p>
                          </>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Minimalist Waitlist Radar Card */}
          <div className="p-5 rounded-2xl bg-[#105F68] text-white shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                  <LottieAnimation animationData={waitlistRadarLottie} className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C8E6E2]">
                  Priority Waitlist
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#C8E6E2] font-mono">
                {mounted ? waitlist.filter(w => w.status === "waiting").length : 0} waiting
              </span>
            </div>

            <p className="text-xs text-[#E0F2F1] leading-relaxed">
              {mounted && waitlist.length > 0 ? (
                <>
                  <b>{waitlist.length} guest{waitlist.length > 1 ? "s" : ""}</b> ({waitlist[0].clientName}{waitlist.length > 1 ? ` +${waitlist.length - 1} more` : ""}) queued for openings today.
                </>
              ) : (
                <>
                  When calendar slots fill up, waitlisted clients can automatically fill last-minute cancellations via WhatsApp.
                </>
              )}
            </p>

            <button
              onClick={() => {
                playClick();
                setIsWaitlistModalOpen(true);
              }}
              className="w-full py-2 rounded-xl bg-white text-[#105F68] text-xs font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{waitlist.length > 0 ? "Broadcast Opening" : "View Waitlist Queue"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Instant-Fill Waitlist */}
      <AnimatePresence>
        {isWaitlistModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Priority Waitlist
                    </h3>
                    <p className="text-xs text-slate-500">
                      Auto-fill cancellations directly from queued guests.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsWaitlistModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Queued Clients
                </h4>
                {waitlist.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-800">No clients on the waitlist right now</p>
                    <p className="text-[11px]">Clients can join your waitlist from your booking page when fully booked.</p>
                  </div>
                ) : (
                  waitlist.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-900 block">{entry.clientName}</span>
                        <span className="text-[11px] text-slate-500">{entry.serviceName} • {entry.preferredTime}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          entry.status === "claimed" 
                            ? "bg-emerald-100 text-emerald-800"
                            : entry.status === "notified"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-200/70 text-slate-600"
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
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notify Next in Queue</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Single-Use VIP Booking Link */}
      <AnimatePresence>
        {isSingleUseModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <h3 className="text-base font-semibold text-slate-900">
                    VIP Single-Use Booking Link
                  </h3>
                </div>
                <button
                  onClick={() => setIsSingleUseModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                This URL expires automatically after exactly <b>one</b> appointment is booked. Ideal for private celebrity or VIP client access.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <input
                  type="text"
                  readOnly
                  value={singleUseLink}
                  className="w-full bg-transparent text-xs text-slate-800 font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    playClick();
                    navigator.clipboard?.writeText(singleUseLink);
                    setCopiedVip(true);
                    setTimeout(() => setCopiedVip(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#105F68] text-white text-xs hover:bg-[#0D4F57] transition-all shrink-0 flex items-center gap-1 font-medium"
                >
                  {copiedVip ? <Check className="w-3.5 h-3.5 text-[#63C1BB]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVip ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Client CRM Dossier */}
      <AnimatePresence>
        {selectedClientProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-7 space-y-5 border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#105F68] text-white font-semibold text-xs flex items-center justify-center">
                    {selectedClientProfile.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {selectedClientProfile.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedClientProfile.email} • {selectedClientProfile.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClientProfile(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">Visits</span>
                  <p className="text-base font-semibold text-slate-800 mt-0.5">{selectedClientProfile.totalVisits}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">No-Shows</span>
                  <p className="text-base font-semibold text-slate-800 mt-0.5">{selectedClientProfile.noShowCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase text-emerald-700 font-medium">Reliability</span>
                  <p className="text-base font-semibold text-emerald-800 mt-0.5">{selectedClientProfile.reliabilityScore}%</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Private Client &amp; Service Notes:
                </span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 leading-relaxed text-xs">
                  {selectedClientProfile.formulasOrNotes}
                </p>
              </div>

              {selectedClientProfile.membershipPlan && (
                <div className="p-3 rounded-xl bg-[#63C1BB]/10 border border-[#63C1BB]/30 text-xs text-[#105F68]">
                  <b>Active Membership:</b> {selectedClientProfile.membershipPlan}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedClientProfile(null)}
                  className="px-4 py-2 rounded-xl bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
