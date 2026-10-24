"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  Palette, 
  Type, 
  Phone, 
  MapPin, 
  Save, 
  Copy, 
  ExternalLink, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Smartphone, 
  Monitor, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  Calendar,
  Clock,
  Plus,
  X,
  Info,
  ShieldAlert,
  AlertTriangle,
  KeyRound,
  Lock,
  UserX,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  getOvelink, 
  PRESET_OVELINKS,
  saveOvelink, 
  OvelinkCustomization, 
  OvelinkFont, 
  THEME_PRESETS, 
  OvelinkThemePreset,
  sanitizeSlug,
  validateSlug
} from "@/lib/ovelink-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import OvelinkView from "@/components/OvelinkView";
import { useClientStore, useDraftStore } from "@/lib/use-client-store";

const FONT_OPTIONS: { id: OvelinkFont; name: string; sample: string; styleName: string }[] = [
  { id: "Kaleko 105", name: "Kaleko 105 (Signature)", sample: "Boutique & Modernist Elegance", styleName: "font-['Kaleko_105',sans-serif]" },
  { id: "Disolve", name: "Disolve (Display)", sample: "Bold Sculptural Statement", styleName: "font-['Disolve',sans-serif]" },
  { id: "Outfit", name: "Outfit (Geometric)", sample: "Clean Architectural Tech", styleName: "font-sans" },
  { id: "Inter", name: "Inter (Neutral Clean)", sample: "High-Legibility Swiss Precision", styleName: "font-sans" },
  { id: "Playfair Display", name: "Playfair Display (Editorial)", sample: "Refined Luxury & Warmth", styleName: "font-serif" },
  { id: "Space Grotesk", name: "Space Grotesk (Neo-Grotesk)", sample: "Brutalist Urban Edge", styleName: "font-mono" },
  { id: "Syne", name: "Syne (Avant-Garde)", sample: "Creative Atelier & Design", styleName: "font-sans font-bold" },
];

const COVER_GRADIENTS = [
  { id: "from-[#105F68] to-[#0D4F57]", name: "Ovel Signature Teal", css: "from-[#105F68] to-[#0D4F57]" },
  { id: "from-[#0F172A] to-[#1E293B]", name: "Obsidian Slate", css: "from-[#0F172A] to-[#1E293B]" },
  { id: "from-[#78350F] to-[#92400E]", name: "Warm Amber Terracotta", css: "from-[#78350F] to-[#92400E]" },
  { id: "from-[#14532D] to-[#166534]", name: "Botanical Pine", css: "from-[#14532D] to-[#166534]" },
  { id: "from-[#18181B] to-[#27272A]", name: "Noir Minimal", css: "from-[#18181B] to-[#27272A]" },
  { id: "from-[#BE123C] to-[#E11D48]", name: "Sunset Crimson", css: "from-[#BE123C] to-[#E11D48]" },
  { id: "from-[#4A044E] to-[#6B21A8]", name: "Imperial Velvet", css: "from-[#4A044E] to-[#6B21A8]" },
];

export default function BrandSettingsPage() {
  const router = useRouter();
  const { profile, updateOrganizationDetails, deleteAccount } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const currentSlug = profile?.organizationSlug || "leclat";
  const [initialSlug, setInitialSlug] = useState<string>(currentSlug);

  const storedBrand = useClientStore(
    () => getOvelink(currentSlug, profile?.organizationName, profile?.organizationId),
    () => PRESET_OVELINKS[currentSlug] || PRESET_OVELINKS["leclat"],
  );
  const [brand, setBrand] = useDraftStore(storedBrand);
  const [activeTab, setActiveTab] = useState<
    "identity" | "scheduling" | "palette" | "typography" | "channels" | "account"
  >("identity");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlotInput, setNewSlotInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Live URL Handle Validation
  const slugValidation = useMemo(() => {
    return validateSlug(brand.slug, profile?.organizationId);
  }, [brand.slug, profile?.organizationId]);

  const handleAutoGenerateSlug = () => {
    playClick();
    const generated = sanitizeSlug(brand.businessName);
    if (generated) {
      setBrand((prev) => ({ ...prev, slug: generated }));
      showToast(`Generated handle: ovel.app/l/${generated}`);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "account" || tabParam === "danger") {
        setActiveTab("account");
      }
    }
  }, []);

  const handleAddTimeSlot = (slot: string) => {
    const trimmed = slot.trim().toUpperCase();
    if (!trimmed) return;
    const current = brand.timeSlots || ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];
    if (current.includes(trimmed)) {
      showToast(`Slot "${trimmed}" already exists`);
      return;
    }
    const updated = [...current, trimmed];
    setBrand((prev) => ({ ...prev, timeSlots: updated }));
    setNewSlotInput("");
    showToast(`Added time slot "${trimmed}"`);
  };

  const handleRemoveTimeSlot = (slotToRemove: string) => {
    const current = brand.timeSlots || [];
    if (current.length <= 1) {
      showToast("You must keep at least one available time slot");
      return;
    }
    const updated = current.filter((s) => s !== slotToRemove);
    setBrand((prev) => ({ ...prev, timeSlots: updated }));
    showToast(`Removed slot "${slotToRemove}"`);
  };

  const handleApplySlotPreset = (presetSlots: string[], presetName: string) => {
    playClick();
    setBrand((prev) => ({ ...prev, timeSlots: presetSlots }));
    showToast(`Applied "${presetName}" schedule`);
  };

  // Sync state when brand is updated across sessions/events
  useEffect(() => {
    if (profile?.organizationSlug) {
      setBrand(getOvelink(profile.organizationSlug, profile.organizationName, profile.organizationId));
      setInitialSlug(profile.organizationSlug);
    }
  }, [profile?.organizationSlug, profile?.organizationName, profile?.organizationId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<OvelinkCustomization>;
      if (customEvent.detail) {
        setBrand(customEvent.detail);
      }
    };
    window.addEventListener("ovel:brand_updated", handleUpdate);
    return () => window.removeEventListener("ovel:brand_updated", handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyLink = () => {
    playClick();
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/l/${brand.slug}`
      : `https://ovel.app/l/${brand.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Brand URL copied: ovel.app/l/${brand.slug}`);
  };

  const handleApplyPreset = (preset: OvelinkThemePreset) => {
    playClick();
    setBrand((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      bgColor: preset.bgColor,
      textColor: preset.textColor,
      surfaceColor: preset.surfaceColor,
      fontFamily: preset.fontFamily,
      coverGradient: preset.coverGradient,
    }));
    showToast(`Applied preset: ${preset.name}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo size should be under 2MB for fast loading.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBrand((prev) => ({ ...prev, logoUrl: dataUrl }));
      playSuccess();
      showToast("Brand logo uploaded and preview updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    playClick();
    setBrand((prev) => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Brand logo removed. Reverting to monogram avatar.");
  };

  const handleSaveBrandDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brand.businessName.trim()) {
      showToast("Please enter a valid brand name.");
      return;
    }

    const validation = validateSlug(brand.slug, profile?.organizationId);
    if (!validation.valid) {
      showToast(validation.error || "Please enter a valid URL handle.");
      return;
    }

    setIsSaving(true);
    playSuccess();

    const cleanSlug = validation.cleanSlug;
    const previous = initialSlug;

    const updatedBrand: OvelinkCustomization = {
      ...brand,
      slug: cleanSlug,
      businessBio: brand.businessBio?.includes("Welcome to My Business")
        ? brand.businessBio.replace("Welcome to My Business", `Welcome to ${brand.businessName}`)
        : brand.businessBio,
    };

    setBrand(updatedBrand);
    saveOvelink(updatedBrand, previous !== cleanSlug ? previous : undefined);
    setInitialSlug(cleanSlug);
    updateOrganizationDetails(updatedBrand.businessName, updatedBrand.slug);

    setTimeout(() => {
      setIsSaving(false);
      showToast(`Brand details for "${updatedBrand.businessName}" saved & published live!`);
    }, 300);
  };

  const handleResetToCurrent = () => {
    playClick();
    setBrand(getOvelink(currentSlug));
    showToast("Reverted unsaved edits to last published brand state.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-[#105F68] text-white text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 border border-[#63C1BB]/30">
          <CheckCircle2 className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header & Live Status */}
      <div className="p-6 rounded-3xl bg-white border border-[#105F68]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-medium tracking-wider uppercase">
              Brand
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Saved
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#105F68] tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-[#3A9295] font-light mt-0.5 max-w-xl">
            Brand, contact, and theme.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-[#F6FAF9] hover:bg-white text-xs text-[#105F68] transition-all shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3A9295]" />}
            <span>{copiedLink ? "Copied" : "Copy link"}</span>
          </button>

          <Link
            href={`/l/${brand.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#105F68]/20 bg-white hover:bg-[#F6FAF9] text-xs text-[#105F68] transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Open page</span>
          </Link>

          <button
            onClick={() => handleSaveBrandDetails()}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium shadow-md shadow-[#105F68]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Settings Controls (Left 7) vs Preview (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Navigation Subtabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-black/5 pb-3">
            {[
              { id: "identity" as const, label: "Brand", icon: Building2 },
              { id: "scheduling" as const, label: "Booking", icon: Calendar },
              { id: "palette" as const, label: "Colors", icon: Palette },
              { id: "typography" as const, label: "Typography", icon: Type },
              { id: "channels" as const, label: "Contact", icon: Phone },
              { id: "account" as const, label: "Account", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all ${
                    isActive
                      ? "bg-[#105F68] text-white font-medium shadow-sm"
                      : "bg-[#F6FAF9] text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: BRAND IDENTITY & BIO */}
          {activeTab === "identity" && (
            <div className="space-y-5 text-xs animate-in fade-in duration-150">
              {/* Business Name */}
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brand.businessName}
                  onChange={(e) => setBrand({ ...brand, businessName: e.target.value })}
                  placeholder="e.g. L'Éclat Studio or Apex Detailing Lab"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-medium focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-[#3A9295] font-light mt-1">
                  Shown on checkout, invoices, and booking.
                </p>
              </div>

              {/* Public URL Slug & Handle Management */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#F6FAF9] border border-black/5">
                <div className="flex items-center justify-between">
                  <label className="text-[#105F68] font-semibold text-xs flex items-center gap-1.5">
                    <span>URL</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAutoGenerateSlug}
                    className="text-[11px] text-[#105F68] hover:text-[#0D4F57] hover:underline flex items-center gap-1 font-medium"
                    title="Auto-create a clean handle from your business name"
                  >
                    <Sparkles className="w-3 h-3 text-[#3A9295]" />
                    <span>Auto-Generate from Name</span>
                  </button>
                </div>

                <div className="flex items-center rounded-xl bg-white border border-black/10 overflow-hidden focus-within:border-[#105F68] focus-within:ring-1 focus-within:ring-[#105F68]/20 transition-all shadow-sm">
                  <span className="px-3.5 py-2.5 text-[#3A9295] text-xs bg-[#F6FAF9] border-r border-black/5 font-mono select-none">
                    ovel.app/l/
                  </span>
                  <input
                    type="text"
                    value={brand.slug}
                    onChange={(e) =>
                      setBrand({
                        ...brand,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="your-brand-handle"
                    className="flex-1 px-3 py-2.5 bg-transparent text-xs text-[#105F68] font-mono focus:outline-none"
                  />
                  
                  {/* Status Indicator */}
                  <div className="pr-3 flex items-center gap-1.5">
                    {slugValidation.valid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                        <X className="w-3 h-3" />
                        Invalid
                      </span>
                    )}
                  </div>
                </div>

                {/* Validation message / Handle URL display & quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <div>
                    {!slugValidation.valid ? (
                      <span className="text-red-600 font-medium">
                        {slugValidation.error}
                      </span>
                    ) : (
                      <span className="text-[#3A9295]">
                        Live booking page:{" "}
                        <span className="font-mono text-[#105F68] font-medium">
                          ovel.app/l/{brand.slug}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-[#105F68] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3 text-[#3A9295]" />
                      <span>Copy</span>
                    </button>
                    <span className="text-black/20">•</span>
                    <Link
                      href={`/l/${brand.slug}`}
                      target="_blank"
                      className="text-[#105F68] hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 text-[#3A9295]" />
                      <span>Test Open</span>
                    </Link>
                  </div>
                </div>

                <p className="text-[10px] text-[#3A9295]/80 pt-1 border-t border-black/5 leading-relaxed">
                  Tip: When you rename your URL handle, Ovel automatically forwards previous links to your new address so existing clients never encounter broken links.
                </p>
              </div>

              {/* Tagline & Monogram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={brand.businessTagline}
                    onChange={(e) => setBrand({ ...brand, businessTagline: e.target.value })}
                    placeholder="e.g. Aesthetic Treatments & Barrier Care"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Monogram</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={brand.avatarInitials}
                    onChange={(e) => setBrand({ ...brand, avatarInitials: e.target.value.toUpperCase() })}
                    placeholder="LE"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] uppercase font-mono focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Brand Logo Upload / URL */}
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#105F68]" />
                    <span className="font-medium text-[#105F68]">Logo</span>
                  </div>
                  {brand.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Visual Preview Box */}
                  <div
                    className="w-16 h-16 rounded-2xl border-2 border-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0 text-white font-bold text-lg"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      brand.avatarInitials
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white border border-black/10 hover:border-[#105F68] text-[#105F68] text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <span className="text-[11px] text-[#3A9295] font-light">PNG, JPG, SVG up to 2MB</span>
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste image URL (https://.../logo.png)"
                      value={brand.logoUrl || ""}
                      onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>
              </div>

              {/* Business Category & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Industry / Category</label>
                  <select
                    value={brand.businessCategory}
                    onChange={(e) => setBrand({ ...brand, businessCategory: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white"
                  >
                    <option value="Appointments & Services">Appointments &amp; Services (Clinics &amp; Salons)</option>
                    <option value="Auto & Detailing">Auto &amp; Detailing Labs</option>
                    <option value="Custom Orders & Food">Custom Orders &amp; Food / Bakeries</option>
                    <option value="Studios & Rentals">Creative Studios &amp; Equipment Rentals</option>
                    <option value="Health & Fitness">Health, Personal Training &amp; Wellness</option>
                    <option value="Consulting & Coaching">Consulting &amp; Bespoke Coaching</option>
                    <option value="General Business">General Business / Direct Commerce</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Public Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@yourbusiness.com"
                    value={brand.email || ""}
                    onChange={(e) => setBrand({ ...brand, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#3A9295] font-medium block mb-1">About</label>
                <textarea
                  rows={3}
                  value={brand.businessBio}
                  onChange={(e) => setBrand({ ...brand, businessBio: e.target.value })}
                  placeholder="Share your boutique narrative, specialist credentials, or client philosophy..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white"
                />
              </div>

              {/* Cover Gradient Selection */}
              <div>
                <label className="text-[#3A9295] font-medium block mb-2">Cover</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COVER_GRADIENTS.map((grad) => (
                    <div
                      key={grad.id}
                      onClick={() => {
                        playClick();
                        setBrand({ ...brand, coverGradient: grad.id });
                      }}
                      className={`h-12 rounded-xl bg-gradient-to-r ${grad.css} cursor-pointer border-2 transition-all flex items-center justify-center p-1 ${
                        brand.coverGradient === grad.id ? "border-[#105F68] scale-102 shadow-md" : "border-transparent opacity-85 hover:opacity-100"
                      }`}
                      title={grad.name}
                    >
                      {brand.coverGradient === grad.id && (
                        <div className="w-5 h-5 rounded-full bg-white/90 text-[#105F68] flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TIME SLOTS & BOOKING DETAILS */}
          {activeTab === "scheduling" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              {/* Modal Titles & Headings */}
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
                      value={brand.bookingModalTitle || ""}
                      placeholder="Reserve Time Slot"
                      onChange={(e) => setBrand({ ...brand, bookingModalTitle: e.target.value })}
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
                      value={brand.timeSlotLabel || ""}
                      placeholder="Available Time Slot"
                      onChange={(e) => setBrand({ ...brand, timeSlotLabel: e.target.value })}
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
                      value={brand.orderModalTitle || ""}
                      placeholder="Custom Order Intake"
                      onChange={(e) => setBrand({ ...brand, orderModalTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">For products and orders</p>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Session & Duration Note
                    </label>
                    <input
                      type="text"
                      value={brand.slotDurationNotice || ""}
                      placeholder="Includes setup and consultation"
                      onChange={(e) => setBrand({ ...brand, slotDurationNotice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">e.g. 15 min setup</p>
                  </div>
                </div>
              </div>

              {/* Available Time Slots */}
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
                    Active Time Slots ({ (brand.timeSlots || []).length })
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[#F6FAF9] border border-black/5 min-h-[60px] items-center">
                    {(brand.timeSlots && brand.timeSlots.length > 0
                      ? brand.timeSlots
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

              {/* Booking Guidelines & Policies */}
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
                    value={brand.bookingInstructions || ""}
                    placeholder="e.g. Please arrive 5 minutes before your scheduled slot. Free parking available in rear lot."
                    onChange={(e) => setBrand({ ...brand, bookingInstructions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Banner above the date picker.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Minimum Advance Notice (Lead Time)
                    </label>
                    <select
                      value={typeof brand.minNoticeDays === "number" ? brand.minNoticeDays : 1}
                      onChange={(e) => setBrand({ ...brand, minNoticeDays: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    >
                      <option value={0}>Same day</option>
                      <option value={1}>24 hours ahead</option>
                      <option value={2}>48 hours ahead</option>
                      <option value={3}>At least 3 days notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#3A9295] font-medium block mb-1">
                      Cancellation & Rescheduling Policy
                    </label>
                    <input
                      type="text"
                      value={brand.cancellationPolicy || ""}
                      placeholder="Free cancellation or rescheduling up to 24 hours prior."
                      onChange={(e) => setBrand({ ...brand, cancellationPolicy: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Shown below time slots</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS & PALETTES */}
          {activeTab === "palette" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              {/* Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                    Presets
                  </h4>
                  <span className="text-[11px] text-[#3A9295]">Accessible contrast</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 rounded-2xl border border-black/10 hover:border-[#105F68] cursor-pointer flex items-center justify-between transition-all bg-[#FBFDFD] hover:shadow-sm"
                    >
                      <div>
                        <span className="font-medium text-[#105F68] block">{preset.name}</span>
                        <span className="text-[10px] text-[#3A9295]">{preset.fontFamily}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.primaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.accentColor }} />
                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: preset.bgColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="pt-4 border-t border-black/5 space-y-4">
                <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                  Custom Brand Hex Colors
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                    <div>
                      <label className="text-[#3A9295] font-medium block text-xs">Primary Brand Color</label>
                      <span className="text-[10px] text-[#3A9295]/80">Buttons, headings, monograms</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brand.primaryColor}
                        onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={brand.primaryColor}
                        onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                        className="w-20 px-2 py-1 rounded-md bg-white border border-black/10 text-xs font-mono uppercase text-[#105F68]"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                    <div>
                      <label className="text-[#3A9295] font-medium block text-xs">Accent color</label>
                      <span className="text-[10px] text-[#3A9295]/80">Highlights and accents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brand.accentColor}
                        onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={brand.accentColor}
                        onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                        className="w-20 px-2 py-1 rounded-md bg-white border border-black/10 text-xs font-mono uppercase text-[#105F68]"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                    <div>
                      <label className="text-[#3A9295] font-medium block text-xs">Canvas Background</label>
                      <span className="text-[10px] text-[#3A9295]/80">Page background shade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brand.bgColor}
                        onChange={(e) => setBrand({ ...brand, bgColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={brand.bgColor}
                        onChange={(e) => setBrand({ ...brand, bgColor: e.target.value })}
                        className="w-20 px-2 py-1 rounded-md bg-white border border-black/10 text-xs font-mono uppercase text-[#105F68]"
                      />
                    </div>
                  </div>

                  {/* Surface Color */}
                  <div className="p-3.5 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center justify-between">
                    <div>
                      <label className="text-[#3A9295] font-medium block text-xs">Card color</label>
                      <span className="text-[10px] text-[#3A9295]/80">Card fill</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brand.surfaceColor}
                        onChange={(e) => setBrand({ ...brand, surfaceColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={brand.surfaceColor}
                        onChange={(e) => setBrand({ ...brand, surfaceColor: e.target.value })}
                        className="w-20 px-2 py-1 rounded-md bg-white border border-black/10 text-xs font-mono uppercase text-[#105F68]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & SHAPES */}
          {activeTab === "typography" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider mb-2">
                  Brand Font Selection
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = brand.fontFamily === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          playClick();
                          setBrand({ ...brand, fontFamily: f.id });
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-[#105F68] bg-[#F6FAF9] shadow-sm"
                            : "border-black/10 bg-white hover:border-[#105F68]/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#105F68]">{f.name}</span>
                            {isSelected && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#105F68] text-white">Active</span>
                            )}
                          </div>
                          <p className={`text-xs text-[#3A9295] mt-0.5 ${f.styleName}`}>
                            {f.sample}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#105F68] bg-[#105F68] text-white" : "border-black/20"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Button Styles & Corner Shapes */}
              <div className="pt-4 border-t border-black/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-2">Button Geometry</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "pill" as const, label: "Pill Full" },
                      { id: "rounded" as const, label: "Rounded" },
                      { id: "sharp" as const, label: "Sharp" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setBrand({ ...brand, buttonStyle: b.id });
                        }}
                        className={`py-2 px-3 text-xs font-medium border transition-all ${
                          b.id === "pill" ? "rounded-full" : b.id === "sharp" ? "rounded-none" : "rounded-xl"
                        } ${
                          brand.buttonStyle === b.id
                            ? "bg-[#105F68] text-white border-[#105F68]"
                            : "bg-[#F6FAF9] text-[#105F68] border-black/10"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[#3A9295] font-medium block mb-2">Card Corner Radius</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "rounded-3xl" as const, label: "3XL" },
                      { id: "rounded-2xl" as const, label: "2XL" },
                      { id: "rounded-xl" as const, label: "XL" },
                      { id: "rounded-none" as const, label: "Sharp" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          playClick();
                          setBrand({ ...brand, cardRadius: r.id });
                        }}
                        className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all ${
                          brand.cardRadius === r.id
                            ? "bg-[#105F68] text-white border-[#105F68]"
                            : "bg-[#F6FAF9] text-[#105F68] border-black/10"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & LOCALIZATION */}
          {activeTab === "channels" && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div>
                <label className="text-[#3A9295] font-medium block mb-1">
                  WhatsApp Business Number
                </label>
                <div className="flex items-center rounded-xl bg-[#F6FAF9] border border-black/10 focus-within:border-[#105F68] focus-within:bg-white">
                  <span className="px-3 py-2.5 text-emerald-600">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={brand.whatsappNumber}
                    onChange={(e) => setBrand({ ...brand, whatsappNumber: e.target.value })}
                    placeholder="+1 (415) 890-1200"
                    className="flex-1 px-2 py-2.5 bg-transparent text-xs text-[#105F68] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#3A9295] font-light mt-1">
                  Enables 1-tap instant WhatsApp booking confirmations and customer inquiries.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    value={brand.instagramHandle || ""}
                    onChange={(e) => setBrand({ ...brand, instagramHandle: e.target.value })}
                    placeholder="@yourstudio"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Website URL</label>
                  <input
                    type="text"
                    value={brand.websiteUrl || ""}
                    onChange={(e) => setBrand({ ...brand, websiteUrl: e.target.value })}
                    placeholder="https://yourdomain.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Studio / Physical Address</label>
                  <div className="flex items-center rounded-xl bg-[#F6FAF9] border border-black/10 focus-within:border-[#105F68]">
                    <span className="px-3 py-2.5 text-[#3A9295]">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={brand.location || ""}
                      onChange={(e) => setBrand({ ...brand, location: e.target.value })}
                      placeholder="450 Sutter St, San Francisco, CA"
                      className="flex-1 px-2 py-2.5 bg-transparent text-xs text-[#105F68] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Operating Currency</label>
                  <select
                    value={brand.currency}
                    onChange={(e) => setBrand({ ...brand, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  >
                    <option value="USD">USD ($) United States Dollar</option>
                    <option value="EUR">EUR (€) Euro</option>
                    <option value="GBP">GBP (£) British Pound</option>
                    <option value="CAD">CAD ($) Canadian Dollar</option>
                    <option value="AUD">AUD ($) Australian Dollar</option>
                    <option value="JPY">JPY (¥) Japanese Yen</option>
                    <option value="INR">INR (₹) Indian Rupee</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT & DANGER ZONE */}
          {activeTab === "account" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
              {/* Profile Credentials */}
              <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                    {profile?.fullName
                      ? profile.fullName.slice(0, 2).toUpperCase()
                      : "ME"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#105F68]">
                      {profile?.fullName || "Account Owner"}
                    </h3>
                    <p className="text-[#3A9295] text-xs">{profile?.email || "owner@business.com"}</p>
                  </div>
                  <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase bg-[#63C1BB]/20 text-[#105F68] border border-[#63C1BB]/40">
                    {profile?.role === "super_admin" ? "Super Admin" : "Business Owner"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/5">
                  <div>
                    <span className="text-[11px] text-[#3A9295] block">Organization ID</span>
                    <span className="font-mono text-xs font-medium text-[#105F68]">
                      {profile?.organizationId || `org_${brand.slug}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#3A9295] block">Active Public Slug</span>
                    <span className="font-mono text-xs font-medium text-[#105F68]">
                      ovel.app/l/{brand.slug}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password & Authentication Recovery */}
              <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#105F68]">
                  <KeyRound className="w-4 h-4 text-[#3A9295]" />
                  <span>Security &amp; Password Recovery</span>
                </div>
                <p className="text-[#3A9295] text-xs">
                  Your identity is secured by Clerk multi-factor authentication. If you need to reset your password or update sign-in methods, you can request a password recovery email below.
                </p>
                <div>
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-[#F6FAF9] hover:bg-[#105F68]/5 text-xs text-[#105F68] transition-all font-medium"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#3A9295]" />
                    <span>Reset Password via Email</span>
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 sm:p-6 rounded-2xl border border-red-200 bg-red-50/30 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-700">
                      Danger zone
                    </h3>
                    <p className="text-[11px] text-red-600/80">
                      This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-red-900/80 pl-2">
                  <p>This will permanently:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                    <li>Delete your account and login.</li>
                    <li>Delete appointments and shifts.</li>
                    <li>Delete services and pricing.</li>
                    <li>Delete invoices, quotes, and clients.</li>
                    <li>Release your public link.</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-red-200">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setDeleteConfirmText("");
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account &amp; Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions inside Control Card (Branding Tabs) */}
          {activeTab !== "account" && (
            <div className="pt-6 border-t border-black/5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="px-3.5 py-2 rounded-xl text-xs text-[#3A9295] hover:text-[#105F68] hover:bg-[#F6FAF9] transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Edits</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveBrandDetails()}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-md shadow-[#105F68]/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Dual-Device Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4 select-none">
          {/* Preview Controls Bar */}
          <div className="p-3 rounded-2xl bg-white border border-[#105F68]/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#105F68]">Preview</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68]">
                Live
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#F6FAF9] p-1 rounded-xl border border-black/5">
              <button
                onClick={() => { playClick(); setPreviewDevice("mobile"); }}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  previewDevice === "mobile" ? "bg-white text-[#105F68] shadow-sm font-medium" : "text-[#3A9295]"
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { playClick(); setPreviewDevice("desktop"); }}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  previewDevice === "desktop" ? "bg-white text-[#105F68] shadow-sm font-medium" : "text-[#3A9295]"
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Device Frame */}
          <div className="flex justify-center">
            {previewDevice === "mobile" ? (
              <div className="w-[320px] sm:w-[350px] h-[640px] rounded-[42px] border-[10px] border-[#18181B] bg-white shadow-2xl overflow-hidden flex flex-col relative">
                {/* Phone Notch */}
                <div className="w-36 h-4 bg-[#18181B] mx-auto rounded-b-xl z-20 absolute top-0 left-1/2 -translate-x-1/2" />
                <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
                  <OvelinkView config={brand} isEmbedPreview={true} />
                </div>
              </div>
            ) : (
              <div className="w-full h-[640px] rounded-3xl border border-black/10 bg-white shadow-xl overflow-hidden flex flex-col">
                <div className="p-3 bg-[#F6FAF9] border-b border-black/5 flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-[#3A9295] truncate ml-2">
                    https://ovel.app/l/{brand.slug}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <OvelinkView config={brand} isEmbedPreview={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-red-700">
                  Delete Account Permanently?
                </h3>
                <p className="text-xs text-[#3A9295] mt-0.5">
                  This action cannot be undone under any circumstances.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#103438] leading-relaxed">
              All your business data, customer bookings, staff profiles, invoices, and your public booking URL{" "}
              <b className="text-red-700">ovel.app/l/{brand.slug}</b> will be destroyed immediately.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#103438] block">
                To confirm, type <span className="font-mono text-red-600 font-bold">DELETE</span> below:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F6FAF9] border border-black/15 focus:border-red-500 text-red-700 font-mono focus:outline-none transition-all uppercase"
                disabled={isDeleting}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIsDeleteModalOpen(false);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full border border-black/10 text-xs text-[#3A9295] hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
                  setIsDeleting(true);
                  playClick();
                  const res = await deleteAccount();
                  if (res?.error) {
                    setIsDeleting(false);
                    showToast(`Error deleting account: ${res.error}`);
                  } else {
                    showToast("Account deleted successfully. Farewell!");
                    setTimeout(() => {
                      router.push("/login?deleted=1");
                    }, 500);
                  }
                }}
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
