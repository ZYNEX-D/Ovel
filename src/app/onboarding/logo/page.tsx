"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Image as ImageIcon, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
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
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-1">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visual Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Add your brand logo
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Upload a logo or avatar for your client portal, or customize your brand monogram.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          {/* Avatar Upload Container */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAF9] border border-black/[0.06] flex flex-col items-center sm:items-start justify-center">
            <AvatarUpload
              name={cleanName}
              src={data.logoUrl || undefined}
              size={88}
              outputSize={160}
              label="Brand Logo & Avatar"
              hint={
                <span className="text-[11px] text-[#3A9295]">
                  Drop or select a photo to crop in-place. PNG, JPG or WebP up to 5 MB.
                </span>
              }
              onUpload={handleAvatarUpload}
              onRemove={() => {
                playClick();
                updateData({ logoUrl: "" });
              }}
            />
          </div>

          {/* Monogram Palette */}
          {!data.logoUrl && (
            <div className="space-y-2 p-3.5 rounded-xl bg-[#F8FAF9] border border-black/[0.06]">
              <div className="flex items-center justify-between text-xs text-[#105F68] font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
                  Monogram Color Palette:
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
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${pal.gradient} transition-transform ${
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

          {/* Minimal Action Bar */}
          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-[#105F68] hover:bg-black/[0.03] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-black/[0.02] transition-colors"
              >
                Skip for now
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-tight transition-all shadow-2xs hover:shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#63C1BB]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
