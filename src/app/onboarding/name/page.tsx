"use client";

import React, { useState } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Building2, ArrowRight, Globe, Sparkles, Check } from "lucide-react";
import { useAudio } from "@/components/AudioController";

const SUGGESTIONS = [
  "Studio & Wellness",
  "Aesthetics & Beauty",
  "Artisanal Boutique",
  "Creative Lab",
  "Specialist Practice",
];

export default function BusinessNameStep() {
  const { data, updateData, goNext, skipStep } = useOnboarding();
  const { playClick } = useAudio();
  const [error, setError] = useState<string | null>(null);

  const cleanName = data.businessName.trim();
  const displaySlug = data.businessSlug || "my-brand";

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName) {
      setError("Please enter your business name or click 'Skip for now'.");
      return;
    }
    setError(null);
    playClick();
    goNext(1, "/onboarding/bio");
  };

  const handleSkip = () => {
    playClick();
    if (!cleanName) {
      updateData({ businessName: "My Business", businessSlug: "my-business" });
    }
    skipStep(1, "/onboarding/bio");
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand Identity</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#105F68] tracking-tight">
          What is your business name?
        </h1>
        <p className="text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          This is the name clients and customers will see on your booking portal, storefront, and invoices.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-[#105F68] uppercase tracking-wider block mb-2">
              Business or Studio Name
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={data.businessName}
                onChange={(e) => {
                  setError(null);
                  updateData({ businessName: e.target.value });
                }}
                placeholder="e.g. Lumina Skin & Wellness"
                className="w-full pl-4 pr-12 py-4 rounded-2xl bg-[#F6FAF9] border border-black/10 text-base sm:text-lg font-medium text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner"
              />
              <div className="absolute right-4 top-4 text-[#3A9295]">
                {cleanName ? (
                  <Check className="w-5 h-5 text-emerald-600 animate-in zoom-in-75 duration-200" />
                ) : (
                  <Sparkles className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 mt-2 font-medium animate-shake">
                {error}
              </p>
            )}
          </div>

          {/* Public Storefront URL Live Preview */}
          <div className="p-4 rounded-2xl bg-[#F0F5F4] border border-[#105F68]/15 space-y-1.5 transition-all">
            <div className="flex items-center justify-between text-[11px] text-[#3A9295]">
              <span className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-[#105F68]" />
                Your Public Ovelink Storefront:
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                Available
              </span>
            </div>
            <div className="font-mono text-xs sm:text-sm text-[#105F68] font-semibold break-all bg-white px-3 py-2 rounded-xl border border-black/5 shadow-xs flex items-center justify-between">
              <span>
                https://ovel.lk/l/<span className="text-[#3A9295]">{displaySlug}</span>
              </span>
            </div>
          </div>

          {/* Quick inspiration suggestion chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#3A9295] font-medium block">
              Quick Ideas / Suffixes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suffix) => (
                <button
                  key={suffix}
                  type="button"
                  onClick={() => {
                    playClick();
                    const base = cleanName || "Aura";
                    if (!cleanName.includes(suffix)) {
                      updateData({ businessName: `${base} ${suffix}`.trim() });
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#F6FAF9] hover:bg-[#C8E6E2]/40 text-[#105F68] text-xs font-normal border border-black/5 hover:border-[#105F68]/20 transition-all hover:scale-105 active:scale-95"
                >
                  +{suffix}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:flex-1 py-4 px-6 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-sm font-medium tracking-wide transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 group"
            >
              <span>Continue to Business Bio</span>
              <ArrowRight className="w-4 h-4 text-[#63C1BB] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto px-5 py-4 rounded-full border border-black/10 hover:border-black/20 text-[#3A9295] hover:text-[#105F68] text-sm font-medium transition-colors text-center"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
