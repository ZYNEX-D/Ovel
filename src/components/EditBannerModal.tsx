"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  Upload,
  Check,
  X,
  Palette,
  Eye,
  RefreshCw,
  Trash2,
  Sliders,
  ExternalLink
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/arc/dialog/dialog";
import { FileDropzone } from "@/components/arc/file-dropzone/file-dropzone";
import { ArcBadge } from "@/components/ui/ArcBadge";
import { useAudio } from "@/components/AudioController";

export interface EditBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGradient?: string;
  currentImageUrl?: string;
  storeName?: string;
  avatarInitials?: string;
  onSave: (banner: { coverGradient: string; coverImageUrl?: string }) => void;
}

export const BANNER_PRESETS = [
  {
    id: "clinic-modern",
    name: "Aesthetic Atelier & Clinic",
    category: "Medical & Spa",
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#105F68] to-[#0D4F57]"
  },
  {
    id: "spa-zen",
    name: "Luxury Wellness Sanctuary",
    category: "Wellness & Beauty",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#14532D] to-[#166534]"
  },
  {
    id: "dark-minimal",
    name: "Architectural Noir Lounge",
    category: "Studio & Hospitality",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#0F172A] to-[#1E293B]"
  },
  {
    id: "botanical-organic",
    name: "Minimal Botanical Haven",
    category: "Organic & Lifestyle",
    url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#14532D] to-[#0F766E]"
  },
  {
    id: "artisan-gourmet",
    name: "Artisan Roastery & Dining",
    category: "Food & Beverage",
    url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#78350F] to-[#92400E]"
  },
  {
    id: "boutique-fashion",
    name: "Haute Couture & Boutique",
    category: "Retail & Fashion",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#BE123C] to-[#E11D48]"
  },
  {
    id: "creative-loft",
    name: "Modern Design Workspace",
    category: "Creative Agency",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#18181B] to-[#27272A]"
  },
  {
    id: "violet-sunset",
    name: "Cosmic Twilight Lounge",
    category: "Entertainment & Nightlife",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    gradient: "from-[#4A044E] to-[#6B21A8]"
  }
];

export const GRADIENT_PALETTES = [
  { id: "signature-teal", name: "Ovel Signature Teal", gradient: "from-[#105F68] to-[#0D4F57]", swatch: "#105F68" },
  { id: "obsidian-slate", name: "Obsidian Slate", gradient: "from-[#0F172A] to-[#1E293B]", swatch: "#0F172A" },
  { id: "midnight-indigo", name: "Royal Midnight", gradient: "from-[#1E1B4B] to-[#312E81]", swatch: "#1E1B4B" },
  { id: "amber-luxury", name: "Amber Gold", gradient: "from-[#78350F] to-[#92400E]", swatch: "#78350F" },
  { id: "emerald-forest", name: "Emerald Forest", gradient: "from-[#14532D] to-[#166534]", swatch: "#14532D" },
  { id: "velvet-rose", name: "Velvet Rose", gradient: "from-[#BE123C] to-[#E11D48]", swatch: "#BE123C" },
  { id: "midnight-violet", name: "Midnight Violet", gradient: "from-[#4A044E] to-[#6B21A8]", swatch: "#4A044E" },
  { id: "carbon-onyx", name: "Carbon Onyx", gradient: "from-[#18181B] to-[#27272A]", swatch: "#18181B" },
  { id: "ocean-cerulean", name: "Ocean Indigo", gradient: "from-[#0369A1] to-[#075985]", swatch: "#0369A1" }
];

export default function EditBannerModal({
  open,
  onOpenChange,
  currentGradient = "from-[#105F68] to-[#0D4F57]",
  currentImageUrl = "",
  storeName = "Storefront",
  avatarInitials = "OV",
  onSave
}: EditBannerModalProps) {
  const { playClick, playSuccess } = useAudio();
  const [selectedGradient, setSelectedGradient] = useState(currentGradient);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "gradient">("presets");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (open) {
      setSelectedGradient(currentGradient || "from-[#105F68] to-[#0D4F57]");
      setImageUrl(currentImageUrl || "");
    }
  }, [open, currentGradient, currentImageUrl]);

  const handleApplyPreset = (preset: typeof BANNER_PRESETS[0]) => {
    playClick();
    setImageUrl(preset.url);
    setSelectedGradient(preset.gradient);
  };

  const handleSelectGradient = (grad: string) => {
    playClick();
    setSelectedGradient(grad);
  };

  const handleRemoveImage = () => {
    playClick();
    setImageUrl("");
  };

  const handleSave = () => {
    playSuccess();
    onSave({
      coverGradient: selectedGradient,
      coverImageUrl: imageUrl.trim() || undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Edit Storefront Cover Banner"
        description="Customize the header banner displayed at the top of your public storefront and merchant dashboard."
        size="2xl"
      >
        <div className="space-y-5 pt-1 text-slate-800">
          {/* Live Preview Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 px-1">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#105F68]" />
                <span>Live Banner Preview</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    previewMode === "desktop"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                    previewMode === "mobile"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Banner Container */}
            <div
              className={`w-full rounded-2xl bg-gradient-to-r ${selectedGradient} relative transition-all duration-300 bg-cover bg-center overflow-hidden border border-black/10 shadow-sm ${
                previewMode === "desktop" ? "h-36 sm:h-44" : "h-28 max-w-sm mx-auto"
              }`}
              style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
            >
              {/* Overlay sheen */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              {/* Mock Storefront Header */}
              <div className="absolute inset-x-0 top-3 px-4 flex items-center justify-between z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium">
                  <span className="opacity-75">powered by</span>
                  <span className="font-bold tracking-wide">Ovel</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Preview</span>
                </span>
              </div>

              {/* Mock Brand Monogram & Title at bottom of banner */}
              <div className="absolute inset-x-0 bottom-3 px-4 flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-xl bg-white shadow-md border-2 border-white flex items-center justify-center font-bold text-[#105F68] text-sm shrink-0">
                  {avatarInitials || "OV"}
                </div>
                <div className="min-w-0 text-white drop-shadow-sm">
                  <h4 className="text-sm font-semibold truncate leading-tight">{storeName}</h4>
                  <p className="text-[11px] opacity-80 truncate">Cover banner atmosphere</p>
                </div>
              </div>

              {/* Quick Remove Overlay Button if image is set */}
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-20 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-[10px] font-medium transition-all flex items-center gap-1 z-20 cursor-pointer"
                  title="Remove image (use gradient only)"
                >
                  <Trash2 className="w-3 h-3 text-red-300" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>
          </div>

          {/* Configuration Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex gap-2 -mb-px">
              <button
                type="button"
                onClick={() => { playClick(); setActiveTab("presets"); }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-xs font-medium transition-all ${
                  activeTab === "presets"
                    ? "border-[#105F68] text-[#105F68]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Presets</span>
              </button>

              <button
                type="button"
                onClick={() => { playClick(); setActiveTab("custom"); }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-xs font-medium transition-all ${
                  activeTab === "custom"
                    ? "border-[#105F68] text-[#105F68]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload / Image URL</span>
              </button>

              <button
                type="button"
                onClick={() => { playClick(); setActiveTab("gradient"); }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-xs font-medium transition-all ${
                  activeTab === "gradient"
                    ? "border-[#105F68] text-[#105F68]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Gradient Palette</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Curated Presets */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select a high-resolution, curated banner tailored for premium businesses:</span>
                <span className="text-[11px] font-medium text-[#105F68]">{BANNER_PRESETS.length} styles</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                {BANNER_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#105F68] ring-2 ring-[#105F68]/20 shadow-sm"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div
                        className="h-20 w-full bg-cover bg-center transition-transform group-hover:scale-105"
                        style={{ backgroundImage: `url(${preset.url})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </div>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#105F68] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="p-2 bg-white">
                        <p className="text-[11px] font-semibold text-slate-900 truncate leading-tight">
                          {preset.name}
                        </p>
                        <p className="text-[9.5px] text-slate-500 truncate mt-0.5">
                          {preset.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Custom Upload & URL */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Upload From Your Device
                </label>
                <FileDropzone
                  label="Upload Banner Photo"
                  description="PNG, JPG, or WEBP up to 5MB (recommended: 1600x400 or higher)"
                  accept="image/png,image/jpeg,image/webp"
                  multiple={false}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  compactAt={1}
                  defaultItems={
                    imageUrl && imageUrl.startsWith("data:")
                      ? [
                          {
                            id: "custom_banner_data",
                            name: "Uploaded Device Banner",
                            size: 1024 * 400,
                            status: "complete",
                            preview: imageUrl
                          }
                        ]
                      : []
                  }
                  onUpload={async (item, { onProgress }) => {
                    if (item.file) {
                      onProgress(30);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        onProgress(85);
                        const dataUrl = e.target?.result as string;
                        setImageUrl(dataUrl);
                        onProgress(100);
                      };
                      reader.readAsDataURL(item.file);
                    }
                  }}
                  onFilesChange={(files) => {
                    if (files.length === 0 && imageUrl.startsWith("data:")) {
                      setImageUrl("");
                    }
                  }}
                />
              </div>

              {/* Direct Image URL input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Or Paste External Image URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or https://your-cdn.com/banner.jpg"
                      value={imageUrl.startsWith("data:") ? "" : imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all font-mono"
                    />
                  </div>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-all shrink-0 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports any secure image link (Unsplash, Imgur, AWS S3, Cloudinary).
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Gradient Atmosphere */}
          {activeTab === "gradient" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Select a backdrop gradient atmosphere (rendered underneath photos or standalone):</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {GRADIENT_PALETTES.map((pal) => {
                  const isSelected = selectedGradient === pal.gradient;
                  return (
                    <div
                      key={pal.id}
                      onClick={() => handleSelectGradient(pal.gradient)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#105F68] bg-[#105F68]/5 ring-1 ring-[#105F68]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-r ${pal.gradient} shrink-0 shadow-xs border border-black/10 flex items-center justify-center text-white`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate leading-tight">
                          {pal.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">
                          {pal.swatch}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { playClick(); onOpenChange(false); }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply &amp; Save Banner</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
