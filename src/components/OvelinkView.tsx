"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
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
  MessageSquare,
  Calendar,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
  Send,
  CheckCircle,
  Search,
  Camera,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ThumbsUp
} from "lucide-react";
import {
  OvelinkCustomization,
  OvelinkOffering,
  OfferingType
} from "@/lib/ovelink-store";
import {
  getReviews,
  INITIAL_REVIEWS,
  submitCustomerReview,
  getReputationConfig,
  DEFAULT_REPUTATION_CONFIG,
  CustomerReview
} from "@/lib/reviews-store";
import { useAudio } from "@/components/AudioController";
import ThemeFontLoader from "@/components/ThemeFontLoader";
import { addDaysLocal, addMinutes, displayTimeToIsoLocal, localDateString } from "@/lib/booking-time";
import {
  createBooking,
  DEFAULT_WORKING_HOURS,
  getBookings,
  INITIAL_BOOKINGS,
  getCategories,
  UniversalCategory
} from "@/lib/platform-store";
import { computeAvailableSlots } from "@/lib/slot-engine";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { formatCurrency } from "@/lib/currency";
import { getActiveClientSession, clearActiveClientSession, registerOrLoginClient, ClientAccount } from "@/lib/client-auth";
import ClientAuthModal from "@/components/ClientAuthModal";
import { getMerchantSubscription } from "@/lib/subscription-store";
import { getOvelinkUrl, getOvelinkDisplay, PRIMARY_DOMAIN } from "@/lib/domain";
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet";

export interface OvelinkViewProps {
  config: OvelinkCustomization;
  isEmbedPreview?: boolean; // When rendered inside the live studio frame
  previewDevice?: "mobile" | "desktop";
  onOfferingClick?: (offering: OvelinkOffering) => void;
  onBookingCreated?: (bookingId: string) => void;
  onEditBanner?: () => void;
}

export default function OvelinkView({
  config,
  isEmbedPreview = false,
  previewDevice,
  onBookingCreated,
  onEditBanner,
}: OvelinkViewProps) {
  const isMobileOnly = isEmbedPreview && previewDevice !== "desktop";
  const [searchQuery, setSearchQuery] = useState("");
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const { playClick, playSuccess } = useAudio();
  const [clientSession, setClientSession] = useState<ClientAccount | null>(() => getActiveClientSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const subscription = useMemo(() => {
    return getMerchantSubscription(config.organizationId || config.slug);
  }, [config.organizationId, config.slug]);
  const hasVerificationBadge = subscription.hasVerificationBadge;
  const [activeFilter, setActiveFilter] = useState<"all" | OfferingType>("all");
  const [selectedOffering, setSelectedOffering] = useState<OvelinkOffering | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: offering details, 2: schedule/order specifics, 3: client intake, 4: confirmed

  const hydrated = useHydrated();
  const targetWs = config.organizationId || config.slug;
  const bookings = useClientStore(() => getBookings(targetWs), () => INITIAL_BOOKINGS);
  const minNotice = typeof config.minNoticeDays === "number" ? config.minNoticeDays : 1;
  const tomorrowStr = hydrated ? addDaysLocal(new Date(), minNotice) : "";
  const [selectedDate, setSelectedDate] = useState("");
  const dateValue = selectedDate || tomorrowStr;
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Order selection
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderNotes, setOrderNotes] = useState<string>("");

  // Client Details
  const [clientName, setClientName] = useState(() => clientSession?.fullName || "");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState(() => clientSession?.phone || "");
  const [confirmationToken, setConfirmationToken] = useState("");

  // Retail Upsell state
  const [selectedRetailAddons, setSelectedRetailAddons] = useState<Record<string, boolean>>({});

  // Conditional Logic Intake & Reference Photo state
  const [hasSensitivity, setHasSensitivity] = useState(false);
  const [sensitivityDetails, setSensitivityDetails] = useState("");
  const [referencePhotoAttached, setReferencePhotoAttached] = useState(false);

  // Categories & Subcategories
  const categories = useClientStore(() => getCategories(targetWs), () => []);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<any | null>(null);
  const [copiedOfferingId, setCopiedOfferingId] = useState<string | null>(null);

  // Sorting & Pagination
  const [sortOption, setSortOption] = useState<"featured" | "price-asc" | "price-desc" | "name-asc" | "name-desc">("featured");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Social Proof Reviews
  const reviews = useClientStore(() => getReviews(targetWs), () => INITIAL_REVIEWS);
  const reputationConfig = useClientStore(() => getReputationConfig(targetWs), () => DEFAULT_REPUTATION_CONFIG);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewAuthor, setReviewAuthor] = useState(() => clientSession?.fullName || "");
  const [reviewContact, setReviewContact] = useState(() => clientSession?.phone || "");
  const [reviewService, setReviewService] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Deep Link Auto-Focus & Open from URL (?product=[id] or ?service=[id])
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const search = new URLSearchParams(window.location.search);
      const prodParam = search.get("product");
      const servParam = search.get("service");
      const targetId = prodParam || servParam;
      if (targetId && config.offerings && config.offerings.length > 0) {
        const found = config.offerings.find((o) => o.id === targetId || o.slug === targetId);
        if (found) {
          setSelectedOffering(found);
          setSelectedSubCategory(found.subCategories && found.subCategories.length > 0 ? found.subCategories[0] : null);
          setStep(found.requiresTimeSlot ? 1 : 2);
          setTimeout(() => {
            const el = document.getElementById(`offering-card-${found.id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 350);
        }
      }
    } catch {
      // ignore
    }
  }, [config.offerings]);

  // Share / QR Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const staffId = `st_${config.slug}`;
  const openSlots = useMemo(() => {
    if (!hydrated || !selectedOffering?.requiresTimeSlot || !dateValue) return [];
    const duration = selectedSubCategory?.durationMinutes || selectedOffering.durationMinutes || 60;
    return computeAvailableSlots({
      date: dateValue,
      serviceDurationMinutes: duration,
      bufferAfterMinutes: 15,
      workingHours: DEFAULT_WORKING_HOURS,
      existingBookings: bookings.filter((booking) => booking.staffId === staffId),
    }).filter((slot) => slot.available);
  }, [hydrated, selectedOffering, selectedSubCategory, dateValue, bookings, staffId]);
  const activeSlot = openSlots.some((slot) => slot.time === selectedTimeSlot)
    ? selectedTimeSlot
    : (openSlots[0]?.time ?? "");
  const retailOfferings = useMemo(() => {
    const list = (config.offerings || []).filter((o) => o.type === "order" && o.id !== selectedOffering?.id && o.isActive !== false);
    const seen = new Set<string>();
    return list.filter((o) => {
      if (!o?.id || seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
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

  const availableOfferingTypes = useMemo(() => {
    const types = new Set((config.offerings || []).filter((o) => o.isActive !== false).map((o) => o.type));
    return Array.from(types);
  }, [config.offerings]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    (config.offerings || []).forEach((o) => {
      if (o.category && o.isActive !== false) set.add(o.category);
    });
    (categories || []).forEach((c) => {
      if (c && c.name) set.add(c.name);
    });
    return Array.from(set);
  }, [config.offerings, categories]);

  const filteredOfferings = useMemo(() => {
    const all = (config.offerings || []).filter((o) => o.isActive !== false);
    const seen = new Set<string>();
    const unique = all.filter((o) => {
      if (!o?.id || seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });

    return unique.filter((o) => {
      const matchesType = activeFilter === "all" || o.type === activeFilter;
      const matchesCategory =
        selectedCategory === "all" ||
        (o.category && o.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (o.categoryId && categories.find((c) => c.id === o.categoryId)?.name.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch =
        !searchQuery.trim() ||
        o.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchQuery.trim().toLowerCase())) ||
        (o.category && o.category.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [config.offerings, activeFilter, selectedCategory, categories, searchQuery]);

  // Reset to page 1 whenever search, category, type filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, activeFilter, sortOption]);

  const sortedOfferings = useMemo(() => {
    const list = [...filteredOfferings];
    switch (sortOption) {
      case "price-asc":
        return list.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0));
      case "price-desc":
        return list.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0));
      case "name-asc":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "name-desc":
        return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      case "featured":
      default:
        return list;
    }
  }, [filteredOfferings, sortOption]);

  const totalPages = Math.ceil(sortedOfferings.length / itemsPerPage) || 1;
  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOfferings.slice(start, start + itemsPerPage);
  }, [sortedOfferings, currentPage, itemsPerPage]);

  const handleSelectOffering = (off: OvelinkOffering) => {
    playClick();
    setSelectedOffering(off);
    setSelectedSubCategory(off.subCategories && off.subCategories.length > 0 ? off.subCategories[0] : null);
    setStep(off.requiresTimeSlot ? 1 : 2);
  };

  const handleCopyLink = () => {
    playClick();
    const url = getOvelinkUrl(config.slug);
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyOfferingLink = (e: React.MouseEvent, off: OvelinkOffering) => {
    e.stopPropagation();
    playClick();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ovel.lk";
    const paramKey = off.type === "order" ? "product" : "service";
    const url = `${origin}/l/${config.slug}?${paramKey}=${off.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedOfferingId(off.id);
    setTimeout(() => setCopiedOfferingId(null), 2500);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    playSuccess();
    const serviceName = reviewService || (config.offerings?.[0]?.name ?? "Client Experience");
    submitCustomerReview(
      {
        bookingId: `bkg_direct_${Date.now()}`,
        clientName: reviewAuthor.trim(),
        clientAvatar: reviewAuthor.trim().substring(0, 2).toUpperCase(),
        rating: reviewRating,
        serviceName,
        comment: reviewComment.trim(),
        status: "published",
      },
      targetWs
    );
    setReviewSubmitted(true);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !clientName || !clientPhone) {
      setIsAuthModalOpen(true);
      return;
    }
    const derivedEmail = clientEmail || `${clientPhone.replace(/[^0-9]/g, "")}@client.ovel.lk`;
    const quantity = selectedOffering.type === "order" ? orderQuantity : 1;
    const basePriceCents = (selectedSubCategory && typeof selectedSubCategory.priceCents === "number")
      ? selectedSubCategory.priceCents
      : selectedOffering.priceCents;
    const totalCents = basePriceCents * quantity + selectedRetailTotal;
    const depositCents = selectedOffering.depositCents * quantity;
    let startTime: string;
    let endTime: string | null;
    if (selectedOffering.requiresTimeSlot) {
      if (!activeSlot) {
        setBookingError("Choose an open time.");
        return;
      }
      const start = displayTimeToIsoLocal(dateValue, activeSlot);
      const duration = selectedSubCategory?.durationMinutes || selectedOffering.durationMinutes || 60;
      endTime = start ? addMinutes(start, duration) : null;
      if (!start || !endTime) {
        setBookingError("Choose an open time.");
        return;
      }
      startTime = start;
    } else {
      const now = new Date();
      startTime = `${localDateString(now)}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      endTime = addMinutes(startTime, 30);
      if (!endTime) return;
    }

    const account = registerOrLoginClient(clientName, clientPhone);
    setClientSession(account);

    const displayName = selectedSubCategory
      ? `${selectedOffering.name} — ${selectedSubCategory.name}`
      : selectedOffering.name;

    const booking = createBooking({
      serviceId: selectedOffering.id,
      serviceName: displayName,
      staffId,
      staffName: config.businessName,
      clientName,
      clientEmail: derivedEmail,
      clientPhone,
      startTime,
      endTime,
      status: depositCents > 0 && depositCents < totalCents ? "pending_deposit" : "confirmed",
      totalPriceCents: totalCents,
      depositPaidCents: Math.min(depositCents, totalCents),
      notes: [
        orderNotes,
        selectedSubCategory ? `Option/Variant: ${selectedSubCategory.name}` : null,
      ].filter(Boolean).join(" | ") || undefined,
    }, { checkConflicts: Boolean(selectedOffering.requiresTimeSlot) });

    if (!booking) {
      setBookingError("That time was just taken. Pick another slot.");
      return;
    }
    playSuccess();
    setBookingError(null);
    setConfirmationToken(booking.rescheduleToken);
    if (onBookingCreated) {
      onBookingCreated(booking.id);
    }
    setStep(4);
  };

  const getCardRadius = () => {
    return config.cardRadius || "rounded-3xl";
  };

  return (
    <div
      id="ovelink-view-root"
      ref={viewContainerRef}
      className={`min-h-screen w-full flex flex-col justify-between font-sans antialiased transition-colors duration-300 relative selection:bg-[#105F68] selection:text-white`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontFamily: config.fontFamily,
      }}
    >
      <ThemeFontLoader family={config.fontFamily} />
      {/* Cover Banner with isolated stacking context */}
      <div
        className={`w-full bg-gradient-to-r ${config.coverGradient} relative ${
          isMobileOnly ? "h-32" : "h-44 sm:h-56 lg:h-64 xl:h-72"
        } transition-all duration-300 bg-cover bg-center overflow-hidden isolate`}
        style={config.coverImageUrl ? { backgroundImage: `url(${config.coverImageUrl})` } : undefined}
      >
        {/* Ambient luxury light sheen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Bar Container - pointer-events-none on wrapper so it never blocks elements beneath */}
        <div
          className={`${
            isMobileOnly
              ? "max-w-xl px-4 sm:px-6"
              : "max-w-xl lg:max-w-6xl xl:max-w-7xl px-4 sm:px-6 lg:px-8"
          } mx-auto flex items-start justify-between pt-4 sm:pt-6 relative z-10 pointer-events-none`}
        >
          {/* Powered by Ovel Tag */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium hover:bg-black/35 transition-all shadow-sm group pointer-events-auto"
          >
            <span className="opacity-80">powered by</span>
            <span className="font-['Disolve'] font-bold tracking-wide">Ovel</span>
          </Link>

          {/* Banner Actions: Edit Banner & Share Button */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {onEditBanner && (
              <button
                type="button"
                onClick={() => { playClick(); onEditBanner(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/30 text-white text-[11px] font-medium transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                title="Edit Cover Banner"
              >
                <Camera className="w-3.5 h-3.5 text-[#63C1BB]" />
                <span>Edit Banner</span>
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={() => { playClick(); setIsShareModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium hover:bg-black/35 transition-all shadow-sm cursor-pointer"
              title="Share Ovelink"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container - relative z-20 so all interactive elements remain clickable above banner */}
      <div
        className={`${
          isMobileOnly
            ? "max-w-xl -mt-12 pb-8 px-4 sm:px-6"
            : "max-w-xl lg:max-w-6xl xl:max-w-7xl -mt-16 sm:-mt-20 lg:-mt-24 xl:-mt-28 pb-16 px-4 sm:px-6 lg:px-8"
        } mx-auto relative z-20 flex-1 w-full`}
      >
        <div className={isMobileOnly ? "space-y-4" : "lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 lg:items-start"}>

          {/* Left Column: Business Profile Sidebar (Sticky on Large Screens) */}
          <div className={isMobileOnly ? "" : "lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 space-y-4"}>
            <div
              className={`p-5 sm:p-6 lg:p-7 shadow-sm border border-black/[0.06] relative transition-all bg-white ${getCardRadius()}`}
              style={{ backgroundColor: config.surfaceColor }}
            >
              {/* Centered Avatar + Verified Shield */}
              <div className="flex flex-col items-center text-center">
                <div className="relative -mt-12 sm:-mt-14 lg:-mt-16 mb-3">
                  <div
                    className="w-20 h-20 sm:w-22 sm:h-22 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md border-4 border-white transition-transform overflow-hidden"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {config.avatarUrl || config.logoUrl ? (
                      <img
                        src={config.avatarUrl || config.logoUrl}
                        alt={config.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      config.avatarInitials
                    )}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#105F68] border-2 border-white flex items-center justify-center shadow-xs"
                    title="Verified Merchant"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#63C1BB]" />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
                  <span
                    className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: `${config.accentColor}20`, color: config.primaryColor }}
                  >
                    {config.businessCategory}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Instant Confirmation
                  </span>
                </div>

                {/* Business Title & Tagline */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h1
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight"
                    style={{ fontFamily: config.fontFamily }}
                  >
                    {config.businessName}
                  </h1>
                  {hasVerificationBadge && (
                    <span
                      title="Verified Ovel Merchant"
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#105F68] text-[#63C1BB] shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {config.businessTagline && (
                  <p className="text-xs sm:text-sm text-[#105F68] font-medium mt-1 max-w-sm mx-auto leading-snug">
                    {config.businessTagline}
                  </p>
                )}

                {/* Bio */}
                {config.businessBio && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2.5 max-w-md mx-auto font-normal">
                    {config.businessBio}
                  </p>
                )}

                {/* Social & Contact Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
                  {config.location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                      <span className="truncate max-w-[180px]">{config.location}</span>
                    </span>
                  )}

                  {config.whatsappNumber && (
                    <a
                      href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {config.email && (
                    <a
                      href={`mailto:${config.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-white transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#105F68]" />
                      <span>Email</span>
                    </a>
                  )}

                  {config.instagramHandle && (
                    <a
                      href={`https://instagram.com/${config.instagramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                    >
                      <span>{config.instagramHandle}</span>
                    </a>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-[11px] font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#105F68]" />
                    <span>{copiedLink ? "Link Copied!" : getOvelinkDisplay(config.slug)}</span>
                  </button>
                </div>

                {/* Desktop-only quick action buttons in sidebar */}
                {!isMobileOnly && (
                  <div className="hidden lg:grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100 w-full text-xs">
                    <button
                      type="button"
                      onClick={() => { playClick(); setIsShareModalOpen(true); }}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#105F68]" />
                      <span>Share Store</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setReviewSubmitted(false);
                        setIsWriteReviewOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl font-medium text-white shadow-2xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Review</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop-only Verified Trust Card */}
            {!isMobileOnly && (
              <div
                className={`hidden lg:block p-4 shadow-2xs border border-black/[0.04] text-xs space-y-2 bg-white/90 backdrop-blur-xs ${getCardRadius()}`}
                style={{ backgroundColor: config.surfaceColor }}
              >
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#105F68]" />
                  <span>Verified Direct Booking</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Direct appointment intake, reservations, and retail merchandise orders with instant merchant confirmation.
                </p>
                {reviews.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Reputation Rating</span>
                    <span className="font-bold text-amber-700 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Catalog Feed, Search, Filter Pills & Reviews */}
          <div className={isMobileOnly ? "mt-5 space-y-5" : "mt-6 lg:mt-0 lg:col-span-7 xl:col-span-8 space-y-6"}>

            {/* Catalog Toolbar Card */}
            <div
              className={`p-4 sm:p-5 shadow-xs border border-black/[0.05] bg-white space-y-3.5 relative z-10 ${getCardRadius()}`}
              style={{ backgroundColor: config.surfaceColor }}
            >
              {/* Offering Type Filter Tabs */}
              {availableOfferingTypes.length > 1 && (
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {[
                    { id: "all" as const, label: "All Offerings" },
                    { id: "appointment" as const, label: "Services & Appointments" },
                    { id: "booking" as const, label: "Bookings & Slots" },
                    { id: "order" as const, label: "Products & Orders" },
                  ]
                    .filter((tab) => tab.id === "all" || availableOfferingTypes.includes(tab.id))
                    .map((tab) => {
                      const isActive = activeFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => { playClick(); setActiveFilter(tab.id); }}
                          className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all rounded-full cursor-pointer select-none ${
                            isActive
                              ? "text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-transparent shadow-2xs"
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
              )}

              {/* Search Bar + Sort Control */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search offerings, services, or products..."
                    className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all cursor-text relative z-10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer z-20 w-4 h-4 flex items-center justify-center"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Sort Option Control */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 focus-within:border-[#105F68] transition-all">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <label htmlFor="catalog-sort" className="text-[11px] text-slate-500 font-medium hidden md:inline shrink-0">
                      Sort:
                    </label>
                    <select
                      id="catalog-sort"
                      value={sortOption}
                      onChange={(e) => {
                        playClick();
                        setSortOption(e.target.value as any);
                      }}
                      className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="featured">Featured / Default</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories Navigation Pills */}
              {uniqueCategories.length > 0 && (
                <div
                  className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 hide-scrollbar scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <button
                    type="button"
                    onClick={() => { playClick(); setSelectedCategory("all"); }}
                    className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-xl transition-all cursor-pointer select-none ${
                      selectedCategory === "all"
                        ? "bg-slate-900 text-white shadow-2xs font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    All Categories
                  </button>
                  {uniqueCategories.map((catName) => {
                    const isCatActive = selectedCategory.toLowerCase() === catName.toLowerCase();
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => { playClick(); setSelectedCategory(catName); }}
                        className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                          isCatActive
                            ? "text-white shadow-2xs font-semibold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                        style={{
                          backgroundColor: isCatActive ? config.primaryColor : undefined,
                        }}
                      >
                        <Tag className="w-2.5 h-2.5 opacity-70" />
                        <span>{catName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Catalog Results Header (Count & Active Filters Indicator) */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {sortedOfferings.length === 0
                    ? 0
                    : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                        currentPage * itemsPerPage,
                        sortedOfferings.length
                      )}`}
                </span>{" "}
                of <span className="font-semibold text-slate-800">{sortedOfferings.length}</span>{" "}
                {sortedOfferings.length === 1 ? "offering" : "offerings"}
              </span>

              {(searchQuery || selectedCategory !== "all" || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setActiveFilter("all");
                  }}
                  className="text-[11px] text-[#105F68] hover:underline font-medium cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Offerings Grid: Single column on small screens, 2-column grid on large screens */}
            <div className={isMobileOnly ? "space-y-3.5" : "grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-4.5"}>
              {sortedOfferings.length === 0 ? (
                <div className={`py-10 px-6 bg-white border border-slate-200/70 text-center space-y-2.5 shadow-xs select-none ${isMobileOnly ? "" : "sm:col-span-2"} ${getCardRadius()}`}>
                  <img
                    src="/animations/emptyfiles.svg"
                    alt="No results"
                    className="w-28 h-28 mx-auto object-contain pointer-events-none mb-1"
                  />
                  <h3 className="text-sm font-semibold text-slate-800">No Items Found</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    No offerings match the current search or filter. Try clearing your search or selecting a different category.
                  </p>
                </div>
              ) : (
                paginatedOfferings.map((off, idx) => {
                  const isSelected = selectedOffering?.id === off.id;
                  const cardImage = off.imageUrl || (off.imageUrls && off.imageUrls[0]);
                  const isCopied = copiedOfferingId === off.id;
                  const isOutOfStock = off.type === "order" && typeof off.stockCount === "number" && off.stockCount === 0;
                  const isLowStock = off.type === "order" && typeof off.stockCount === "number" && off.stockCount > 0 && off.stockCount <= 5;
                  const isGoodStock = off.type === "order" && typeof off.stockCount === "number" && off.stockCount > 5;

                  return (
                    <div
                      key={`${off.id}_${idx}`}
                      id={`offering-card-${off.id}`}
                      onClick={() => handleSelectOffering(off)}
                      className={`p-4 sm:p-5 bg-white border transition-all duration-200 cursor-pointer relative group hover:shadow-[0_12px_30px_rgba(16,95,104,0.08)] hover:-translate-y-0.5 flex flex-col justify-between ${getCardRadius()} ${
                        isSelected ? "ring-2 ring-[#105F68] border-transparent" : "border-slate-200/70 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                      }`}
                      style={{ backgroundColor: config.surfaceColor }}
                    >
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        {/* Offering Thumbnail or Branded Monogram */}
                        {cardImage ? (
                          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 border border-black/[0.06] shadow-2xs relative bg-slate-100">
                            <img
                              src={cardImage}
                              alt={off.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {off.type === "order" && (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider">
                                Product
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-black/[0.04] text-white p-2 text-center"
                            style={{
                              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor || "#63C1BB"})`
                            }}
                          >
                            <span className="font-bold text-base sm:text-lg uppercase tracking-tight">
                              {off.name.substring(0, 2)}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-85 mt-0.5">
                              {off.type === "order" ? "Item" : "Service"}
                            </span>
                          </div>
                        )}

                        {/* Offering Details */}
                        <div className="flex-1 min-w-0">
                          {/* Header Row: Badges, Category, Direct Link Share */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {off.badge && (
                                <span
                                  className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                                  style={{ backgroundColor: `${config.accentColor}25`, color: config.primaryColor }}
                                >
                                  {off.badge}
                                </span>
                              )}
                              {off.category && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full">
                                  <Tag className="w-2.5 h-2.5 text-[#105F68]" />
                                  <span>{off.category}</span>
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                  Out of Stock
                                </span>
                              )}
                              {isLowStock && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  Only {off.stockCount} left
                                </span>
                              )}
                              {isGoodStock && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  In Stock
                                </span>
                              )}
                            </div>

                            {/* Direct Product Link Share Button */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyOfferingLink(e, off)}
                              title={isCopied ? "Link Copied!" : "Copy Direct Link"}
                              className={`p-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                                isCopied
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs"
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5 text-[#105F68]" />
                              )}
                            </button>
                          </div>

                          {/* Name & Description */}
                          <div className="mt-1">
                            <h3 className="text-sm sm:text-base font-bold text-[#103438] group-hover:text-[#105F68] transition-colors leading-snug">
                              {off.name}
                            </h3>
                            <p className="text-xs text-slate-600 font-normal mt-1 line-clamp-2 leading-relaxed">
                              {off.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold tracking-tight text-[#103438]">
                            {off.pricingType === "range" && off.priceMaxCents && off.priceMaxCents > off.priceCents
                              ? `${formatCurrency(off.priceCents, config.currency)} – ${formatCurrency(off.priceMaxCents, config.currency)}`
                              : formatCurrency(off.priceCents, config.currency)}
                          </span>

                          {off.durationMinutes && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-[#105F68]" />
                              <span>{off.durationMode === "around" ? "~" : ""}{off.durationMinutes}m</span>
                            </span>
                          )}

                          {off.depositCents > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{formatCurrency(off.depositCents, config.currency)} dep</span>
                            </span>
                          )}
                        </div>

                        <button
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectOffering(off);
                          }}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer ${
                            isOutOfStock ? "bg-slate-300 cursor-not-allowed text-slate-500" : "hover:opacity-95"
                          }`}
                          style={{ backgroundColor: !isOutOfStock ? config.primaryColor : undefined }}
                        >
                          <span>{isOutOfStock ? "Unavailable" : off.type === "order" ? "Order Now" : "Book Slot"}</span>
                          {!isOutOfStock && <ArrowRight className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-black/[0.06] select-none">
                <p className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-800">{currentPage}</span> of{" "}
                  <span className="font-semibold text-slate-800">{totalPages}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isCurrent = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => {
                            playClick();
                            setCurrentPage(pageNum);
                          }}
                          className={`w-7 h-7 rounded-xl text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                            isCurrent
                              ? "bg-[#105F68] text-white shadow-xs font-bold"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Verified Customer Reviews & Social Proof Module */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Verified Social Proof
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#103438]">
                    Client Experiences &amp; Ratings
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                      <span className="text-[11px] text-amber-800/80 font-medium">
                        ({reviews.length} verified)
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setReviewSubmitted(false);
                      setIsWriteReviewOpen(true);
                    }}
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>Write a Review</span>
                  </button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div
                  className={`p-6 bg-white border border-slate-200/70 text-center space-y-2.5 shadow-2xs ${getCardRadius()}`}
                  style={{ backgroundColor: config.surfaceColor }}
                >
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[#103438]">
                    Be the first to leave a review for {config.businessName}!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Share your client experience to help others discover this business.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setReviewSubmitted(false);
                      setIsWriteReviewOpen(true);
                    }}
                    className="mt-1 px-4 py-2 rounded-full text-xs font-semibold text-white inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Submit Experience Review</span>
                  </button>
                </div>
              ) : (
                <div className={isMobileOnly ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3.5"}>
                  {reviews.slice(0, 4).map((rev) => (
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

                      {rev.merchantReply && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                          <span className="font-semibold text-[#105F68] block mb-0.5">Response from {config.businessName}:</span>
                          {rev.merchantReply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info anchored to bottom of page */}
      <footer className="mt-auto w-full py-8 text-center text-xs text-slate-400 space-y-1.5 border-t border-black/[0.04] bg-white/40 backdrop-blur-xs relative z-20">
        <div className="max-w-xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-medium text-slate-500">
            Direct bookings &amp; orders • 0% platform transaction take-rate
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-1">
            <span>Powered by</span>
            <Link href="/" className="font-['Disolve'] font-bold text-[#105F68] hover:underline">
              Ovel
            </Link>
          </div>
        </div>
      </footer>

      {/* Booking / Ordering Checkout Bottom Sheet */}
      <BottomSheet
        open={Boolean(selectedOffering)}
        onOpenChange={(open) => {
          if (!open) {
            playClick();
            setSelectedOffering(null);
            setSelectedSubCategory(null);
            setStep(1);
          }
        }}
        title={
          selectedOffering
            ? selectedOffering.type === "order"
              ? (config.orderModalTitle || "Custom Order Intake")
              : (config.bookingModalTitle || "Reserve Time Slot")
            : ""
        }
        description={
          selectedOffering
            ? `${selectedOffering.name} • Total: ${formatCurrency(
                ((selectedSubCategory && typeof selectedSubCategory.priceCents === "number")
                  ? selectedSubCategory.priceCents
                  : selectedOffering.priceCents) * (selectedOffering.type === "order" ? orderQuantity : 1),
                config.currency
              )}${selectedOffering.depositCents > 0 ? ` • Deposit: ${formatCurrency(selectedOffering.depositCents * (selectedOffering.type === "order" ? orderQuantity : 1), config.currency)}` : ""}`
            : undefined
        }
        detents={[0.92]}
        initialDetent={0}
        container={isEmbedPreview ? viewContainerRef.current : undefined}
      >
        {selectedOffering && (
          <div className="space-y-5 pt-1 pb-4" style={{ color: config.textColor }}>
            {/* Offering Subheading Info */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {selectedOffering.type === "order" ? "Product Deliverable" : "Scheduled Slot"}
                </span>
                {selectedOffering.category && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    • {selectedOffering.category}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-[#105F68] font-mono">
                {formatCurrency(
                  ((selectedSubCategory && typeof selectedSubCategory.priceCents === "number")
                    ? selectedSubCategory.priceCents
                    : selectedOffering.priceCents) * (selectedOffering.type === "order" ? orderQuantity : 1),
                  config.currency
                )}
              </span>
            </div>

            {/* Subcategories / Variant Selector */}
            {selectedOffering.subCategories && selectedOffering.subCategories.length > 0 && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#105F68]" />
                    <span>Choose Option / Category Variant</span>
                  </label>
                  {selectedSubCategory && (
                    <span className="text-[11px] font-bold text-[#105F68]">
                      {formatCurrency(selectedSubCategory.priceCents || selectedOffering.priceCents, config.currency)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedOffering.subCategories.map((sub: any) => {
                    const isSubSelected = selectedSubCategory?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setSelectedSubCategory(sub);
                        }}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          isSubSelected
                            ? "border-[#105F68] bg-[#105F68]/10 ring-1 ring-[#105F68]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{sub.name}</span>
                          <span className="text-xs font-semibold text-[#105F68]">
                            {formatCurrency(sub.priceCents || selectedOffering.priceCents, config.currency)}
                          </span>
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{sub.description}</p>
                        )}
                        {sub.durationMinutes && (
                          <span className="text-[10px] text-slate-400 font-medium block mt-1">
                            ⏱ {sub.durationMinutes} mins
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 1: TIME SLOT OR ORDER QUANTITY */}
            {step === 1 && selectedOffering.requiresTimeSlot && (
              <div className="space-y-4">
                {config.bookingInstructions && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#105F68] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{config.bookingInstructions}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-slate-700">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={dateValue}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold block text-slate-700">
                      {config.timeSlotLabel || "Available Time Slot"}
                    </label>
                    {config.slotDurationNotice && (
                      <span className="text-[10px] text-slate-400 font-medium">{config.slotDurationNotice}</span>
                    )}
                  </div>
                  {openSlots.length === 0 ? (
                    <p className="text-xs text-slate-500">No open times on this date. Try another day.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {openSlots.map((slot) => {
                        const isSlotActive = activeSlot === slot.time;
                        return (
                          <button
                            key={slot.isoString}
                            type="button"
                            onClick={() => { playClick(); setSelectedTimeSlot(slot.time); }}
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
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {config.cancellationPolicy && (
                  <p className="text-[11px] text-slate-400 italic">
                    ℹ️ {config.cancellationPolicy}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    disabled={!activeSlot}
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
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your Contact &amp; Booking Details
                    </h4>
                    {!clientSession && (
                      <button
                        type="button"
                        onClick={() => { playClick(); setIsAuthModalOpen(true); }}
                        className="text-[11px] font-bold text-[#105F68] hover:underline"
                      >
                        Sign In with Phone
                      </button>
                    )}
                  </div>

                  {clientSession ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#105F68] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          {clientSession.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">{clientSession.fullName}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full">
                              Signed In
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{clientSession.phone}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          clearActiveClientSession();
                          setClientSession(null);
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                      >
                        Switch
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#105F68]/5 border border-[#105F68]/15 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-600">
                        <span className="font-semibold text-[#105F68]">1-Tap Portal Access:</span> Sign in to track order status &amp; leave reviews.
                      </div>
                      <button
                        type="button"
                        onClick={() => { playClick(); setIsAuthModalOpen(true); }}
                        className="shrink-0 px-2.5 py-1 rounded-xl bg-[#105F68] text-white text-[11px] font-semibold hover:bg-[#0D4F57] transition-all"
                      >
                        Sign Up / In
                      </button>
                    </div>
                  )}

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
                      Special requests or specific preferences?
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
                      {retailOfferings.map((item, idx) => {
                        const isChecked = !!selectedRetailAddons[item.id];
                        return (
                          <div
                            key={`${item.id}_${idx}`}
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
                            <span className="font-bold">+{formatCurrency(item.priceCents, config.currency)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">
                      {selectedSubCategory ? `${selectedOffering.name} (${selectedSubCategory.name})` : "Base Item / Service Total"}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(((selectedSubCategory && typeof selectedSubCategory.priceCents === "number") ? selectedSubCategory.priceCents : selectedOffering.priceCents) * orderQuantity, config.currency)}
                    </span>
                  </div>

                  {selectedRetailTotal > 0 && (
                    <div className="flex justify-between text-[#105F68] font-semibold">
                      <span>Retail Add-Ons Total</span>
                      <span>+{formatCurrency(selectedRetailTotal, config.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200 text-sm text-[#103438]">
                    <span>Grand Total</span>
                    <span>
                      {formatCurrency((((selectedSubCategory && typeof selectedSubCategory.priceCents === "number") ? selectedSubCategory.priceCents : selectedOffering.priceCents) * orderQuantity) + selectedRetailTotal, config.currency)}
                    </span>
                  </div>

                  {selectedOffering.depositCents > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Deposit Due Now (Card on File)</span>
                      <span>{formatCurrency(selectedOffering.depositCents * orderQuantity, config.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/60 font-medium">
                    <span>Ovel Commission Fee</span>
                    <span>0% Take-Rate • Instant Settlement</span>
                  </div>
                </div>

                {bookingError && (
                  <p className="text-xs text-red-700">{bookingError}</p>
                )}

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
                    <span className="font-semibold text-slate-800">
                      {selectedOffering.requiresTimeSlot ? `${dateValue} @ ${activeSlot}` : `Qty ${orderQuantity}`}
                    </span>
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
                        `Hi ${config.businessName}! I just booked "${selectedOffering.name}"${selectedOffering.requiresTimeSlot ? ` for ${dateValue}` : ""} via your Ovelink. My name is ${clientName}. Ref ${confirmationToken}.`
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
        )}
      </BottomSheet>

      {/* Share Ovelink Bottom Sheet */}
      <BottomSheet
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        title={`Share ${config.businessName}`}
        description="Send your link to customers or embed on Instagram bio & WhatsApp."
        detents={[0.62, 0.88]}
        initialDetent={0}
        container={isEmbedPreview ? viewContainerRef.current : undefined}
      >
        <div className="bg-white text-zinc-900 p-2 sm:p-4 space-y-5 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center mx-auto shadow-xs">
            <QrCode className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-base font-bold text-[#105F68]">{config.businessName} Ovelink</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Scan with mobile camera or share the direct link below.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-mono break-all text-[#105F68] select-all font-medium">
            {getOvelinkUrl(config.slug)}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Link Copied to Clipboard!" : "Copy Ovelink"}</span>
            </button>

            {config.whatsappNumber && (
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Book appointments, slots or orders directly with ${config.businessName} here: ${getOvelinkUrl(config.slug)}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Write a Review Bottom Sheet */}
      <BottomSheet
        open={isWriteReviewOpen}
        onOpenChange={setIsWriteReviewOpen}
        title={`Rate & Review ${config.businessName}`}
        description="Customer Review & Verified Social Proof"
        detents={[0.85, 0.95]}
        initialDetent={0}
        container={isEmbedPreview ? viewContainerRef.current : undefined}
      >
        <div className="bg-white text-zinc-900 p-2 sm:p-4 space-y-4">
          {reviewSubmitted ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: config.primaryColor }}
              >
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#103438]">Thank You For Your Review!</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your verified feedback has been published and added to {config.businessName}&apos;s profile.
                </p>
              </div>

              {reviewRating >= 4 && (config.googleMapsReviewUrl || reputationConfig.googleMapsReviewUrl) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Boost On Google Maps</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Since you gave a <b>{reviewRating}-star rating</b>, would you like to also post this on Google Maps to help others discover this business?
                  </p>
                  <a
                    href={config.googleMapsReviewUrl || reputationConfig.googleMapsReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Post on Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(false)}
                className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Rating Stars Selector */}
              <div>
                <label className="text-xs font-semibold block mb-1.5 text-slate-700">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => { playClick(); setReviewRating(star as 1 | 2 | 3 | 4 | 5); }}
                      className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-1">
                    {reviewRating === 5
                      ? "5.0 - Exceptional"
                      : reviewRating === 4
                      ? "4.0 - Very Good"
                      : reviewRating === 3
                      ? "3.0 - Good"
                      : reviewRating === 2
                      ? "2.0 - Fair"
                      : "1.0 - Needs Improvement"}
                  </span>
                </div>
              </div>

              {/* Offering Dropdown */}
              {config.offerings && config.offerings.length > 0 && (
                <div>
                  <label className="text-xs font-semibold block mb-1 text-slate-700">
                    Service or Product Experienced
                  </label>
                  <select
                    value={reviewService}
                    onChange={(e) => setReviewService(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all font-medium"
                  >
                    <option value="">General Client Experience</option>
                    {config.offerings.map((off) => (
                      <option key={off.id} value={off.name}>
                        {off.name} ({off.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Author Name */}
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Mitchell"
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all font-medium"
                />
              </div>

              {/* Phone / Email for verification */}
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700">
                  Phone or Email (for Verification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0192 or jordan@example.com"
                  value={reviewContact}
                  onChange={(e) => setReviewContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all font-medium"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="text-xs font-semibold block mb-1 text-slate-700">Your Review &amp; Experience</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the quality, punctuality, or product results..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-[#105F68] transition-all font-medium leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow-md flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Verified Review</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </BottomSheet>
      <ClientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        businessName={config.businessName}
        onSuccess={(account) => {
          setClientSession(account);
          setClientName(account.fullName);
          setClientPhone(account.phone);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
