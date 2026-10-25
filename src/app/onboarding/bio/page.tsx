"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { FileText, ArrowRight, ArrowLeft, Sparkles, Feather } from "lucide-react";
import { useAudio } from "@/components/AudioController";

const BIO_TEMPLATES = [
  {
    name: "Luxury Boutique",
    tagline: "Bespoke appointments & artisanal collections",
    bio: "Dedicated to refined craftsmanship, personalized care, and effortless scheduling. Reserve your session or explore curated products.",
  },
  {
    name: "Wellness & Balance",
    tagline: "Mindful sessions & restorative essentials",
    bio: "Offering tranquil consultations and holistic goods designed to elevate your everyday wellbeing. Instant confirmation on all appointments.",
  },
  {
    name: "Creative Studio",
    tagline: "Professional studio sessions & bespoke deliverables",
    bio: "Bringing visionary projects to life with seamless client collaboration, clear quotes, and dedicated calendar slots.",
  },
];

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
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Profile & Storefront Story</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#105F68] tracking-tight">
          What is your business story?
        </h1>
        <p className="text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Introduce your brand to clients with a concise tagline and bio displayed on your booking page.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
        {/* Quick Inspiration Templates */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#3A9295] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
            <span>Select a Storytelling Template:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {BIO_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => {
                  playClick();
                  updateData({
                    businessTagline: tmpl.tagline,
                    businessBio: tmpl.bio,
                  });
                }}
                className="p-3 rounded-2xl bg-[#F6FAF9] hover:bg-[#C8E6E2]/35 border border-black/5 hover:border-[#105F68]/20 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#105F68] mb-1">
                  <Feather className="w-3 h-3 text-[#3A9295] group-hover:text-[#105F68]" />
                  <span>{tmpl.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {tmpl.tagline}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* Tagline */}
          <div>
            <label className="text-xs font-semibold text-[#105F68] uppercase tracking-wider block mb-1.5">
              Brand Tagline
            </label>
            <input
              type="text"
              value={data.businessTagline}
              onChange={(e) => updateData({ businessTagline: e.target.value })}
              placeholder="e.g. Bespoke skincare & mindful restorative sessions"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-medium text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner"
            />
            <p className="text-[11px] text-[#3A9295] mt-1">
              Shown directly beneath your business name on mobile and desktop.
            </p>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#105F68] uppercase tracking-wider">
                Business Bio / Description
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {data.businessBio.length} / 400
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={400}
              value={data.businessBio}
              onChange={(e) => updateData({ businessBio: e.target.value })}
              placeholder="Share a short summary about your background, signature offerings, and what makes your client experience special..."
              className="w-full px-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-normal text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner resize-none"
            />
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
              <span>Continue to Offering Type</span>
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
