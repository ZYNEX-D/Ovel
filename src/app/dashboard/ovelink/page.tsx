"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Palette, 
  Type, 
  Smartphone, 
  Monitor, 
  Copy, 
  ExternalLink, 
  Save, 
  Building2, 
  ShoppingBag, 
  Phone, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Share2,
  Calendar,
  Clock,
  Info,
  Lock,
  ShieldAlert,
  RefreshCw,
  Star,
  Tag
} from "lucide-react";
import { 
  getOvelink, 
  PRESET_OVELINKS,
  saveOvelink, 
  OvelinkOffering, 
  OvelinkFont, 
  THEME_PRESETS, 
  OfferingType,
  OvelinkThemePreset,
  sanitizeSlug,
  validateSlug,
  syncCatalogOfferingsToOvelink
} from "@/lib/ovelink-store";
import { getReviews, INITIAL_REVIEWS, getReputationConfig, saveReputationConfig } from "@/lib/reviews-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import OvelinkView from "@/components/OvelinkView";
import { dollarsToCents } from "@/lib/booking-time";
import { useClientStore, useDraftStore } from "@/lib/use-client-store";
import { formatCurrency, getCurrencySymbol, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { PRIMARY_DOMAIN, DEV_DOMAIN, getOvelinkUrl, getOvelinkDisplay } from "@/lib/domain";
import { getMerchantSubscription, SUBSCRIPTION_PLANS } from "@/lib/subscription-store";

export default function OvelinkStudioPage() {
  const { profile, updateOrganizationDetails } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const defaultSlug = profile?.organizationSlug || "leclat";
  const [initialSlug, setInitialSlug] = useState<string>(defaultSlug);
  const storedOvelink = useClientStore(
    () => getOvelink(defaultSlug, profile?.organizationName, profile?.organizationId),
    () => PRESET_OVELINKS[defaultSlug] || PRESET_OVELINKS["leclat"],
  );
  const [activeOvelink, setActiveOvelink] = useDraftStore(storedOvelink);
  const slugValidation = useMemo(() => {
    return validateSlug(activeOvelink.slug, profile?.organizationId);
  }, [activeOvelink.slug, profile?.organizationId]);
  const [studioSubTab, setStudioSubTab] = useState<"branding" | "booking" | "offerings" | "reviews" | "themes" | "style" | "socials">("branding");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [isAddOfferingOpen, setIsAddOfferingOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [newSlotInput, setNewSlotInput] = useState("");

  // New Offering State
  const [newOffName, setNewOffName] = useState("");
  const [newOffType, setNewOffType] = useState<OfferingType>("appointment");
  const [newOffDesc, setNewOffDesc] = useState("");
  const [newOffPrice, setNewOffPrice] = useState(95);
  const [newOffDeposit, setNewOffDeposit] = useState(25);
  const [newOffDuration, setNewOffDuration] = useState(45);
  const [newOffBadge, setNewOffBadge] = useState("");
  const [newOffCategory, setNewOffCategory] = useState("General");

  const merchantTarget = profile?.organizationId || defaultSlug;
  const subscription = getMerchantSubscription(merchantTarget);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const reviews = useClientStore(() => getReviews(merchantTarget), () => INITIAL_REVIEWS);

  const handleCopyOvelink = () => {
    playClick();
    const url = getOvelinkUrl(activeOvelink.slug);
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Ovelink copied: ${getOvelinkDisplay(activeOvelink.slug)}`);
  };

  const handleSyncFromCatalog = () => {
    playSuccess();
    const synced = syncCatalogOfferingsToOvelink(activeOvelink, profile?.organizationId);
    setActiveOvelink(synced);
    saveOvelink(synced);
    showToast(`Synced ${synced.offerings.length} offerings from your Services, Products & Categories catalog!`);
  };

  const handleCopyOfferingLink = (offId: string, type: OfferingType) => {
    playClick();
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ovel.lk";
    const param = type === "order" ? "product" : "service";
    const url = `${origin}/l/${activeOvelink.slug}?${param}=${offId}`;
    navigator.clipboard?.writeText(url);
    showToast("Direct product link copied to clipboard!");
  };

  const handleSaveOvelinkSettings = async () => {
    const validation = validateSlug(activeOvelink.slug, profile?.organizationId);
    if (!validation.valid) {
      showToast(validation.error || "Please enter a valid URL handle.");
      return;
    }

    const cleanSlug = validation.cleanSlug;
    const previous = initialSlug;

    // Check database if handle is changing
    if (previous !== cleanSlug) {
      try {
        const checkRes = await fetch(`/api/slug/check?slug=${encodeURIComponent(cleanSlug)}`);
        const checkJson = await checkRes.json();
        if (!checkJson.available) {
          showToast(checkJson.error || `Handle "${cleanSlug}" is already taken.`);
          return;
        }
      } catch {
        // Continue if offline
      }
    }

    playSuccess();
    const sanitized = { ...activeOvelink, slug: cleanSlug };
    setActiveOvelink(sanitized);
    saveOvelink(sanitized, previous !== cleanSlug ? previous : undefined);
    setInitialSlug(cleanSlug);
    updateOrganizationDetails(sanitized.businessName, sanitized.slug);
    showToast(`Ovelink for "${sanitized.businessName}" saved & published!`);
  };

  const handleApplyThemePreset = (preset: OvelinkThemePreset) => {
    if (!subscription.hasThemeCustomization) {
      showToast("Theme customization is locked on Free plan. Upgrade to Growth (LKR 500/mo) in Settings > Plans.");
      return;
    }
    playClick();
    setActiveOvelink({
      ...activeOvelink,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
      surfaceColor: preset.surfaceColor,
      fontFamily: preset.fontFamily,
      coverGradient: preset.coverGradient,
    });
    showToast(`Applied "${preset.name}" preset`);
  };

  const handleSwitchOvelinkTemplate = (templateSlug: string) => {
    playClick();
    const selected = getOvelink(templateSlug);
    setActiveOvelink({
      ...selected,
      slug: activeOvelink.slug,
      businessName: activeOvelink.businessName || selected.businessName,
      avatarInitials: activeOvelink.avatarInitials || selected.avatarInitials,
      organizationId: activeOvelink.organizationId,
    });
    showToast(`Applied ${selected.businessName} layout & offerings to your link`);
  };

  const handleAddTimeSlot = (slot: string) => {
    const trimmed = slot.trim().toUpperCase();
    if (!trimmed) return;
    const current = activeOvelink.timeSlots || ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];
    if (current.includes(trimmed)) {
      showToast(`Slot "${trimmed}" already exists`);
      return;
    }
    const updated = [...current, trimmed];
    setActiveOvelink({ ...activeOvelink, timeSlots: updated });
    setNewSlotInput("");
    showToast(`Added time slot "${trimmed}"`);
  };

  const handleRemoveTimeSlot = (slotToRemove: string) => {
    const current = activeOvelink.timeSlots || [];
    if (current.length <= 1) {
      showToast("You must keep at least one available time slot");
      return;
    }
    const updated = current.filter((s) => s !== slotToRemove);
    setActiveOvelink({ ...activeOvelink, timeSlots: updated });
    showToast(`Removed slot "${slotToRemove}"`);
  };

  const handleApplySlotPreset = (presetSlots: string[], presetName: string) => {
    playClick();
    setActiveOvelink({ ...activeOvelink, timeSlots: presetSlots });
    showToast(`Applied "${presetName}" schedule`);
  };

  const handleCreateOffering = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = dollarsToCents(Number(newOffPrice));
    const depositCents = dollarsToCents(Number(newOffDeposit));
    const durationMinutes = Number(newOffDuration);
    if (!newOffName || priceCents == null || depositCents == null || depositCents > priceCents) return;
    if (newOffType !== "order" && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) return;
    playSuccess();

    const newOff: OvelinkOffering = {
      id: "off_" + Date.now().toString(36),
      type: newOffType,
      name: newOffName,
      description: newOffDesc || "Custom offering.",
      priceCents,
      depositCents,
      durationMinutes: newOffType !== "order" ? durationMinutes : undefined,
      requiresTimeSlot: newOffType !== "order",
      badge: newOffBadge || undefined,
      category: newOffCategory,
      isActive: true,
    };

    const updated = {
      ...activeOvelink,
      offerings: [...activeOvelink.offerings, newOff],
    };
    setActiveOvelink(updated);
    saveOvelink(updated);
    setIsAddOfferingOpen(false);
    setNewOffName("");
    setNewOffDesc("");
    setNewOffBadge("");
    showToast(`Added ${newOff.type}: "${newOff.name}" to Ovelink!`);
  };

  const handleToggleOffering = (offeringId: string) => {
    playClick();
    const updated = {
      ...activeOvelink,
      offerings: activeOvelink.offerings.map(o => o.id === offeringId ? { ...o, isActive: !o.isActive } : o),
    };
    setActiveOvelink(updated);
    saveOvelink(updated);
  };

  const handleRemoveOffering = (offeringId: string) => {
    playClick();
    const updated = {
      ...activeOvelink,
      offerings: activeOvelink.offerings.filter(o => o.id !== offeringId),
    };
    setActiveOvelink(updated);
    saveOvelink(updated);
    showToast("Offering removed from Ovelink");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Studio Header & Share Bar */}
      <div className="p-6 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light text-[#105F68] tracking-tight">
              Ovelink Studio (Customizer)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Live &amp; Synced
            </span>
          </div>
          <p className="text-xs text-[#3A9295] mt-1">
            Customize your brand colors, typography fonts, cover header, and catalog offerings.
          </p>
        </div>

        {/* Niche Presets Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#3A9295] hidden xl:inline text-[11px]">Niche Templates:</span>
          <button
            onClick={() => handleSwitchOvelinkTemplate("leclat")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              activeOvelink.slug === "leclat" ? "bg-[#105F68] text-white border-[#105F68]" : "bg-[#F6FAF9] text-[#105F68] border-black/10"
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => handleSwitchOvelinkTemplate("apex-studio")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              activeOvelink.slug === "apex-studio" ? "bg-[#105F68] text-white border-[#105F68]" : "bg-[#F6FAF9] text-[#105F68] border-black/10"
            }`}
          >
            Auto Lab
          </button>
          <button
            onClick={() => handleSwitchOvelinkTemplate("craft-bakes")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              activeOvelink.slug === "craft-bakes" ? "bg-[#105F68] text-white border-[#105F68]" : "bg-[#F6FAF9] text-[#105F68] border-black/10"
            }`}
          >
            Bakery
          </button>
          <button
            onClick={() => handleSwitchOvelinkTemplate("vance-studio")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              activeOvelink.slug === "vance-studio" ? "bg-[#105F68] text-white border-[#105F68]" : "bg-[#F6FAF9] text-[#105F68] border-black/10"
            }`}
          >
            Loft Rental
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyOvelink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#105F68]/20 bg-white hover:bg-[#105F68]/5 text-xs text-[#105F68] transition-all shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
          </button>

          <Link
            href={`/l/${activeOvelink.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Page</span>
          </Link>

          <button
            onClick={handleSaveOvelinkSettings}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-all shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save &amp; Publish</span>
          </button>
        </div>
      </div>

      {/* Split Screen Customizer & Live Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Subtab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-black/5 pb-3">
            {[
              { id: "branding" as const, label: "Branding & Bio", icon: Building2 },
              { id: "booking" as const, label: "Time Slots & Details", icon: Calendar },
              { id: "offerings" as const, label: "Services & Products", icon: ShoppingBag },
              { id: "reviews" as const, label: "Reviews & Reputation", icon: Star },
              { id: "themes" as const, label: "Colors & Palettes", icon: Palette },
              { id: "style" as const, label: "Typography & Shapes", icon: Type },
              { id: "socials" as const, label: "Socials & WhatsApp", icon: Phone },
            ].map((sub) => {
              const Icon = sub.icon;
              const isSubActive = studioSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => { playClick(); setStudioSubTab(sub.id); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                    isSubActive
                      ? "bg-[#105F68] text-white font-medium"
                      : "bg-[#F6FAF9] text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subtab 1: Branding & Bio */}
          {studioSubTab === "branding" && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Business Name</label>
                <input
                  type="text"
                  value={activeOvelink.businessName}
                  onChange={(e) => setActiveOvelink({ ...activeOvelink, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Tagline / Headline</label>
                  <input
                    type="text"
                    value={activeOvelink.businessTagline}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, businessTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Avatar Monogram (2-3 chars)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={activeOvelink.avatarInitials}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, avatarInitials: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Brand Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={activeOvelink.logoUrl || ""}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, logoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Public Contact Email</label>
                  <input
                    type="email"
                    placeholder="hello@yourbrand.com"
                    value={activeOvelink.email || ""}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Operating Currency</label>
                  <select
                    value={activeOvelink.currency || DEFAULT_CURRENCY}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Business Bio / About</label>
                <textarea
                  rows={3}
                  value={activeOvelink.businessBio}
                  onChange={(e) => setActiveOvelink({ ...activeOvelink, businessBio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              {/* Public URL Handle Management */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <div className="flex items-center justify-between">
                  <label className="text-[#105F68] font-semibold text-xs">
                    Public Link Slug &amp; URL Handle
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      const gen = sanitizeSlug(activeOvelink.businessName);
                      if (gen) {
                        setActiveOvelink({ ...activeOvelink, slug: gen });
                        showToast(`Generated: ${PRIMARY_DOMAIN}/l/${gen}`);
                      }
                    }}
                    className="text-[11px] text-[#105F68] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-[#3A9295]" />
                    <span>Auto-Generate</span>
                  </button>
                </div>

                <div className="flex items-center rounded-xl bg-white border border-black/10 overflow-hidden focus-within:border-[#105F68] transition-all">
                  <span className="px-3 py-2 text-[#3A9295] text-xs bg-[#F6FAF9] border-r border-black/5 font-mono select-none">
                    {PRIMARY_DOMAIN}/l/
                  </span>
                  <input
                    type="text"
                    value={activeOvelink.slug}
                    onChange={(e) =>
                      setActiveOvelink({
                        ...activeOvelink,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="flex-1 px-3 py-2 bg-transparent text-xs text-[#105F68] font-mono focus:outline-none"
                    placeholder="your-handle"
                  />
                  <div className="pr-2.5">
                    {slugValidation.valid ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium border border-red-200">
                        Invalid
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#3A9295] pt-0.5">
                  <span className="truncate">
                    {!slugValidation.valid ? (
                      <span className="text-red-600 font-medium">{slugValidation.error}</span>
                    ) : (
                      <span>Live link: <b className="font-mono text-[#105F68]">{PRIMARY_DOMAIN}/l/{activeOvelink.slug}</b></span>
                    )}
                  </span>
                  <Link
                    href={`/l/${activeOvelink.slug}`}
                    target="_blank"
                    className="text-[#105F68] hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    <ExternalLink className="w-3 h-3 text-[#3A9295]" />
                    <span>Open</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Subtab: Time Slots & Booking Details */}
          {studioSubTab === "booking" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              {/* Section 1: Modal Headers & Titles */}
              <div className="space-y-3.5">
                <div className="border-b border-black/5 pb-2">
                  <h4 className="font-semibold text-[#105F68] text-sm">Booking Sheet & Modal Header</h4>
                  <p className="text-[11px] text-[#3A9295]">
                    Customize the title and intake headings your clients see when reserving a slot.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Appointment Booking Title
                    </label>
                    <input
                      type="text"
                      value={activeOvelink.bookingModalTitle || ""}
                      placeholder="Reserve Time Slot"
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, bookingModalTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">e.g. Reserve Time Slot, Book Appointment, Schedule Session</p>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Time Slot Section Heading
                    </label>
                    <input
                      type="text"
                      value={activeOvelink.timeSlotLabel || ""}
                      placeholder="Available Time Slot"
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, timeSlotLabel: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Label shown above the time buttons</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Order Intake Sheet Title
                    </label>
                    <input
                      type="text"
                      value={activeOvelink.orderModalTitle || ""}
                      placeholder="Custom Order Intake"
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, orderModalTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Used for product purchases & custom orders</p>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Session & Duration Note
                    </label>
                    <input
                      type="text"
                      value={activeOvelink.slotDurationNotice || ""}
                      placeholder="Includes setup and consultation"
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, slotDurationNotice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">e.g. Includes 15 min setup or buffer time</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Available Time Slots */}
              <div className="space-y-3.5 pt-2 border-t border-black/5">
                <div className="border-b border-black/5 pb-2">
                  <h4 className="font-semibold text-[#105F68] text-sm">Available Daily Time Slots</h4>
                  <p className="text-[11px] text-[#3A9295]">
                    Configure which appointment slots are bookable on your public link.
                  </p>
                </div>

                {/* Preset Schedules */}
                <div>
                  <label className="text-[11px] text-[#3A9295] font-medium block mb-1.5">
                    Quick Schedule Templates
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplySlotPreset(
                        ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"],
                        "Standard 9 AM - 5:30 PM"
                      )}
                      className="px-2.5 py-1 rounded-full border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#105F68] hover:text-white text-[#105F68] text-[11px] transition-all"
                    >
                      Standard (9 AM - 5:30 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySlotPreset(
                        ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
                        "Hourly 9 AM - 5 PM"
                      )}
                      className="px-2.5 py-1 rounded-full border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#105F68] hover:text-white text-[#105F68] text-[11px] transition-all"
                    >
                      Hourly (9 AM - 5 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySlotPreset(
                        ["08:00 AM", "09:30 AM", "11:00 AM", "12:30 PM"],
                        "Morning Express"
                      )}
                      className="px-2.5 py-1 rounded-full border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#105F68] hover:text-white text-[#105F68] text-[11px] transition-all"
                    >
                      Morning Express (8 AM - 12:30 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySlotPreset(
                        ["02:00 PM", "03:30 PM", "05:00 PM", "06:30 PM", "08:00 PM"],
                        "Afternoon & Evening"
                      )}
                      className="px-2.5 py-1 rounded-full border border-[#105F68]/20 bg-[#F6FAF9] hover:bg-[#105F68] hover:text-white text-[#105F68] text-[11px] transition-all"
                    >
                      Afternoon & Evening (2 PM - 8 PM)
                    </button>
                  </div>
                </div>

                {/* Active Time Slot Chips */}
                <div>
                  <label className="text-[11px] text-[#3A9295] font-medium block mb-1.5">
                    Active Time Slots ({ (activeOvelink.timeSlots || []).length })
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 min-h-[60px] items-center">
                    {(activeOvelink.timeSlots && activeOvelink.timeSlots.length > 0
                      ? activeOvelink.timeSlots
                      : ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"]
                    ).map((slot) => (
                      <div
                        key={slot}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-mono font-medium text-[#105F68] text-xs flex items-center gap-2 group"
                      >
                        <span>{slot}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(slot)}
                          title={`Remove ${slot}`}
                          className="text-slate-400 hover:text-red-500 rounded p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Slot Input */}
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={newSlotInput}
                    placeholder="e.g. 11:15 AM or 03:45 PM"
                    onChange={(e) => setNewSlotInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTimeSlot(newSlotInput);
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono focus:outline-none focus:border-[#105F68]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTimeSlot(newSlotInput)}
                    className="px-3.5 py-2 rounded-xl bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slot</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Booking Guidelines & Policies */}
              <div className="space-y-3.5 pt-2 border-t border-black/5">
                <div className="border-b border-black/5 pb-2">
                  <h4 className="font-semibold text-[#105F68] text-sm">Booking Guidelines & Policy</h4>
                  <p className="text-[11px] text-[#3A9295]">
                    Inform clients of advance booking notice, arrival expectations, and cancellation policies.
                  </p>
                </div>

                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">
                    Client Booking Instructions / Arrival Notes
                  </label>
                  <textarea
                    rows={2}
                    value={activeOvelink.bookingInstructions || ""}
                    placeholder="e.g. Please arrive 5 minutes before your scheduled slot. Free parking available in rear lot."
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, bookingInstructions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Appears as an informational banner above the date/time picker.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Minimum Advance Notice (Lead Time)
                    </label>
                    <select
                      value={typeof activeOvelink.minNoticeDays === "number" ? activeOvelink.minNoticeDays : 1}
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, minNoticeDays: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    >
                      <option value={0}>Same-day bookings allowed (Today onward)</option>
                      <option value={1}>At least 24 hours in advance (Tomorrow onward)</option>
                      <option value={2}>At least 48 hours in advance (2 days onward)</option>
                      <option value={3}>At least 3 days notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Cancellation & Rescheduling Policy
                    </label>
                    <input
                      type="text"
                      value={activeOvelink.cancellationPolicy || ""}
                      placeholder="Free cancellation or rescheduling up to 24 hours prior."
                      onChange={(e) => setActiveOvelink({ ...activeOvelink, cancellationPolicy: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Displayed below the time slots on checkout</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Colors & Themes */}
          {studioSubTab === "themes" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              {!subscription.hasThemeCustomization && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 block">Theme Customization Locked</span>
                      <span className="text-[11px] text-amber-800">
                        Starter Free plan includes standard styling. Upgrade to Growth (LKR 500/mo) to unlock bespoke brand colors &amp; presets.
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/settings?tab=plans"
                    className="shrink-0 px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-xs text-center"
                  >
                    Upgrade Plan
                  </Link>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider mb-2">
                  1-Click Color Presets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyThemePreset(preset)}
                      className="p-3 rounded-2xl border border-black/10 hover:border-[#105F68] cursor-pointer flex items-center justify-between transition-all bg-[#FBFDFD]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-1.5">
                          <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primaryColor }}></span>
                          <span className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.accentColor }}></span>
                          <span className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: preset.bgColor }}></span>
                        </div>
                        <span className="font-medium text-[#105F68]">{preset.name}</span>
                      </div>
                      <span className="text-[10px] text-[#3A9295] font-mono">{preset.fontFamily}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Hex Color Pickers */}
              <div className="pt-4 border-t border-black/5 space-y-4">
                <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                  Custom Brand Hex Colors
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeOvelink.primaryColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={activeOvelink.primaryColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, primaryColor: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">Accent Highlight</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeOvelink.accentColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={activeOvelink.accentColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, accentColor: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">Background Canvas</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeOvelink.bgColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, bgColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={activeOvelink.bgColor}
                        onChange={(e) => setActiveOvelink({ ...activeOvelink, bgColor: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6FAF9] border border-black/10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Typography & Shape */}
          {studioSubTab === "style" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              <div>
                <label className="text-[#3A9295] font-medium block mb-2">Typography &amp; Brand Font</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { font: "Kaleko 105" as OvelinkFont, desc: "Modern Geometric", style: "font-['Kaleko_105']" },
                    { font: "Disolve" as OvelinkFont, desc: "Editorial Display", style: "font-['Disolve']" },
                    { font: "Inter" as OvelinkFont, desc: "Digital Crisp", style: "font-sans" },
                    { font: "Outfit" as OvelinkFont, desc: "Friendly Tech", style: "font-['Outfit']" },
                    { font: "Playfair Display" as OvelinkFont, desc: "Luxury Serif", style: "font-serif" },
                    { font: "Space Grotesk" as OvelinkFont, desc: "Automotive Bold", style: "font-mono" },
                    { font: "Syne" as OvelinkFont, desc: "Avant-Garde Studio", style: "font-bold" },
                  ].map((item) => (
                    <div
                      key={item.font}
                      onClick={() => {
                        playClick();
                        setActiveOvelink({ ...activeOvelink, fontFamily: item.font });
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        activeOvelink.fontFamily === item.font
                          ? "bg-[#105F68] text-white border-[#105F68] shadow-sm"
                          : "bg-[#FBFDFD] border-black/10 hover:border-[#105F68]"
                      }`}
                    >
                      <span className={`text-sm block ${item.style}`}>{item.font}</span>
                      <span className="text-[10px] opacity-75">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1.5">Card Corner Radius</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "rounded-3xl" as const, label: "Soft Pill (3xl)" },
                      { id: "rounded-2xl" as const, label: "Modern (2xl)" },
                      { id: "rounded-xl" as const, label: "Subtle (xl)" },
                      { id: "rounded-none" as const, label: "Sharp Minimal" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveOvelink({ ...activeOvelink, cardRadius: r.id })}
                        className={`p-2 text-[11px] rounded-lg border transition-all ${
                          activeOvelink.cardRadius === r.id
                            ? "bg-[#105F68] text-white border-[#105F68]"
                            : "border-black/10 bg-[#F6FAF9] text-[#105F68]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[#3A9295] font-medium block mb-1.5">Button Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "pill" as const, label: "Pill" },
                      { id: "rounded" as const, label: "Rounded" },
                      { id: "sharp" as const, label: "Sharp" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setActiveOvelink({ ...activeOvelink, buttonStyle: b.id })}
                        className={`p-2 text-[11px] rounded-lg border transition-all ${
                          activeOvelink.buttonStyle === b.id
                            ? "bg-[#105F68] text-white border-[#105F68]"
                            : "border-black/10 bg-[#F6FAF9] text-[#105F68]"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Offerings & Catalog */}
          {studioSubTab === "offerings" && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                    Published Offerings ({activeOvelink.offerings.length})
                  </h4>
                  <p className="text-[#3A9295]">Synced with Services, Products &amp; Categories catalog</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncFromCatalog}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#105F68]/20 bg-[#105F68]/5 text-[#105F68] font-medium text-xs hover:bg-[#105F68]/10 transition-all shadow-2xs"
                    title="Pull latest Services, Products & Categories from your workspace catalog"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync from Catalog</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { playClick(); setIsAddOfferingOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#105F68] text-white font-medium text-xs hover:bg-[#0D4F57] transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Offering</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeOvelink.offerings.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-black/15 bg-[#FBFDFD] space-y-2">
                    <ShoppingBag className="w-8 h-8 text-[#105F68] mx-auto opacity-40" />
                    <p className="text-[#105F68] font-medium">No offerings published yet.</p>
                    <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                      Click &ldquo;Sync from Catalog&rdquo; to pull in all services and products you have created, or add an offering directly.
                    </p>
                  </div>
                ) : (
                  activeOvelink.offerings.map((off, idx) => {
                    const cardImage = off.imageUrl || (off.imageUrls && off.imageUrls[0]);
                    return (
                      <div
                        key={`${off.id}_${idx}`}
                        className="p-3.5 rounded-2xl border border-black/10 bg-[#FBFDFD] flex items-center justify-between gap-3 group"
                      >
                        {/* Image Thumbnail */}
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={off.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/10"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                            style={{ backgroundColor: activeOvelink.primaryColor }}
                          >
                            {off.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                              off.type === "appointment"
                                ? "bg-blue-100 text-blue-800"
                                : off.type === "booking"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {off.type}
                            </span>
                            {off.category && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full">
                                <Tag className="w-2.5 h-2.5 text-[#105F68]" />
                                <span>{off.category}</span>
                              </span>
                            )}
                            {typeof off.stockCount === "number" && off.type === "order" && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full font-medium">
                                Stock: {off.stockCount}
                              </span>
                            )}
                            <h5 className="font-semibold text-[#105F68] truncate">{off.name}</h5>
                          </div>
                          <p className="text-[#3A9295] text-[11px] mt-0.5 line-clamp-1">{off.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-[#105F68] block">
                            {off.pricingType === "range" && off.priceMaxCents && off.priceMaxCents > off.priceCents
                              ? `${formatCurrency(off.priceCents, activeOvelink.currency || DEFAULT_CURRENCY)} – ${formatCurrency(off.priceMaxCents, activeOvelink.currency || DEFAULT_CURRENCY)}`
                              : formatCurrency(off.priceCents, activeOvelink.currency || DEFAULT_CURRENCY)}
                          </span>
                          {off.depositCents > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              Dep: {formatCurrency(off.depositCents, activeOvelink.currency || DEFAULT_CURRENCY)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Share / Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyOfferingLink(off.id, off.type)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#105F68] hover:bg-slate-100 transition-colors"
                            title="Copy Direct Product Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleOffering(off.id)}
                            className={`text-[10px] px-2 py-1 rounded-md border ${
                              off.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {off.isActive ? "Active" : "Hidden"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveOffering(off.id)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Subtab 4: Reviews & Google Reputation Funnel */}
          {studioSubTab === "reviews" && (
            <div className="space-y-5 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                    Customer Reviews &amp; Social Proof
                  </h4>
                  <p className="text-[#3A9295]">Manage verified reviews and Google Maps 5-Star review funnel</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-amber-800">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                      : "5.0"}
                  </span>
                  <span className="text-[11px] text-amber-700">({reviews.length} reviews)</span>
                </div>
              </div>

              {/* Google Maps Review Funnel Configuration */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 to-emerald-50/70 border border-amber-200/70 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Google Maps 5-Star Funnel URL</span>
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Clients who give a 4 or 5-star rating on your public Ovelink will be automatically prompted to post directly to your Google Business Profile!
                    </p>
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    placeholder="https://g.page/r/your-google-review-link/review"
                    value={activeOvelink.googleMapsReviewUrl || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveOvelink({ ...activeOvelink, googleMapsReviewUrl: val });
                      saveReputationConfig({
                        businessSlug: defaultSlug,
                        googleMapsReviewUrl: val,
                        autoRedirectThreshold: 4,
                        privateFeedbackAlerts: true,
                        automatedNudgeHoursPostService: 2,
                        rebookingReminderWeeks: 4,
                      }, merchantTarget);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#105F68]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Paste your Google Review shortcut link (from Google Business Profile &gt; &ldquo;Ask for reviews&rdquo;).
                  </p>
                </div>
              </div>

              {/* Recent Reviews List */}
              <div className="space-y-3">
                <h5 className="font-semibold text-[#105F68] uppercase text-[11px] tracking-wider">
                  Verified Reviews Received ({reviews.length})
                </h5>

                {reviews.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-black/15 bg-[#FBFDFD] text-center space-y-1">
                    <Star className="w-6 h-6 text-amber-400 mx-auto opacity-50" />
                    <p className="text-slate-700 font-medium text-xs">No reviews received yet.</p>
                    <p className="text-slate-400 text-[11px]">
                      Share your Ovelink with customers. Verified clients can submit reviews with 1 click.
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-2xl border border-black/10 bg-[#FBFDFD] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: activeOvelink.primaryColor }}
                          >
                            {rev.clientAvatar || rev.clientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{rev.clientName}</span>
                            <span className="text-[10px] text-slate-400">{rev.serviceName}</span>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs italic">&ldquo;{rev.comment}&rdquo;</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Subtab 5: Socials & WhatsApp */}
          {studioSubTab === "socials" && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (415) 890-1200"
                  value={activeOvelink.whatsappNumber}
                  onChange={(e) => setActiveOvelink({ ...activeOvelink, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={activeOvelink.instagramHandle || ""}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, instagramHandle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="domain.com"
                    value={activeOvelink.websiteUrl || ""}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, websiteUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="Address or city"
                  value={activeOvelink.location || ""}
                  onChange={(e) => setActiveOvelink({ ...activeOvelink, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Smartphone Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#105F68] tracking-wider flex items-center gap-1.5">
              <span>Live Customer Device Preview</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>

            <div className="flex items-center gap-1 p-1 rounded-full bg-white border border-black/10 shadow-sm">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded-full transition-all ${
                  previewDevice === "mobile" ? "bg-[#105F68] text-white" : "text-[#3A9295]"
                }`}
                title="Phone View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded-full transition-all ${
                  previewDevice === "desktop" ? "bg-[#105F68] text-white" : "text-[#3A9295]"
                }`}
                title="Expanded View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="flex justify-center">
            <div
              className={`transition-all duration-300 w-full ${
                previewDevice === "mobile"
                  ? "max-w-[390px] border-[10px] border-zinc-900 rounded-[48px] shadow-2xl overflow-hidden bg-black relative"
                  : "border-4 border-zinc-300 rounded-3xl shadow-xl overflow-hidden"
              }`}
              style={{ height: "740px" }}
            >
              {previewDevice === "mobile" && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-full z-30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-zinc-800 mr-2"></div>
                  <div className="w-8 h-1 bg-zinc-800 rounded-full"></div>
                </div>
              )}

              <div className="w-full h-full overflow-y-auto hide-scrollbar scrollbar-none">
                <OvelinkView config={activeOvelink} isEmbedPreview={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Offering Modal */}
      {isAddOfferingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#105F68] text-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#63C1BB]" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-[#105F68]">Add Offering</h3>
                  <p className="text-xs text-[#3A9295]">Configure appointment, booking or order item</p>
                </div>
              </div>
              <button onClick={() => setIsAddOfferingOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffering} className="space-y-4 text-xs">
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Offering Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "appointment" as const, label: "Appointment (Slots)" },
                    { id: "booking" as const, label: "Booking (Rental/Slot)" },
                    { id: "order" as const, label: "Order (Product/Pack)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewOffType(t.id)}
                      className={`p-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                        newOffType === t.id ? "bg-[#105F68] text-white border-[#105F68]" : "bg-[#F6FAF9] text-[#105F68] border-black/10"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paint Correction Session / Custom Cake"
                  required
                  value={newOffName}
                  onChange={(e) => setNewOffName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                />
              </div>

              <div>
                <label className="text-[#3A9295] font-medium block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what is included..."
                  value={newOffDesc}
                  onChange={(e) => setNewOffDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">
                    Price ({getCurrencySymbol(activeOvelink.currency || DEFAULT_CURRENCY)})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newOffPrice}
                    onChange={(e) => setNewOffPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">
                    Deposit ({getCurrencySymbol(activeOvelink.currency || DEFAULT_CURRENCY)})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newOffDeposit}
                    onChange={(e) => setNewOffDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                {newOffType !== "order" && (
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={newOffDuration}
                      onChange={(e) => setNewOffDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsAddOfferingOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57]"
                >
                  Publish Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-[#63C1BB]/30 animate-fadeUp">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
