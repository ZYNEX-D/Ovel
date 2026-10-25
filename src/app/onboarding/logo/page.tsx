"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Image as ImageIcon, ArrowRight, ArrowLeft, Sparkles, Smartphone } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import { AvatarUpload } from "@/components/arc/avatar-upload/avatar-upload";

const MONOGRAM_PALETTES = [
  { name: "Teal Signature", gradient: "from-[#105F68] to-[#0D4F57]", text: "#C8E6E2" },
  { name: "Mint Fresh", gradient: "from-[#63C1BB] to-[#105F68]", text: "#FFFFFF" },
  { name: "Sage Emerald", gradient: "from-[#059669] to-[#047857]", text: "#ECFDF5" },
  { name: "Obsidian Noir", gradient: "from-[#18181B] to-[#27272A]", text: "#F4F4F5" },
  { name: "Warm Amber", gradient: "from-[#D97706] to-[#B45309]", text: "#FFFBEB" },
];

export default function BrandLogoStep() {
  const { data, updateData, goNext, goBack, skipStep } = useOnboarding();
  const { playClick, playSuccess } = useAudio();
  const [selectedPalette, setSelectedPalette] = useState(() => {
    return MONOGRAM_PALETTES.find((p) => p.gradient === data.coverGradient) || MONOGRAM_PALETTES[0];
  });

  const cleanName = data.businessName || "My Business";
  const initials = data.avatarInitials || cleanName.slice(0, 2).toUpperCase();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    goNext(4, "/onboarding/greetings");
  };

  const handleSkip = () => {
    playClick();
    skipStep(4, "/onboarding/greetings");
  };

  const handleBack = () => {
    playClick();
    goBack("/onboarding/offering");
  };

  // Convert blob to Data URL for instant persistent local and server sync
  const handleAvatarUpload = async (
    imageBlob: Blob,
    { report }: { report: (progress: number) => void }
  ): Promise<string> => {
    report(0.3);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        report(0.85);
        const resultUrl = e.target?.result as string;
        updateData({ logoUrl: resultUrl });
        playSuccess();
        report(1);
        resolve(resultUrl);
      };
      reader.readAsDataURL(imageBlob);
    });
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-2">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visual Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#105F68] tracking-tight">
          Upload your brand logo
        </h1>
        <p className="text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Click or drop a photo onto the avatar to crop it in place with drag, pinch and zoom. It uploads through a progress ring and settles.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          {/* Arc Pro AvatarUpload Component */}
          <div className="p-5 rounded-3xl bg-[#F6FAF9] border border-[#105F68]/15 flex flex-col items-center sm:items-start justify-center">
            <AvatarUpload
              name={cleanName}
              src={data.logoUrl || undefined}
              size={96}
              outputSize={160}
              label="Brand Logo & Avatar"
              hint={
                <span className="text-[11px] text-[#3A9295]">
                  Click or drop a logo to crop in-place with zoom and drag. PNG, JPG or WebP up to 5 MB.
                </span>
              }
              onUpload={handleAvatarUpload}
              onRemove={() => {
                playClick();
                updateData({ logoUrl: "" });
              }}
            />
          </div>

          {/* Monogram Fallback Color Palette */}
          {!data.logoUrl && (
            <div className="space-y-2 p-4 rounded-3xl bg-[#F0F5F4] border border-black/5">
              <div className="flex items-center justify-between text-xs text-[#105F68] font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
                  Or pick a brand monogram palette:
                </span>
                <span className="font-mono text-[11px] text-[#3A9295]">
                  Initials: {initials}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {MONOGRAM_PALETTES.map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedPalette(pal);
                      updateData({ coverGradient: pal.gradient });
                    }}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${pal.gradient} transition-transform ${
                      selectedPalette.name === pal.name
                        ? "ring-2 ring-[#105F68] ring-offset-2 scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    title={pal.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Mobile Storefront Header Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[#3A9295] font-medium">
              <Smartphone className="w-3.5 h-3.5 text-[#105F68]" />
              <span>Live Client Header Preview:</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-xs flex items-center gap-3.5">
              {data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.logoUrl}
                  alt="Storefront Header Logo"
                  className="w-12 h-12 rounded-2xl object-cover border border-black/10 shadow-xs"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPalette.gradient} flex items-center justify-center font-bold text-base shadow-inner`}
                  style={{ color: selectedPalette.text }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-[#105F68] truncate">
                    {cleanName}
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  {data.businessTagline || "Online Bookings & Instant Confirmation"}
                </p>
                <span className="text-[9px] font-mono text-[#3A9295]">
                  ovel.lk/l/{data.businessSlug || "my-brand"}
                </span>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#105F68]/10 text-[#105F68] font-medium hidden sm:inline-block">
                Storefront
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full border border-black/10 hover:border-black/20 text-[#3A9295] hover:text-[#105F68] text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-medium tracking-wide transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 group"
            >
              <span>Continue to Greetings</span>
              <ArrowRight className="w-4 h-4 text-[#63C1BB] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full border border-black/10 hover:border-black/20 text-[#3A9295] hover:text-[#105F68] text-xs sm:text-sm font-medium transition-colors text-center"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
