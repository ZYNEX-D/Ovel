"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { MessageSquareHeart, ArrowLeft, Check } from "lucide-react";
import { useAudio } from "@/components/AudioController";

export default function ClientGreetingsStep() {
  const { data, updateData, goBack, completeOnboarding, isSaving } = useOnboarding();
  const { playClick, playSuccess } = useAudio();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();
    await completeOnboarding();
  };

  const handleBack = () => {
    playClick();
    goBack("/onboarding/logo");
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-1">
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Client Welcome Experience</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Set your client welcome greeting
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Welcome visitors the moment they land on your Ovelink page with clear instructions or a warm message.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        <form onSubmit={handleComplete} className="space-y-6">
          {/* Greeting Text Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#105F68] uppercase tracking-wider">
                Welcome Message / Instructions
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {data.greetings.length} / 280
              </span>
            </div>

            <textarea
              rows={4}
              maxLength={280}
              value={data.greetings}
              onChange={(e) => updateData({ greetings: e.target.value })}
              placeholder="e.g. Welcome! Explore our signature offerings and select an available time slot below."
              className="w-full px-4 py-3 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs sm:text-sm font-normal text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/15 focus:border-[#105F68] focus:bg-white transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Minimal Action Bar */}
          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-[#105F68] hover:bg-black/[0.03] transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-tight transition-all shadow-2xs hover:shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Launching Workspace...</span>
                </>
              ) : (
                <>
                  <span>Launch Workspace</span>
                  <Check className="w-4 h-4 text-[#63C1BB]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
