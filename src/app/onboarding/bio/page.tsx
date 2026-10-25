"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { FileText, ArrowRight, ArrowLeft } from "lucide-react";
import { useAudio } from "@/components/AudioController";

export default function BusinessBioStep() {
  const { data, updateData, goNext, goBack, skipStep } = useOnboarding();
  const { playClick } = useAudio();

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    goNext(2, "/onboarding/offering");
  };

  const handleSkip = () => {
    playClick();
    skipStep(2, "/onboarding/offering");
  };

  const handleBack = () => {
    playClick();
    goBack("/onboarding/name");
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Profile & Storefront Story</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          What is your business story?
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Introduce your brand to clients with a concise tagline and bio displayed on your booking page.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        <form onSubmit={handleContinue} className="space-y-5">
          {/* Tagline */}
          <div>
            <label className="text-[11px] font-semibold text-[#105F68] uppercase tracking-wider block mb-1.5">
              Brand Tagline
            </label>
            <input
              type="text"
              value={data.businessTagline}
              onChange={(e) => updateData({ businessTagline: e.target.value })}
              placeholder="e.g. Bespoke skincare & mindful restorative sessions"
              className="w-full px-4 py-3 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-medium text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/15 focus:border-[#105F68] focus:bg-white transition-all shadow-2xs"
            />
            <p className="text-[10px] text-[#3A9295] mt-1">
              Displayed directly beneath your brand name on mobile and desktop storefronts.
            </p>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#105F68] uppercase tracking-wider">
                Business Bio / Description
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {data.businessBio.length} / 400
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={400}
              value={data.businessBio}
              onChange={(e) => updateData({ businessBio: e.target.value })}
              placeholder="Share a short summary about your background, signature offerings, and client experience..."
              className="w-full px-4 py-3 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-normal text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/15 focus:border-[#105F68] focus:bg-white transition-all shadow-2xs resize-none"
            />
          </div>

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
