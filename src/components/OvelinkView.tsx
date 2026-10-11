"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Sparkles, 
  MessageSquare, 
  Lock, 
  ChevronLeft, 
  Share2, 
  Copy, 
  ExternalLink, 
  ShoppingBag, 
  MapPin, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  QrCode,
  X,
  Phone,
  Star,
  Upload,
  Plus,
  Tag,
  Mail
} from "lucide-react";
import { 
  OvelinkCustomization, 
  OvelinkOffering, 
  OfferingType 
} from "@/lib/ovelink-store";
import { getReviews } from "@/lib/reviews-store";
import { useAudio } from "@/components/AudioController";

interface OvelinkViewProps {
  config: OvelinkCustomization;
  isEmbedPreview?: boolean; // When rendered inside the live studio frame
  onOfferingClick?: (offering: OvelinkOffering) => void;
}

export default function OvelinkView({ config, isEmbedPreview = false }: OvelinkViewProps) {
  const { playClick, playSuccess } = useAudio();
  const [activeFilter, setActiveFilter] = useState<"all" | OfferingType>("all");
  const [selectedOffering, setSelectedOffering] = useState<OvelinkOffering | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: offering details, 2: schedule/order specifics, 3: client intake, 4: confirmed

  // Schedule selection
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("10:00 AM");
  
  // Order selection
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [confirmationToken, setConfirmationToken] = useState("");

  // Retail Upsell state
  const [selectedRetailAddons, setSelectedRetailAddons] = useState<Record<string, boolean>>({});

  // Conditional Logic Intake & Reference Photo state
  const [hasSensitivity, setHasSensitivity] = useState(false);
  const [sensitivityDetails, setSensitivityDetails] = useState("");
  const [referencePhotoAttached, setReferencePhotoAttached] = useState(false);

  // Social Proof Reviews
  const reviews = useMemo(() => getReviews(), []);

  // Share / QR Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Available time slots simulation
  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

  const retailOfferings = useMemo(() => {
    return config.offerings.filter((o) => o.type === "order" && o.id !== selectedOffering?.id && o.isActive);
  }, [config.offerings, selectedOffering]);

  const selectedRetailTotal = useMemo(() => {
    return retailOfferings.reduce((sum, item) => {
      return selectedRetailAddons[item.id] ? sum + item.priceCents : sum;
    }, 0);
  }, [retailOfferings, selectedRetailAddons]);

  const toggleRetailAddon = (id: string) => {
    playClick();
    setSelectedRetailAddons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredOfferings = useMemo(() => {
    if (activeFilter === "all") return config.offerings.filter(o => o.isActive);
    return config.offerings.filter(o => o.isActive && o.type === activeFilter);
  }, [config.offerings, activeFilter]);

  const handleSelectOffering = (off: OvelinkOffering) => {
    playClick();
    setSelectedOffering(off);
    setStep(off.requiresTimeSlot ? 1 : 2);
  };

  const handleCopyLink = () => {
    playClick();
    const url = typeof window !== "undefined" ? `${window.location.origin}/l/${config.slug}` : `https://ovel.app/l/${config.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) return;
    playSuccess();
    setConfirmationToken(`tok_${Math.random().toString(36).substring(2, 9)}`);
    setStep(4);
  };

  // Button style class generator
  const getButtonClass = (isPrimary = true) => {
    const radius = config.buttonStyle === "pill" 
      ? "rounded-full" 
      : config.buttonStyle === "sharp" 
      ? "rounded-md" 
      : "rounded-xl";

    if (isPrimary) {
      return `${radius} px-5 py-2.5 text-xs font-medium transition-all shadow-sm hover:opacity-90 active:scale-95 text-white`;
    }
    return `${radius} px-4 py-2 text-xs font-light transition-all border hover:bg-black/5`;
  };

  const getCardRadius = () => {
    return config.cardRadius || "rounded-2xl";
  };

  return (
    <div 
      className={`min-h-full w-full transition-colors duration-300 ${!isEmbedPreview ? "min-h-screen" : ""}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontFamily: config.fontFamily,
      }}
    >
      {/* Cover Banner */}
      <div 
        className={`w-full bg-gradient-to-r ${config.coverGradient} relative ${isEmbedPreview ? "h-28" : "h-40 sm:h-52"} transition-all duration-300 bg-cover bg-center`}
        style={config.coverImageUrl ? { backgroundImage: `url(${config.coverImageUrl})` } : undefined}
      >
        {config.coverImageUrl && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        )}
        {/* Brand Bar */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
          <button
            onClick={() => { playClick(); setIsShareModalOpen(true); }}
            className="p-2 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-all text-xs flex items-center gap-1.5 shadow-sm"
            title="Share Ovelink"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Share</span>
          </button>
        </div>

        {/* Powered by Ovel Tag */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <Link
            href="/"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] hover:bg-white/30 transition-all"
          >
            <span>powered by</span>
            <span className="font-['Disolve'] font-semibold">ovel</span>
          </Link>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={`max-w-2xl mx-auto px-4 sm:px-6 relative ${isEmbedPreview ? "-mt-10 pb-8" : "-mt-14 pb-20"}`}>
        {/* Business Profile Header Card */}
        <div 
          className={`p-5 sm:p-6 shadow-xl border border-black/5 relative transition-all ${getCardRadius()}`}
          style={{ backgroundColor: config.surfaceColor }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar Circle */}
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md border-2 border-white transition-transform overflow-hidden relative"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.logoUrl ? (
                  <img 
                    src={config.logoUrl} 
                    alt={config.businessName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  config.avatarInitials
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
                    style={{ backgroundColor: `${config.accentColor}33`, color: config.primaryColor }}
                  >
                    {config.businessCategory}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Instant Confirmation
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: config.primaryColor }}>
                  {config.businessName}
                </h1>
                <p className="text-xs opacity-75 font-light mt-0.5">
                  {config.businessTagline}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {config.businessBio && (
            <p className="text-xs opacity-80 leading-relaxed mt-4 pt-3 border-t border-black/5 font-light">
              {config.businessBio}
            </p>
          )}

          {/* Quick Connect & Links */}
          <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap items-center gap-2 text-xs">
            {config.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-[11px] opacity-80">
                <MapPin className="w-3 h-3 text-[#3A9295]" />
                <span>{config.location}</span>
              </span>
            )}

            {config.whatsappNumber && (
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp Us</span>
              </a>
            )}

            {config.email && (
              <a
                href={`mailto:${config.email}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] text-[#105F68] bg-[#F6FAF9] border border-[#105F68]/15 hover:bg-white transition-all"
              >
                <Mail className="w-3 h-3 text-[#3A9295]" />
                <span>{config.email}</span>
              </a>
            )}

            {config.instagramHandle && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 text-[11px] opacity-80 font-mono">
                <span>{config.instagramHandle}</span>
              </span>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 text-[11px] opacity-80 transition-all ml-auto"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedLink ? "Copied!" : "ovel.app/l/" + config.slug}</span>
            </button>
          </div>
        </div>

        {/* Offering Mode Filters */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all" as const, label: "All Offerings" },
            { id: "appointment" as const, label: "Appointments" },
            { id: "booking" as const, label: "Bookings & Slots" },
            { id: "order" as const, label: "Orders & Packages" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { playClick(); setActiveFilter(tab.id); }}
                className={`px-4 py-2 text-xs font-light whitespace-nowrap transition-all ${config.buttonStyle === "pill" ? "rounded-full" : "rounded-xl"}`}
                style={{
                  backgroundColor: isActive ? config.primaryColor : config.surfaceColor,
                  color: isActive ? "#FFFFFF" : config.textColor,
                  border: isActive ? `1px solid ${config.primaryColor}` : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Offerings Grid */}
        <div className="mt-4 space-y-3.5">
          {filteredOfferings.map((off) => {
            const isSelected = selectedOffering?.id === off.id;
            return (
              <div
                key={off.id}
                onClick={() => handleSelectOffering(off)}
                className={`p-4 sm:p-5 border transition-all cursor-pointer relative hover:shadow-md ${getCardRadius()}`}
                style={{
                  backgroundColor: config.surfaceColor,
                  borderColor: isSelected ? config.primaryColor : "rgba(0,0,0,0.06)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      {off.badge && (
                        <span 
                          className="text-[9px] px-2 py-0.2 rounded-full font-medium uppercase tracking-wide"
                          style={{ backgroundColor: `${config.accentColor}33`, color: config.primaryColor }}
                        >
                          {off.badge}
                        </span>
                      )}
                      <span className="text-[10px] opacity-60 uppercase font-light">
                        {off.type}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold leading-snug" style={{ color: config.primaryColor }}>
                      {off.name}
                    </h3>
                    <p className="text-xs opacity-75 font-light mt-1 leading-relaxed">
                      {off.description}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs opacity-70">
                      {off.durationMinutes && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{off.durationMinutes} mins</span>
                        </span>
                      )}

                      {off.depositCents > 0 && (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          ${(off.depositCents / 100).toFixed(2)} deposit required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="text-right flex flex-col justify-between items-end self-stretch">
                    <div>
                      <span className="text-base sm:text-lg font-bold block" style={{ color: config.primaryColor }}>
                        ${(off.priceCents / 100).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOffering(off);
                      }}
                      className={getButtonClass(true)}
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {off.type === "order" ? "Order Now" : "Book Slot"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verified Customer Reviews & Social Proof Module */}
        {reviews.length > 0 && (
          <div className="mt-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-60">
                  Verified Social Proof
                </span>
                <h2 className="text-sm sm:text-base font-semibold" style={{ color: config.primaryColor }}>
                  Client Experiences &amp; Ratings
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-[11px] opacity-75">
                  ({reviews.length} verified {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className={`p-4 border transition-all ${getCardRadius()}`}
                  style={{ backgroundColor: config.surfaceColor, borderColor: "rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {rev.clientAvatar || rev.clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{rev.clientName}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                            Verified
                          </span>
                        </div>
                        <span className="text-[10px] opacity-60">{rev.serviceName}</span>
                      </div>
                    </div>

                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs opacity-80 leading-relaxed font-light italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-xs opacity-60 space-y-1">
          <p>Direct bookings &amp; orders. 0% platform transaction fees.</p>
          <div className="flex items-center justify-center gap-1 text-[11px]">
            <span>Powered by</span>
            <Link href="/" className="font-['Disolve'] font-bold hover:underline" style={{ color: config.primaryColor }}>
              ovel
            </Link>
          </div>
        </div>
      </div>

      {/* Booking / Ordering Checkout Modal */}
      {selectedOffering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto ${getCardRadius()}`}
            style={{ backgroundColor: config.surfaceColor, color: config.textColor }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-60">
                  {selectedOffering.type === "order" ? "Custom Order Intake" : "Reserve Time Slot"}
                </span>
                <h3 className="text-lg font-bold" style={{ color: config.primaryColor }}>
                  {selectedOffering.name}
                </h3>
                <p className="text-xs opacity-75">
                  Total: ${(selectedOffering.priceCents / 100).toFixed(2)}
                  {selectedOffering.depositCents > 0 && ` • Deposit: $${(selectedOffering.depositCents / 100).toFixed(2)}`}
                </p>
              </div>

              <button
                onClick={() => { playClick(); setSelectedOffering(null); setStep(1); }}
                className="p-1.5 rounded-full hover:bg-black/5 transition-colors opacity-70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: TIME SLOT OR ORDER QUANTITY */}
            {step === 1 && selectedOffering.requiresTimeSlot && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5 opacity-80">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-black/[0.02] text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5 opacity-80">
                    Available Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const isSlotActive = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => { playClick(); setSelectedTimeSlot(slot); }}
                          className={`p-2.5 rounded-xl text-xs font-mono transition-all border ${
                            isSlotActive
                              ? "text-white font-semibold"
                              : "border-black/10 hover:border-black/30"
                          }`}
                          style={{
                            backgroundColor: isSlotActive ? config.primaryColor : "transparent",
                            borderColor: isSlotActive ? config.primaryColor : undefined,
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => { playClick(); setStep(2); }}
                    className={getButtonClass(true)}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Continue to Client Details
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: QUANTITY & NOTES (FOR ORDERS) OR INTAKE DETAILS */}
            {(step === 2 || (step === 1 && !selectedOffering.requiresTimeSlot)) && (
              <form onSubmit={handleConfirmAction} className="space-y-4">
                {selectedOffering.type === "order" && (
                  <div className="p-3.5 rounded-2xl bg-black/[0.03] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                          className="w-7 h-7 rounded-lg border border-black/20 flex items-center justify-center font-mono text-sm"
                        >
                          -
                        </button>
                        <span className="font-mono text-sm font-semibold">{orderQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setOrderQuantity(orderQuantity + 1)}
                          className="w-7 h-7 rounded-lg border border-black/20 flex items-center justify-center font-mono text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium block mb-1 opacity-80">
                        Custom Instructions / Delivery Preferences
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Include custom inscription, preferred delivery hour, or color specifications..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/15 bg-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Your Contact &amp; Booking Details
                  </h4>

                  <div>
                    <label className="text-[11px] block mb-1 opacity-80">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Mitchell"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-black/[0.02] text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] block mb-1 opacity-80">Email Address</label>
                      <input
                        type="email"
                        placeholder="jordan@example.com"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-black/[0.02] text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] block mb-1 opacity-80">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-black/[0.02] text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Logic Intake Form (Dubsado/Acuity Competitor Feature) */}
                <div className="space-y-3 pt-1 border-t border-black/10">
                  <div className="flex items-center justify-between">
                    <label htmlFor="sensitivityToggle" className="text-xs font-medium cursor-pointer">
                      Special requests, skin/vehicle sensitivities, or preferences?
                    </label>
                    <input
                      type="checkbox"
                      id="sensitivityToggle"
                      checked={hasSensitivity}
                      onChange={(e) => setHasSensitivity(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#105F68]"
                    />
                  </div>

                  {hasSensitivity && (
                    <div className="animate-in fade-in space-y-1">
                      <textarea
                        rows={2}
                        placeholder="Please detail your sensitivities, allergies, paint condition, or preferences..."
                        value={sensitivityDetails}
                        onChange={(e) => setSensitivityDetails(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-black/15 bg-black/[0.02] text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Reference Photo Upload (Cloudflare R2) */}
                  <div className="p-3 rounded-xl bg-black/[0.02] border border-black/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 opacity-60" />
                      <div>
                        <span className="font-medium block">Reference / Inspiration Photo</span>
                        <span className="text-[10px] opacity-60">Upload directly to Cloudflare R2 storage</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setReferencePhotoAttached(!referencePhotoAttached);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        referencePhotoAttached
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "border border-black/15 hover:bg-black/5"
                      }`}
                    >
                      {referencePhotoAttached ? "✓ Photo Attached" : "+ Upload Photo"}
                    </button>
                  </div>
                </div>

                {/* Service + Retail Add-to-Cart (Driven by merchant order offerings) */}
                {retailOfferings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-black/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Retail Add-Ons (Checkout Upsell)</span>
                      </h4>
                      <span className="text-[10px] opacity-60">Products &amp; Items</span>
                    </div>

                    <div className="space-y-1.5">
                      {retailOfferings.map((item) => {
                        const isChecked = !!selectedRetailAddons[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleRetailAddon(item.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isChecked
                                ? "bg-black/[0.04] border-black/30 font-medium"
                                : "border-black/10 hover:border-black/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                isChecked ? "bg-black text-white" : "border-black/30"
                              }`}>
                                {isChecked && "✓"}
                              </div>
                              <span>{item.name}</span>
                            </div>
                            <span className="font-semibold">+${(item.priceCents / 100).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="p-3.5 rounded-2xl bg-black/[0.03] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-75">Base Service / Item Total</span>
                    <span className="font-semibold">
                      ${((selectedOffering.priceCents * orderQuantity) / 100).toFixed(2)}
                    </span>
                  </div>

                  {selectedRetailTotal > 0 && (
                    <div className="flex justify-between text-[#105F68] font-medium">
                      <span>Retail Add-Ons Total</span>
                      <span>+${(selectedRetailTotal / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold pt-1 border-t border-black/5">
                    <span>Grand Total</span>
                    <span>
                      ${(((selectedOffering.priceCents * orderQuantity) + selectedRetailTotal) / 100).toFixed(2)}
                    </span>
                  </div>

                  {selectedOffering.depositCents > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Deposit Due Now (Card on File)</span>
                      <span>${((selectedOffering.depositCents * orderQuantity) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] opacity-60 pt-1 border-t border-black/10">
                    <span>Ovel Commission Fee</span>
                    <span>$0.00 (0% Flat Rate)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs opacity-75 hover:opacity-100"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className={getButtonClass(true)}
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Confirm &amp; Place Request
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: CONFIRMED SUCCESS */}
            {step === 4 && (
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div 
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Check className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold" style={{ color: config.primaryColor }}>
                    Booking Confirmed!
                  </h3>
                  <p className="text-xs opacity-75 mt-1 max-w-sm mx-auto">
                    Thank you, <b>{clientName}</b>! Your request for <b>{selectedOffering.name}</b> has been locked in with {config.businessName}.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/[0.03] text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="opacity-75">Date &amp; Slot:</span>
                    <span className="font-semibold">{selectedDate} @ {selectedTimeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Client Contact:</span>
                    <span>{clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Reference Token:</span>
                    <span className="font-mono font-medium">{confirmationToken || "tok_confirmed"}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                  {/* WhatsApp Direct Chat */}
                  {config.whatsappNumber && (
                    <a
                      href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi ${config.businessName}! I just booked "${selectedOffering.name}" for ${selectedDate} via your Ovelink. My name is ${clientName}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send Instant Confirmation via WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      playClick();
                      setSelectedOffering(null);
                      setStep(1);
                    }}
                    className="px-5 py-2 rounded-full border border-black/15 text-xs opacity-80 hover:opacity-100"
                  >
                    Close &amp; Return to Offerings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Ovelink Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl border border-black/10 text-center font-['Kaleko_105',sans-serif]">
            <div className="flex justify-end">
              <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#105F68]">Share {config.businessName} Ovelink</h3>
              <p className="text-xs text-gray-500 mt-1">
                Send your link to customers or embed on Instagram bio &amp; WhatsApp.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono break-all text-[#105F68] select-all">
              https://ovel.app/l/{config.slug}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Ovelink"}</span>
              </button>

              {config.whatsappNumber && (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Book appointments, slots or orders directly with ${config.businessName} here: https://ovel.app/l/${config.slug}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
