"use client";

import React, { useEffect } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Globe2, Store } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import confetti from "canvas-confetti";

export default function WelcomeStep() {
  const { data, goBack, completeOnboarding, isSaving } = useOnboarding();
  const { playClick, playSuccess } = useAudio();

  const cleanName = data.businessName.trim() || "Partner";
  const slug = data.businessSlug.trim() || "my-brand";
  const offeringLabel =
    data.businessType === "services"
      ? "Services & Appointments"
      : data.businessType === "products"
      ? "Products & Inventory"
      : "Unified Services & Products";

  useEffect(() => {
    // Gentle welcome confetti burst on arrival
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#105F68", "#63C1BB", "#C8E6E2"],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
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
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome from Ovel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Welcome to Ovel, {cleanName}!
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          Your business workspace has been created and configured. Here is what Ovel has prepared for you.
        </p>
      </div>

      {/* Main Welcome Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        {/* Welcome Message from Ovel */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#F6FAF9] to-[#EBF5F4] border border-[#105F68]/15 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#105F68] text-white flex items-center justify-center shadow-2xs flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#63C1BB]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#105F68]">
                We are thrilled to partner with you
              </h2>
              <p className="text-[11px] text-[#3A9295]">
                Built for independent studios, creators, and modern merchants.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Welcome to your unified business hub. With Ovel, you can accept calendar bookings, track retail orders, issue invoices, and manage clients without commission fees.
          </p>
        </div>

        {/* Workspace Summary Specs */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-semibold text-[#105F68] uppercase tracking-wider block">
            Workspace Overview
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F8FAF9] flex items-start gap-2.5">
              <Globe2 className="w-4 h-4 text-[#105F68] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-medium block">Live Storefront URL</span>
                <span className="text-xs font-semibold text-[#105F68] truncate block">
                  /book/{slug}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F8FAF9] flex items-start gap-2.5">
              <Store className="w-4 h-4 text-[#105F68] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-medium block">Catalog Structure</span>
                <span className="text-xs font-semibold text-[#105F68] truncate block">
                  {offeringLabel}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F8FAF9] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#105F68] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-medium block">Platform Commission</span>
                <span className="text-xs font-semibold text-[#105F68] truncate block">
                  0% Take-rate (Keep 100%)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-black/[0.06] bg-[#F8FAF9] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#105F68] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-medium block">Client Portal</span>
                <span className="text-xs font-semibold text-[#105F68] truncate block">
                  Active &amp; Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Note */}
        <div className="p-3 rounded-xl bg-[#F8FAF9] border border-black/[0.06] text-[11px] text-[#105F68] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#105F68] flex-shrink-0" />
          <span>
            You can configure customized client arrival notes or payment instructions anytime in Business Settings.
          </span>
        </div>

        {/* Minimal Action Bar */}
        <form onSubmit={handleLaunch} className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
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
                <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
