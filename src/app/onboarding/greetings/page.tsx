"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { MessageSquareHeart, ArrowLeft, Sparkles, Check, Rocket } from "lucide-react";
import { useAudio } from "@/components/AudioController";

const GREETING_PRESETS = [
  {
    title: "Warm & Welcoming",
    text: "Welcome! Browse our services and curated products below to reserve your appointment with instant confirmation.",
  },
  {
    title: "Refined & Direct",
    text: "Welcome. Please select your preferred time slot or custom order to proceed with direct booking.",
  },
  {
    title: "Boutique Experience",
    text: "Welcome to our private studio space. Explore our signature sessions and artisanal goods crafted just for you.",
  },
];

export default function ClientGreetingsStep() {
  const { data, updateData, goBack, completeOnboarding, skipAllToDashboard, isSaving } = useOnboarding();
  const { playClick, playSuccess } = useAudio();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(() => {
    const idx = GREETING_PRESETS.findIndex((p) => p.text === data.greetings);
    return idx >= 0 ? idx : 0;
  });

  const cleanName = data.businessName || "Our Studio";

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();
    await completeOnboarding();
  };

  const handleSkip = async () => {
    playClick();
    await skipAllToDashboard();
  };

  const handleBack = () => {
    playClick();
    goBack("/onboarding/logo");
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-2">
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Client Welcome Experience</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#105F68] tracking-tight">
          Set your client welcome greeting
        </h1>
        <p className="text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Welcome visitors the moment they land on your Ovelink page. You can customize instructions or friendly greetings.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
        {/* Preset Tone of Voice Chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#3A9295] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
            <span>Tone of Voice Presets:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {GREETING_PRESETS.map((preset, idx) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  playClick();
                  setSelectedPreset(idx);
                  updateData({ greetings: preset.text });
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPreset === idx
                    ? "border-[#105F68] bg-[#C8E6E2]/40 text-[#105F68] shadow-xs"
                    : "border-black/5 bg-[#F6FAF9] text-slate-600 hover:border-[#105F68]/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{preset.title}</span>
                  {selectedPreset === idx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#105F68]" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleComplete} className="space-y-6">
          {/* Greeting Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                Welcome Message / Instructions
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {data.greetings.length} / 280
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={280}
              value={data.greetings}
              onChange={(e) => {
                setSelectedPreset(null);
                updateData({ greetings: e.target.value });
              }}
              placeholder="e.g. Welcome! Explore our signature offerings and select an available time slot below."
              className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-normal text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner resize-none"
            />
          </div>

          {/* Live Storefront Announcement Banner Preview */}
          <div className="space-y-2">
            <span className="text-xs text-[#3A9295] font-medium block">
              Storefront Greeting Banner Preview:
            </span>

            <div className="p-4 rounded-3xl bg-gradient-to-r from-[#105F68] via-[#0D4F57] to-[#105F68] text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#63C1BB]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-[#63C1BB]/25 flex items-center justify-center flex-shrink-0 text-[#C8E6E2] mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-[#C8E6E2]">
                    {cleanName} Storefront
                  </span>
                  <p className="text-xs font-light text-white/90 leading-relaxed">
                    {data.greetings || "Welcome! Select an offering below to book or place your order."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full border border-black/10 hover:border-black/20 text-[#3A9295] hover:text-[#105F68] text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:flex-1 py-4 px-6 rounded-full bg-gradient-to-r from-[#105F68] to-[#0D4F57] hover:from-[#0D4F57] hover:to-[#0A3C42] text-white text-xs sm:text-sm font-medium tracking-wide transition-all shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Configuring Workspace...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-[#63C1BB] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Launch Workspace &amp; Open Dashboard</span>
                  <Check className="w-4 h-4 text-[#C8E6E2]" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-3.5 rounded-full border border-black/10 hover:border-black/20 text-[#3A9295] hover:text-[#105F68] text-xs sm:text-sm font-medium transition-colors text-center disabled:opacity-50"
            >
              Skip &amp; Open Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
