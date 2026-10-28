"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  Phone, 
  MapPin, 
  Save, 
  Copy, 
  ExternalLink, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw,
  Trash2,
  X,
  KeyRound,
  Lock,
  User,
  Sparkles,
  ShoppingBag,
  Layers,
  Package,
  ShieldAlert,
  ArrowRight,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  getOvelink, 
  PRESET_OVELINKS,
  saveOvelink, 
  OvelinkCustomization, 
  sanitizeSlug,
  validateSlug
} from "@/lib/ovelink-store";
import { useAuth, BusinessType } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useClientStore, useDraftStore } from "@/lib/use-client-store";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { PRIMARY_DOMAIN, getOvelinkUrl, getOvelinkDisplay } from "@/lib/domain";
import { 
  getMerchantSubscription, 
  setMerchantSubscription, 
  SUBSCRIPTION_PLANS, 
  SubscriptionTier,
  checkOfferingCapacity,
  checkOrderQuotaStatus,
  calculateOverflowFee
} from "@/lib/subscription-store";
import { getBookings } from "@/lib/platform-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/arc/tabs/tabs";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";
import Toast from "@/components/arc/toast/toast";
import Alert from "@/components/arc/alert/alert";

export default function BrandSettingsPage() {
  const router = useRouter();
  const { profile, updateOrganizationDetails, updateProfile, updateBusinessType, deleteAccount } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const currentSlug = profile?.organizationSlug || "my-brand";
  const [initialSlug, setInitialSlug] = useState<string>(currentSlug);

  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType>(() => {
    return profile?.businessType || (
      typeof window !== "undefined"
        ? (localStorage.getItem(`ovel_business_type_${profile?.organizationId || currentSlug}`) as BusinessType)
          || (localStorage.getItem("ovel_selected_business_type") as BusinessType)
          || "both"
        : "both"
    );
  });

  const storedBrand = useClientStore(
    () => getOvelink(currentSlug, profile?.organizationName, profile?.organizationId),
    () => PRESET_OVELINKS[currentSlug] || PRESET_OVELINKS["leclat"],
  );
  const [brand, setBrand] = useDraftStore(storedBrand);
  const [activeTab, setActiveTab] = useState<"general" | "contact_currency" | "plans" | "account">("general");
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Subscription state & capacity checks
  const targetOrg = profile?.organizationId || brand.slug;
  const [subscription, setSubState] = useState(() => getMerchantSubscription(targetOrg));
  const currentOfferingsCount = (brand.offerings || []).length;
  const bookings = useClientStore(() => getBookings(targetOrg), () => []);
  const monthlyOrderCount = bookings.length;
  const quota = checkOrderQuotaStatus(targetOrg, monthlyOrderCount);
  const capacity = checkOfferingCapacity(targetOrg, currentOfferingsCount);
  const overflow = calculateOverflowFee(targetOrg, monthlyOrderCount);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    playSuccess();
    const updated = setMerchantSubscription(targetOrg, tier);
    setSubState(updated);
    showToast(`Upgraded plan to ${SUBSCRIPTION_PLANS[tier].name}!`);
  };

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
      showToast(`Generated handle: ${PRIMARY_DOMAIN}/l/${generated}`);
    }
  };

  useEffect(() => {
    if (storedBrand.slug && storedBrand.slug !== initialSlug) {
      setInitialSlug(storedBrand.slug);
    }
  }, [storedBrand.slug, initialSlug]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyLink = () => {
    playClick();
    const url = getOvelinkUrl(brand.slug);
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Copied public URL: ${getOvelinkDisplay(brand.slug)}`);
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
      showToast("Brand logo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    playClick();
    setBrand((prev) => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Brand logo removed.");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Avatar image must be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBrand((prev) => ({ ...prev, avatarUrl: dataUrl }));
      updateProfile({ avatarUrl: dataUrl });
      playSuccess();
      showToast("Avatar photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    playClick();
    setBrand((prev) => ({ ...prev, avatarUrl: undefined }));
    updateProfile({ avatarUrl: undefined });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Custom avatar removed.");
  };

  const handleSaveBrandDetails = async (e?: React.FormEvent) => {
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

    setIsSaving(true);
    playSuccess();

    const updatedBrand: OvelinkCustomization = {
      ...brand,
      organizationId: profile?.organizationId,
      currency: brand.currency || DEFAULT_CURRENCY,
      slug: cleanSlug,
    };

    setBrand(updatedBrand);
    saveOvelink(updatedBrand, previous !== cleanSlug ? previous : undefined);
    setInitialSlug(cleanSlug);
    updateOrganizationDetails(updatedBrand.businessName, updatedBrand.slug, updatedBrand.avatarUrl, selectedBusinessType);
    updateBusinessType(selectedBusinessType);
    updateProfile({ avatarUrl: updatedBrand.avatarUrl, businessType: selectedBusinessType });

    setTimeout(() => {
      setIsSaving(false);
      showToast(`Settings & business configuration saved successfully!`);
    }, 300);
  };

  const handleResetToCurrent = () => {
    playClick();
    setBrand(getOvelink(currentSlug));
    showToast("Reverted unsaved edits to last published state.");
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE") {
      showToast("Please type DELETE to confirm account removal.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.error) {
        setIsDeleting(false);
        showToast(result.error);
        return;
      }
      showToast("Workspace & account deleted successfully.");
      router.push("/login");
    } catch {
      setIsDeleting(false);
      showToast("Failed to delete account. Please contact support.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Toast
            key={notification || "idle"}
            open={Boolean(notification)}
            onOpenChange={(open) => { if (!open) setNotification(null); }}
            title={notification || ""}
            duration={3500}
          />
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Platform &amp; Workspace Settings
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Manage your legal entity, business offering mode, regional currency, plan allowances, and security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/10 bg-white hover:bg-[#F6FAF9] text-xs text-[#105F68] transition-all shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3A9295]" />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>

          <Link
            href={`/l/${brand.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#105F68]/20 bg-white hover:bg-[#F6FAF9] text-xs text-[#105F68] transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Storefront</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSaveBrandDetails()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Callout to Ovelink Studio */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#105F68]/10 via-[#63C1BB]/15 to-white border border-[#105F68]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#105F68] text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-[#105F68]">
              Looking to customize your public Ovelink storefront?
            </span>
          </div>
          <p className="text-xs text-[#3A9295] max-w-xl">
            Live themes, brand palettes, typography fonts, customer booking slots, and interactive mobile preview are customized in <strong>Ovelink Studio</strong>.
          </p>
        </div>

        <Link
          href="/dashboard/ovelink"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#105F68] text-white text-xs font-semibold hover:bg-[#0D4F57] transition-all shadow-sm shrink-0"
        >
          <span>Open Ovelink Studio</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Categorized Arc UI Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => { playClick(); setActiveTab(val as typeof activeTab); }}>
        <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-2 sm:p-3">
          <TabsList aria-label="Settings Categories">
            <TabsTrigger value="general">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>General &amp; Organization</span>
              </span>
            </TabsTrigger>

            <TabsTrigger value="contact_currency">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Contact &amp; Currency</span>
              </span>
            </TabsTrigger>

            <TabsTrigger value="plans">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plans &amp; Quotas</span>
              </span>
            </TabsTrigger>

            <TabsTrigger value="account">
              <span className="flex items-center gap-1.5 text-rose-600">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Account &amp; Danger Zone</span>
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: General & Organization */}
        <TabsContent value="general">
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6 mt-4">
            <div>
              <h2 className="text-lg font-light text-[#105F68]">Organization Identity &amp; Mode</h2>
              <p className="text-xs text-[#3A9295] mt-0.5">
                Configure your business legal name, offering model, and public web handle.
              </p>
            </div>

            {/* Business Name */}
            <div>
              <label className="text-[#3A9295] font-medium text-xs block mb-1">
                Brand / Business Name <span className="text-red-500">*</span>
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
                Displayed as the primary brand header across customer checkout, invoices, quotations, and scheduling receipts.
              </p>
            </div>

            {/* Business Model / Type Selector */}
            <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
              <div>
                <label className="text-[#105F68] font-semibold text-xs flex items-center gap-1.5">
                  <span>Business Offering Model</span>
                </label>
                <p className="text-[11px] text-[#3A9295] mt-0.5">
                  Tailors your dashboard tabs and client booking engine to your exact operational model.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedBusinessType("services");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedBusinessType === "services"
                      ? "border-[#105F68] bg-white text-[#105F68] shadow-sm ring-1 ring-[#105F68]"
                      : "border-black/10 bg-white/60 text-slate-600 hover:border-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Sparkles className={`w-4 h-4 ${selectedBusinessType === "services" ? "text-[#105F68]" : "text-slate-400"}`} />
                    {selectedBusinessType === "services" && <span className="w-2 h-2 rounded-full bg-[#105F68]" />}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold">Services Only</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Consultancies, salons, studios, &amp; specialists. Focuses on bookable appointment slots.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedBusinessType("products");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedBusinessType === "products"
                      ? "border-[#105F68] bg-white text-[#105F68] shadow-sm ring-1 ring-[#105F68]"
                      : "border-black/10 bg-white/60 text-slate-600 hover:border-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Package className={`w-4 h-4 ${selectedBusinessType === "products" ? "text-[#105F68]" : "text-slate-400"}`} />
                    {selectedBusinessType === "products" && <span className="w-2 h-2 rounded-full bg-[#105F68]" />}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold">Products Only</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Physical retail, merchandise, &amp; warehouse inventory. Focuses on orders and stock.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedBusinessType("both");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedBusinessType === "both"
                      ? "border-[#105F68] bg-white text-[#105F68] shadow-sm ring-1 ring-[#105F68]"
                      : "border-black/10 bg-white/60 text-slate-600 hover:border-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Layers className={`w-4 h-4 ${selectedBusinessType === "both" ? "text-[#105F68]" : "text-slate-400"}`} />
                    {selectedBusinessType === "both" && <span className="w-2 h-2 rounded-full bg-[#105F68]" />}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold">Both (Services &amp; Products)</span>
                    <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Full commercial suite: bookable appointments, service tiers, and retail merchandise.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Public URL Slug & Handle Management */}
            <div className="space-y-2 p-4 rounded-2xl bg-[#F6FAF9] border border-black/5">
              <div className="flex items-center justify-between">
                <label className="text-[#105F68] font-semibold text-xs flex items-center gap-1.5">
                  <span>Public Link Handle</span>
                </label>

                <button
                  type="button"
                  onClick={handleAutoGenerateSlug}
                  className="text-[11px] text-[#105F68] hover:text-[#0D4F57] hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3 text-[#3A9295]" />
                  <span>Auto-Generate from Name</span>
                </button>
              </div>

              <div className="flex items-center rounded-xl bg-white border border-black/10 overflow-hidden focus-within:border-[#105F68] focus-within:ring-1 focus-within:ring-[#105F68]/20 transition-all shadow-sm">
                <span className="px-3.5 py-2.5 text-[#3A9295] text-xs bg-[#F6FAF9] border-r border-black/5 font-mono select-none">
                  {PRIMARY_DOMAIN}/l/
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div>
                  {!slugValidation.valid ? (
                    <span className="text-red-600 font-medium">
                      {slugValidation.error}
                    </span>
                  ) : (
                    <span className="text-[#3A9295]">
                      Live public page:{" "}
                      <span className="font-mono text-[#105F68] font-medium">
                        {PRIMARY_DOMAIN}/l/{brand.slug}
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
            </div>

            {/* Brand Logo Upload */}
            <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#105F68]" />
                  <span className="font-medium text-xs text-[#105F68]">Official Brand Logo</span>
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
                <div
                  className="w-16 h-16 rounded-2xl border-2 border-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0 bg-[#105F68] text-white font-bold text-lg"
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    brand.avatarInitials || "BR"
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
                      <span>Upload Logo</span>
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

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-3">
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Contact & Currency */}
        <TabsContent value="contact_currency">
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6 mt-4">
            <div>
              <h2 className="text-lg font-light text-[#105F68]">Contact Channels &amp; Regional Currency</h2>
              <p className="text-xs text-[#3A9295] mt-0.5">
                Set customer communication numbers, studio address, and transaction pricing currency.
              </p>
            </div>

            {/* Store Currency Selector */}
            <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
              <label className="text-[#105F68] font-semibold text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Store Base Currency</span>
              </label>
              <p className="text-[11px] text-[#3A9295]">
                Applied across all invoices, quotes, products, services, and online payments.
              </p>
              <select
                value={brand.currency || DEFAULT_CURRENCY}
                onChange={(e) => setBrand({ ...brand, currency: e.target.value })}
                className="w-full sm:w-72 px-3 py-2 rounded-xl bg-white border border-black/10 text-xs text-[#105F68] font-semibold focus:outline-none focus:border-[#105F68]"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#3A9295] font-medium text-xs block mb-1">
                  Business WhatsApp / Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-[#3A9295]" />
                  <input
                    type="tel"
                    value={brand.whatsappNumber || ""}
                    onChange={(e) => setBrand({ ...brand, whatsappNumber: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#3A9295] font-medium text-xs block mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={brand.instagramHandle || ""}
                  onChange={(e) => setBrand({ ...brand, instagramHandle: e.target.value })}
                  placeholder="@yourbusiness"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[#3A9295] font-medium text-xs block mb-1">
                Studio / Facility Physical Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-[#3A9295]" />
                <input
                  type="text"
                  value={brand.location || ""}
                  onChange={(e) => setBrand({ ...brand, location: e.target.value })}
                  placeholder="e.g. 142 Mercer Street, Suite 4B, SoHo, NY"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-3">
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Plans & Quotas */}
        <TabsContent value="plans">
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6 mt-4">
            <div>
              <h2 className="text-lg font-light text-[#105F68]">Plans &amp; Subscription Quotas</h2>
              <p className="text-xs text-[#3A9295] mt-0.5">
                Monitor monthly order quotas, catalog item allowances, and upgrade subscription tiers.
              </p>
            </div>

            {/* Current Tier Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#105F68]/10 via-[#63C1BB]/10 to-transparent border border-[#105F68]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3A9295] block">
                  Active Subscription Tier
                </span>
                <h3 className="text-xl font-bold text-[#105F68]">
                  {SUBSCRIPTION_PLANS[subscription.tier].name} Plan
                </h3>
                <p className="text-xs text-[#3A9295]">
                  {SUBSCRIPTION_PLANS[subscription.tier].tagline}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-light text-[#105F68]">
                  LKR {SUBSCRIPTION_PLANS[subscription.tier].monthlyFeeLkr.toLocaleString()}
                </span>
                <span className="text-xs text-[#3A9295]"> / month</span>
              </div>
            </div>

            {/* Quota Metric Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#105F68]">Monthly Transaction Quota</span>
                  <span className="text-[#3A9295]">
                    {monthlyOrderCount} / {quota.maxMonthlyOrders}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                  <div
                    className="h-full bg-[#105F68] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (monthlyOrderCount / (quota.maxMonthlyOrders || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#3A9295]">
                  {quota.isOverQuota
                    ? `Over quota by ${quota.overflowOrders} orders (LKR ${quota.overflowFeeLkr.toLocaleString()} overflow fee)`
                    : "Zero fee allowances active for current billing cycle."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#105F68]">Catalog Capacity Allowance</span>
                  <span className="text-[#3A9295]">
                    {currentOfferingsCount} / {capacity.maxOfferings}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                  <div
                    className="h-full bg-[#63C1BB] rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentOfferingsCount / (capacity.maxOfferings || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#3A9295]">
                  {capacity.isAtCapacity
                    ? "Maximum catalog limit reached. Upgrade tier to publish more offerings."
                    : `${capacity.remainingCapacity} additional items can be published on current plan.`}
                </p>
              </div>
            </div>

            {/* Plan Upgrade Grid */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3A9295]">
                Switch or Upgrade Tier
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]).map((tierKey) => {
                  const plan = SUBSCRIPTION_PLANS[tierKey];
                  const isCurrent = subscription.tier === tierKey;
                  return (
                    <div
                      key={tierKey}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isCurrent
                          ? "border-[#105F68] bg-[#105F68]/5 shadow-sm ring-1 ring-[#105F68]"
                          : "border-black/10 bg-white hover:border-black/20"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#105F68]">{plan.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#105F68] text-white">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-light text-[#105F68]">
                          LKR {plan.monthlyFeeLkr.toLocaleString()}
                          <span className="text-xs text-[#3A9295]"> / mo</span>
                        </div>
                        <p className="text-[11px] text-[#3A9295] leading-relaxed">
                          {plan.tagline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPlan(tierKey)}
                        disabled={isCurrent}
                        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                          isCurrent
                            ? "bg-black/5 text-[#3A9295] cursor-default"
                            : "bg-[#105F68] hover:bg-[#0D4F57] text-white shadow-sm"
                        }`}
                      >
                        {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Account & Danger Zone */}
        <TabsContent value="account">
          <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6 mt-4">
            <div>
              <h2 className="text-lg font-light text-[#105F68]">Account Details &amp; Workspace Security</h2>
              <p className="text-xs text-[#3A9295] mt-0.5">
                Owner credentials, authentication management, and workspace danger zone.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="p-5 rounded-2xl bg-[#F6FAF9] border border-black/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#105F68] text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile?.fullName
                      ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "ME"
                  )}
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
                    {PRIMARY_DOMAIN}/l/{brand.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Password & Security */}
            <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#105F68]">
                <KeyRound className="w-4 h-4 text-[#3A9295]" />
                <span>Security &amp; Password Recovery</span>
              </div>
              <p className="text-[#3A9295] text-xs">
                Your workspace identity is secured with multi-factor authentication. To reset your password or update sign-in credentials, request a password reset below.
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
            <Alert
              tone="danger"
              title="Danger Zone: Permanent Account Deletion"
            >
              <div className="space-y-3 mt-1.5">
                <p className="text-xs text-red-600/90">
                  Irreversible action that permanently purges your account, offers, and workspace data.
                </p>
                <div className="space-y-1.5 text-xs text-red-900/80">
                  <p className="font-medium">Deleting your account will immediately and permanently:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800">
                    <li>Delete your authentication credentials and user profile.</li>
                    <li>Wipe all customer appointments, schedules, and roster records.</li>
                    <li>Remove your catalog of offerings, products, and categories.</li>
                    <li>Delete all invoices, quotes, CRM client profiles, and balance ledgers.</li>
                    <li>Permanently release your public link handle ({PRIMARY_DOMAIN}/l/{brand.slug}).</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setDeleteConfirmText("");
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account &amp; Workspace</span>
                  </button>
                </div>
              </div>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Modal with Arc Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent
          title="Delete Account Permanently?"
          description="This action cannot be undone under any circumstances."
        >
          <div className="space-y-4 pt-2">
            <Alert
              tone="danger"
              title="Permanent Destruction of Workspace Data"
            >
              All business data, customer bookings, staff roster, invoices, and your public booking URL{" "}
              <b className="font-semibold text-red-600">{PRIMARY_DOMAIN}/l/{brand.slug}</b> will be destroyed immediately.
            </Alert>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#103438] block">
                To confirm, type <span className="font-mono text-red-600 font-bold">DELETE</span> below:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 text-xs font-mono focus:outline-none focus:border-red-600 bg-red-50/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <DialogClose className="px-4 py-2 rounded-xl border border-black/10 text-xs text-slate-600 hover:bg-black/5 transition-all">
                Cancel
              </DialogClose>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmText.trim() !== "DELETE" || isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Everything"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
