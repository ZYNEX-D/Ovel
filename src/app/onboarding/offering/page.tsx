"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Sparkles, ShoppingBag, Layers, ArrowRight, ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import { BusinessType } from "@/lib/auth-context";

const OFFERING_OPTIONS: Array<{
  id: BusinessType;
  title: string;
  badge: string;
  icon: typeof Sparkles;
  description: string;
  features: string[];
}> = [
  {
    id: "services",
    title: "Services Only",
    badge: "Appointments & Sessions",
    icon: Sparkles,
    description:
      "Calendar bookings, time-slot allocation, staff rosters, and appointments with automatic confirmation.",
    features: ["Bookable Time Slots", "Staff Scheduling", "Deposit Intake"],
  },
  {
    id: "products",
    title: "Products Only",
    badge: "Retail & Physical Goods",
    icon: ShoppingBag,
    description:
      "Inventory tracking, physical merchandise, order management, and unified product invoices.",
    features: ["Stock Tracking", "Order Processing", "Product Catalogs"],
  },
  {
    id: "both",
    title: "Both (Unified Suite)",
    badge: "Recommended",
    icon: Layers,
    description:
      "The complete platform: offer bookable calendar appointments alongside physical retail items in one client storefront.",
    features: ["All-in-One Catalog", "Combined Invoicing", "Cross-selling"],
  },
];

export default function OfferingTypeStep() {
  const { data, updateData, goNext, goBack, skipStep } = useOnboarding();
  const { playClick } = useAudio();

  const selectedType = data.businessType || "both";

  const handleSelect = (type: BusinessType) => {
    playClick();
    updateData({ businessType: type });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    goNext(3, "/onboarding/logo");
  };

  const handleSkip = () => {
    playClick();
    if (!data.businessType) {
      updateData({ businessType: "both" });
    }
    skipStep(3, "/onboarding/logo");
  };

  const handleBack = () => {
    playClick();
    goBack("/onboarding/bio");
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Catalog Structure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          What does your business offer?
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-lg mx-auto leading-relaxed">
          Select your offering model. This tailors your dashboard navigation and storefront layout.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {OFFERING_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.id;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(opt.id);
                    }
                  }}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? "border-[#105F68] bg-[#F8FAF9] shadow-2xs"
                      : "border-black/[0.08] bg-white hover:border-[#105F68]/30 hover:bg-[#F8FAF9]/50"
                  }`}
                >
                  <div>
                    {/* Top row: Icon and check indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#105F68] text-white"
                            : "bg-black/[0.04] text-[#3A9295]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-black/15" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-semibold text-[#105F68]">
                          {opt.title}
                        </h3>
                        {opt.id === "both" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#105F68]/10 text-[#105F68] font-semibold">
                            Recommended
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-black/[0.05] flex flex-wrap gap-1">
                    {opt.features.map((feat) => (
                      <span
                        key={feat}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-black/[0.03] text-slate-600 font-medium"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAF9] border border-black/[0.06] text-[11px] text-[#105F68] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#105F68] flex-shrink-0" />
            <span>
              You can toggle between Services, Products, or Both anytime in your Business Settings.
            </span>
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
