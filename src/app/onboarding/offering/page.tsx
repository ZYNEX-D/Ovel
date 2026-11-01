"use client";

import React from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Sparkles, ShoppingBag, Layers, ArrowRight, Check } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import { BusinessType } from "@/lib/auth-context";

const OFFERING_OPTIONS: Array<{
  id: BusinessType;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  description: string;
  recommended?: boolean;
}> = [
  {
    id: "services",
    title: "Services",
    subtitle: "Bookings & calendar",
    icon: Sparkles,
    description:
      "Appointments, calendar time-slots, staff rosters, and automated WhatsApp booking confirmations.",
  },
  {
    id: "products",
    title: "Products",
    subtitle: "Retail & inventory",
    icon: ShoppingBag,
    description:
      "Physical merchandise, stock tracking, inventory management, and unified product checkouts.",
  },
  {
    id: "both",
    title: "Both",
    subtitle: "Unified operations",
    icon: Layers,
    description:
      "The complete suite: bookable appointments alongside physical retail goods in one seamless storefront.",
    recommended: true,
  },
];

export default function OfferingTypeStep() {
  const { data, updateData, goNext, skipStep } = useOnboarding();
  const { playClick, playSuccess } = useAudio();

  const selectedType = data.businessType || "both";

  const handleSelect = (type: BusinessType) => {
    playClick();
    updateData({ businessType: type });
    if (typeof window !== "undefined") {
      localStorage.setItem("ovel_selected_business_type", type);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    playSuccess();
    goNext(1, "/onboarding/name");
  };

  const handleSkip = () => {
    playClick();
    if (!data.businessType) {
      updateData({ businessType: "both" });
    }
    skipStep(1, "/onboarding/name");
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-semibold uppercase tracking-wider border border-[#105F68]/15 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Step 1 · Business Offering</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#103438] tracking-tight">
          What do you offer?
        </h1>
        <p className="text-xs sm:text-sm text-[#103438]/70 max-w-md mx-auto leading-relaxed">
          Select your offering model. This tailors your storefront layout and dashboard navigation.
        </p>
      </div>

      {/* Main Options Grid */}
      <form onSubmit={handleContinue} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OFFERING_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedType === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? "border-[#105F68] bg-white shadow-md ring-2 ring-[#105F68]/20 -translate-y-0.5"
                    : "border-[#103438]/15 bg-white/70 hover:border-[#103438]/30 hover:bg-white hover:shadow-xs"
                }`}
              >
                {/* Header Icon + Selected Badge */}
                <div>
                  <div className="flex items-center justify-between w-full mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[#103438] text-white shadow-xs"
                          : "bg-[#103438]/5 text-[#103438]/70 group-hover:bg-[#103438]/10"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#105F68] text-white flex items-center justify-center shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : opt.recommended ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#105F68] bg-[#105F68]/10 px-2 py-0.5 rounded-full font-semibold">
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-lg font-semibold text-[#103438] tracking-tight">
                    {opt.title}
                  </h3>
                  <p className="text-xs font-medium text-[#105F68] mt-0.5">
                    {opt.subtitle}
                  </p>
                </div>

                <p className="text-xs text-[#103438]/60 mt-3 leading-relaxed pt-3 border-t border-[#103438]/10">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Minimalist Hint */}
        <p className="text-center text-xs text-[#103438]/60">
          You can toggle between Services, Products, or Both anytime in your Business Settings.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#103438]/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-[#103438]/60 hover:text-[#103438] transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#103438] hover:bg-[#0c272a] text-white text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 text-[#C8E6E2] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
