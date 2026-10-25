"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Sparkles, ShoppingBag, Layers, ArrowRight, ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import { BusinessType } from "@/lib/auth-context";
import ArcBadge from "@/components/ui/ArcBadge";

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
      "Calendar bookings, time-slot allocation, staff rosters, and client appointments with automatic confirmation.",
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
      "The complete platform: offer bookable calendar appointments alongside physical retail items in one seamless client storefront.",
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
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-2">
          <Layers className="w-3.5 h-3.5" />
          <span>Catalog Structure</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light text-[#105F68] tracking-tight">
          What does your business offer?
        </h1>
        <p className="text-sm text-[#3A9295] max-w-lg mx-auto leading-relaxed">
          Select your offering model. This tailors your sidebar tabs and storefront layout to match your operations.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                  className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? "border-[#105F68] bg-[#F6FAF9] shadow-md scale-[1.02]"
                      : "border-black/10 bg-white hover:border-[#105F68]/30 hover:bg-[#F6FAF9]/50"
                  }`}
                >
                  {/* Selected checkmark floating pill */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#105F68] text-white"
                          : "bg-black/5 text-[#3A9295]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-black/10" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#105F68]">
                        {opt.title}
                      </h3>
                      {opt.id === "both" && (
                        <ArcBadge variant="teal" size="xs">
                          {opt.badge}
                        </ArcBadge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {opt.description}
                    </p>

                    <div className="pt-2 border-t border-black/5 flex flex-wrap gap-1">
                      {opt.features.map((feat) => (
                        <span
                          key={feat}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/5 text-slate-600 font-medium"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#C8E6E2]/25 border border-[#9ED5D1]/40 text-xs text-[#105F68] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#105F68] flex-shrink-0" />
            <span>
              You can toggle between Services, Products, or Both anytime from your Workspace Settings.
            </span>
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
              <span>Continue to Brand Logo</span>
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
