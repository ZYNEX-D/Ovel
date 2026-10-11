"use client";

import React, { useState, useEffect } from "react";
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
  Share2
} from "lucide-react";
import { 
  getOvelink, 
  PRESET_OVELINKS,
  saveOvelink, 
  OvelinkCustomization, 
  OvelinkOffering, 
  OvelinkFont, 
  THEME_PRESETS, 
  OfferingType,
  OvelinkThemePreset
} from "@/lib/ovelink-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import OvelinkView from "@/components/OvelinkView";

export default function OvelinkStudioPage() {
  const { profile, updateOrganizationDetails } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const defaultSlug = profile?.organizationSlug || "leclat";
  const [activeOvelink, setActiveOvelink] = useState<OvelinkCustomization>(
    () => PRESET_OVELINKS[defaultSlug] || PRESET_OVELINKS["leclat"]
  );

  useEffect(() => {
    setActiveOvelink(getOvelink(defaultSlug));
  }, [defaultSlug]);
  const [studioSubTab, setStudioSubTab] = useState<"branding" | "themes" | "style" | "offerings" | "socials">("branding");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [isAddOfferingOpen, setIsAddOfferingOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Offering State
  const [newOffName, setNewOffName] = useState("");
  const [newOffType, setNewOffType] = useState<OfferingType>("appointment");
  const [newOffDesc, setNewOffDesc] = useState("");
  const [newOffPrice, setNewOffPrice] = useState(95);
  const [newOffDeposit, setNewOffDeposit] = useState(25);
  const [newOffDuration, setNewOffDuration] = useState(45);
  const [newOffBadge, setNewOffBadge] = useState("");
  const [newOffCategory, setNewOffCategory] = useState("General");

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyOvelink = () => {
    playClick();
    const url = typeof window !== "undefined" 
      ? `${window.location.origin}/l/${activeOvelink.slug}` 
      : `https://ovel.app/l/${activeOvelink.slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Ovelink copied: ovel.app/l/${activeOvelink.slug}`);
  };

  const handleSaveOvelinkSettings = () => {
    playSuccess();
    saveOvelink(activeOvelink);
    updateOrganizationDetails(activeOvelink.businessName, activeOvelink.slug);
    showToast(`Ovelink for "${activeOvelink.businessName}" saved & published!`);
  };

  const handleApplyThemePreset = (preset: OvelinkThemePreset) => {
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

  const handleSwitchOvelinkTemplate = (slug: string) => {
    playClick();
    const selected = getOvelink(slug);
    setActiveOvelink(selected);
    showToast(`Loaded "${selected.businessName}" (${selected.businessCategory})`);
  };

  const handleCreateOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffName) return;
    playSuccess();

    const newOff: OvelinkOffering = {
      id: "off_" + Date.now(),
      type: newOffType,
      name: newOffName,
      description: newOffDesc || "Custom offering.",
      priceCents: Math.round(Number(newOffPrice) * 100),
      depositCents: Math.round(Number(newOffDeposit) * 100),
      durationMinutes: newOffType !== "order" ? Number(newOffDuration) : undefined,
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
              { id: "themes" as const, label: "Colors & Palettes", icon: Palette },
              { id: "style" as const, label: "Typography & Shapes", icon: Type },
              { id: "offerings" as const, label: "Offerings & Pricing", icon: ShoppingBag },
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-[#3A9295] font-medium block mb-1">Public Brand Contact Email</label>
                  <input
                    type="email"
                    placeholder="hello@yourbrand.com"
                    value={activeOvelink.email || ""}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Custom Link Slug (ovel.app/l/...)</label>
                  <input
                    type="text"
                    value={activeOvelink.slug}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Category</label>
                  <select
                    value={activeOvelink.businessCategory}
                    onChange={(e) => setActiveOvelink({ ...activeOvelink, businessCategory: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  >
                    <option value="Appointments & Services">Appointments &amp; Services</option>
                    <option value="Auto & Detailing">Auto &amp; Detailing</option>
                    <option value="Custom Orders & Food">Custom Orders &amp; Food</option>
                    <option value="Studios & Rentals">Studios &amp; Rentals</option>
                    <option value="Health & Fitness">Health &amp; Fitness</option>
                    <option value="Consulting & Coaching">Consulting &amp; Coaching</option>
                    <option value="General Business">General Business</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: Colors & Themes */}
          {studioSubTab === "themes" && (
            <div className="space-y-6 text-xs animate-in fade-in duration-150">
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

          {/* Subtab 4: Offerings & Catalog */}
          {studioSubTab === "offerings" && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                    Published Offerings ({activeOvelink.offerings.length})
                  </h4>
                  <p className="text-[#3A9295]">Supports Appointments, Bookings &amp; Orders</p>
                </div>

                <button
                  onClick={() => { playClick(); setIsAddOfferingOpen(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#105F68] text-white font-light text-xs hover:bg-[#0D4F57] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Offering</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {activeOvelink.offerings.map((off) => (
                  <div
                    key={off.id}
                    className="p-3.5 rounded-2xl border border-black/10 bg-[#FBFDFD] flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                          off.type === "appointment"
                            ? "bg-blue-100 text-blue-800"
                            : off.type === "booking"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {off.type}
                        </span>
                        <h5 className="font-semibold text-[#105F68]">{off.name}</h5>
                      </div>
                      <p className="text-[#3A9295] text-[11px] mt-0.5 line-clamp-1">{off.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#105F68] block">
                        ${(off.priceCents / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">
                        Dep: ${(off.depositCents / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleOffering(off.id)}
                        className={`text-[10px] px-2 py-1 rounded-md border ${
                          off.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {off.isActive ? "Active" : "Hidden"}
                      </button>

                      <button
                        onClick={() => handleRemoveOffering(off.id)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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

              <div className="w-full h-full overflow-y-auto scrollbar-thin">
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
                  <label className="text-[#3A9295] font-medium block mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={newOffPrice}
                    onChange={(e) => setNewOffPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68]"
                  />
                </div>
                <div>
                  <label className="text-[#3A9295] font-medium block mb-1">Deposit ($)</label>
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
