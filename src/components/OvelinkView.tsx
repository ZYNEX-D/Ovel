"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Check,
  Share2,
  Copy,
  MapPin,
  ArrowRight,
  ShieldCheck,
  QrCode,
  X,
  Phone,
  Star,
  Upload,
  Tag,
  Mail,
  MessageSquare
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

  const getCardRadius = () => {
    return config.cardRadius || "rounded-3xl";
  };

  return (
    <div
      className={`min-h-full w-full font-sans antialiased transition-colors duration-300 relative selection:bg-[#105F68] selection:text-white ${!isEmbedPreview ? "min-h-screen" : ""}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {/* Cover Banner */}
      <div
        className={`w-full bg-gradient-to-r ${config.coverGradient} relative ${isEmbedPreview ? "h-32" : "h-44 sm:h-56"} transition-all duration-300 bg-cover bg-center overflow-hidden`}
        style={config.coverImageUrl ? { backgroundImage: `url(${config.coverImageUrl})` } : undefined}
      >
        {/* Ambient luxury light sheen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Bar Container */}
        <div className="max-w-xl mx-auto px-4 sm:px-6 h-full flex items-start justify-between pt-4 sm:pt-5 relative z-10">
          {/* Powered by Ovel Tag */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium hover:bg-black/35 transition-all shadow-sm group"
          >
            <span className="opacity-80">powered by</span>
            <span className="font-['Disolve'] font-bold tracking-wide">ovel</span>
          </Link>

          {/* Share Button */}
          <button
            onClick={() => { playClick(); setIsShareModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium hover:bg-black/35 transition-all shadow-sm"
            title="Share Ovelink"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Content Container - with generous mobile padding and max-w-xl */}
      <div className={`max-w-xl mx-auto px-4 sm:px-6 relative ${isEmbedPreview ? "-mt-10 pb-8" : "-mt-16 sm:-mt-20 pb-24"}`}>
        
        {/* Business Profile Header Card */}
        <div
          className={`p-5 sm:p-7 shadow-[0_12px_40px_rgba(16,95,104,0.08)] border border-black/[0.05] relative transition-all bg-white ${getCardRadius()}`}
          style={{ backgroundColor: config.surfaceColor }}
        >
          {/* Top Profile Row: Avatar + Title & Live Status */}
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar Squircle with Verified Badge */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md border-2 border-white transition-transform overflow-hidden"
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
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#105F68] border-2 border-white flex items-center justify-center shadow-sm"
                title="Verified Merchant"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#63C1BB]" />
              </div>
            </div>

            {/* Title, Category & Status */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: `${config.accentColor}25`, color: config.primaryColor }}
                >
                  {config.businessCategory}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Confirmation
                </span>
              </div>

              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight text-[#103438] leading-tight"
                style={{ fontFamily: config.fontFamily }}
              >
                {config.businessName}
              </h1>

              {config.businessTagline && (
                <p className="text-xs sm:text-sm text-[#3A9295] font-medium mt-0.5 leading-snug">
                  {config.businessTagline}
                </p>
              )}
            </div>
          </div>

          {/* Business Bio */}
          {config.businessBio && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-4 pt-3.5 border-t border-slate-100 font-normal">
              {config.businessBio}
            </p>
          )}

          {/* Micro-Action Quick Connect Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            {config.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#105F68] flex-shrink-0" />
                <span className="truncate max-w-[190px]">{config.location}</span>
              </span>
            )}

            {config.whatsappNumber && (
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Us</span>
              </a>
            )}

            {config.email && (
              <a
                href={`mailto:${config.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#105F68] bg-[#F6FAF9] border border-[#105F68]/20 hover:bg-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#3A9295]" />
                <span>Email</span>
              </a>
            )}

            {config.instagramHandle && (
              <a
                href={`https://instagram.com/${config.instagramHandle.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                <span>{config.instagramHandle}</span>
              </a>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#105F68]/10 hover:bg-[#105F68]/15 border border-[#105F68]/20 text-[11px] font-medium text-[#105F68] transition-colors ml-auto shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Copied!" : `ovel.app/l/${config.slug}`}</span>
            </button>
          </div>
        </div>

        {/* Offering Category Filter Tabs */}
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
                className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all rounded-full ${
                  isActive
                    ? "text-white shadow-md shadow-[#105F68]/20"
                    : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 shadow-sm"
                }`}
                style={{
                  backgroundColor: isActive ? config.primaryColor : undefined,
                  borderColor: isActive ? config.primaryColor : undefined,
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
                className={`p-5 sm:p-6 bg-white border transition-all duration-200 cursor-pointer relative group hover:shadow-[0_12px_30px_rgba(16,95,104,0.08)] hover:-translate-y-0.5 ${getCardRadius()} ${
                  isSelected ? "ring-2 ring-[#105F68] border-transparent" : "border-slate-200/70 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                }`}
                style={{ backgroundColor: config.surfaceColor }}
              >
                {/* Header Row: Badges + Price */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {off.badge && (
                      <span
                        className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: `${config.accentColor}25`, color: config.primaryColor }}
                      >
                        {off.badge}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {off.type}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-[#103438]">
                      ${(off.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Service Name & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#103438] group-hover:text-[#105F68] transition-colors leading-snug">
                    {off.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1.5 leading-relaxed">
                    {off.description}
                  </p>
                </div>

                {/* Footer: Metadata Chips + CTA Button */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {off.durationMinutes && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-[#105F68]" />
                        <span>{off.durationMinutes} mins</span>
                      </span>
                    )}

                    {off.depositCents > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>${(off.depositCents / 100).toFixed(2)} deposit</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOffering(off);
                    }}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow-md shadow-[#105F68]/20 flex items-center gap-1.5 active:scale-95 hover:opacity-95 transition-all flex-shrink-0"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <span>{off.type === "order" ? "Order Now" : "Book Slot"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Verified Social Proof
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#103438]">
                  Client Experiences &amp; Ratings
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="text-[11px] text-amber-800/80 font-medium">
                  ({reviews.length} verified)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className={`p-4 sm:p-5 bg-white border border-slate-200/70 shadow-sm transition-all ${getCardRadius()}`}
                  style={{ backgroundColor: config.surfaceColor }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {rev.clientAvatar || rev.clientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-[#103438]">{rev.clientName}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                            Verified Client
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{rev.serviceName}</span>
                      </div>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-slate-400 space-y-1.5">
          <p className="font-medium">Direct bookings &amp; orders • 0% platform transaction take-rate</p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <span>Powered by</span>
            <Link href="/" className="font-['Disolve'] font-bold text-[#105F68] hover:underline">
              ovel
            </Link>
          </div>
        </div>
      </div>

      {/* Booking / Ordering Checkout Modal */}
      {selectedOffering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto ${getCardRadius()}`}
            style={{ backgroundColor: config.surfaceColor, color: config.textColor }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {selectedOffering.type === "order" ? "Custom Order Intake" : "Reserve Time Slot"}
                </span>
                <h3 className="text-lg font-bold" style={{ color: config.primaryColor }}>
                  {selectedOffering.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Total: ${(selectedOffering.priceCents / 100).toFixed(2)}
                  {selectedOffering.depositCents > 0 && ` • Deposit: $${(selectedOffering.depositCents / 100).toFixed(2)}`}
                </p>
              </div>

              <button
                onClick={() => { playClick(); setSelectedOffering(null); setStep(1); }}
                className="p-2 rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: TIME SLOT OR ORDER QUANTITY */}
            {step === 1 && selectedOffering.requiresTimeSlot && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-slate-700">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-slate-700">
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
                          className={`p-3 rounded-2xl text-xs font-mono font-semibold transition-all border ${
                            isSlotActive
                              ? "text-white shadow-md shadow-[#105F68]/20"
                              : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                          }`}
                          style={{
                            backgroundColor: isSlotActive ? config.primaryColor : undefined,
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
                    className="px-6 py-3 rounded-full text-xs font-semibold text-white shadow-md shadow-[#105F68]/20 flex items-center gap-2 hover:opacity-95 transition-all"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <span>Continue to Client Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: QUANTITY & NOTES (FOR ORDERS) OR INTAKE DETAILS */}
            {(step === 2 || (step === 1 && !selectedOffering.requiresTimeSlot)) && (
              <form onSubmit={handleConfirmAction} className="space-y-4">
                {selectedOffering.type === "order" && (
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                          className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="font-mono text-sm font-bold text-[#103438]">{orderQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setOrderQuantity(orderQuantity + 1)}
                          className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold block mb-1 text-slate-600">
                        Custom Instructions / Delivery Preferences
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Include custom inscription, preferred delivery hour, or color specifications..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Your Contact &amp; Booking Details
                  </h4>

                  <div>
                    <label className="text-[11px] font-medium block mb-1 text-slate-600">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jordan Mitchell"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600">Email Address</label>
                      <input
                        type="email"
                        placeholder="jordan@example.com"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1 text-slate-600">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Logic Intake Form */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label htmlFor="sensitivityToggle" className="text-xs font-medium cursor-pointer text-slate-700">
                      Special requests or skin/treatment sensitivities?
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
                        placeholder="Please detail your sensitivities, allergies, or preferences..."
                        value={sensitivityDetails}
                        onChange={(e) => setSensitivityDetails(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all"
                      />
                    </div>
                  )}

                  {/* Reference Photo Upload */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="font-semibold block text-slate-700">Reference / Inspiration Photo</span>
                        <span className="text-[10px] text-slate-500 font-medium">Attach photo with your request</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setReferencePhotoAttached(!referencePhotoAttached);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        referencePhotoAttached
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {referencePhotoAttached ? "✓ Photo Attached" : "+ Upload Photo"}
                    </button>
                  </div>
                </div>

                {/* Service + Retail Add-to-Cart */}
                {retailOfferings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#105F68]" />
                        <span>Retail Add-Ons (Checkout Upsell)</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Products &amp; Items</span>
                    </div>

                    <div className="space-y-1.5">
                      {retailOfferings.map((item) => {
                        const isChecked = !!selectedRetailAddons[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleRetailAddon(item.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                              isChecked
                                ? "bg-slate-100/70 border-slate-400 font-semibold text-[#103438]"
                                : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                                isChecked ? "bg-[#105F68] border-[#105F68] text-white" : "border-slate-300"
                              }`}>
                                {isChecked && "✓"}
                              </div>
                              <span>{item.name}</span>
                            </div>
                            <span className="font-bold">+${(item.priceCents / 100).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Base Service / Item Total</span>
                    <span className="font-semibold text-slate-800">
                      ${((selectedOffering.priceCents * orderQuantity) / 100).toFixed(2)}
                    </span>
                  </div>

                  {selectedRetailTotal > 0 && (
                    <div className="flex justify-between text-[#105F68] font-semibold">
                      <span>Retail Add-Ons Total</span>
                      <span>+${(selectedRetailTotal / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-sm text-[#103438]">
                    <span>Grand Total</span>
                    <span>
                      ${(((selectedOffering.priceCents * orderQuantity) + selectedRetailTotal) / 100).toFixed(2)}
                    </span>
                  </div>

                  {selectedOffering.depositCents > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Deposit Due Now (Card on File)</span>
                      <span>${((selectedOffering.depositCents * orderQuantity) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/60 font-medium">
                    <span>Ovel Commission Fee</span>
                    <span>$0.00 (0% Flat Rate)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full text-xs font-semibold text-white shadow-md shadow-[#105F68]/20 flex items-center gap-2 hover:opacity-95 transition-all"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <span>Confirm &amp; Place Request</span>
                    <ArrowRight className="w-4 h-4" />
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
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                    Thank you, <b>{clientName}</b>! Your request for <b>{selectedOffering.name}</b> has been locked in with {config.businessName}.
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date &amp; Slot:</span>
                    <span className="font-semibold text-slate-800">{selectedDate} @ {selectedTimeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client Contact:</span>
                    <span className="font-semibold text-slate-800">{clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference Token:</span>
                    <span className="font-mono font-bold text-[#105F68]">{confirmationToken || "tok_confirmed"}</span>
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
                      className="px-5 py-3 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-sm"
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
                    className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl border border-black/10 text-center font-sans">
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
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Send your link to customers or embed on Instagram bio &amp; WhatsApp.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono break-all text-[#105F68] select-all font-medium">
              https://ovel.app/l/{config.slug}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all flex items-center justify-center gap-2 shadow-sm"
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
                  className="w-full py-3 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
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
