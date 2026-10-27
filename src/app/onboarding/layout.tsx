"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InterludeWipeProvider } from "@/components/InterludeWipeTransition";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding-context";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { path: "/onboarding/name", label: "Business Name", step: 1 },
  { path: "/onboarding/bio", label: "Bio & Tagline", step: 2 },
  { path: "/onboarding/offering", label: "Offering Type", step: 3 },
  { path: "/onboarding/logo", label: "Brand Logo", step: 4 },
  { path: "/onboarding/greetings", label: "Welcome to Ovel", step: 5 },
];

function OnboardingHeader() {
  const pathname = usePathname();
  const { skipAllToDashboard, isSaving } = useOnboarding();

  const currentStep = STEPS.find((s) => s.path === pathname) || STEPS[0];
  const progressPercent = (currentStep.step / STEPS.length) * 100;

  return (
    <header className="w-full max-w-4xl mx-auto pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between border-b border-black/[0.05] mb-8">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex items-center">
          <span className="font-['Disolve'] text-2xl sm:text-3xl text-[#105F68] tracking-tight hover:opacity-90 transition-opacity">
            Ovel
          </span>
        </Link>
        <span className="text-black/20 text-xs hidden sm:inline">/</span>
        <span className="text-xs text-[#3A9295] hidden sm:inline font-medium">
          Workspace Setup
        </span>
      </div>

      {/* Progress & Navigation */}
      <div className="flex items-center gap-5 sm:gap-6">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-normal">
              Step {currentStep.step} of {STEPS.length}
            </span>
            <span className="w-1 h-1 rounded-full bg-black/20" />
            <span className="font-medium text-[#105F68]">
              {currentStep.label}
            </span>
          </div>
          <div className="w-24 sm:w-32 h-1 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#105F68] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Global Skip to Dashboard Link */}
        <button
          type="button"
          onClick={skipAllToDashboard}
          disabled={isSaving}
          className="text-xs text-slate-400 hover:text-[#105F68] font-medium transition-colors flex items-center gap-1 group disabled:opacity-50"
          title="Skip setup and go directly to your dashboard"
        >
          <span>{isSaving ? "Finalizing..." : "Skip to Dashboard"}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-[#105F68]" />
        </button>
      </div>
    </header>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <InterludeWipeProvider>
      <OnboardingProvider>
        <div className="min-h-screen bg-[#F8FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle luminous ambient glows */}
          <div className="absolute top-10 right-0 w-[24rem] h-[24rem] bg-[#C8E6E2]/35 rounded-full blur-[110px] pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-0 w-[24rem] h-[24rem] bg-[#9ED5D1]/25 rounded-full blur-[120px] pointer-events-none -z-10" />

          {/* Sticky Header */}
          <OnboardingHeader />

          {/* Main Question View Area */}
          <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-4 w-full max-w-3xl mx-auto">
            {children}
          </main>

          {/* Minimal Footer */}
          <footer className="w-full text-center py-5 text-[11px] text-[#3A9295]/60 border-t border-black/[0.04]">
            <span>You can customize and update all settings anytime in your Business Settings.</span>
          </footer>
        </div>
      </OnboardingProvider>
    </InterludeWipeProvider>
  );
}
