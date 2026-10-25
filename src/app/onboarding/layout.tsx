"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InterludeWipeProvider } from "@/components/InterludeWipeTransition";
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding-context";
import { ArrowRight, Sparkles } from "lucide-react";
import ArcBadge from "@/components/ui/ArcBadge";

const STEPS = [
  { path: "/onboarding/name", label: "Business Name", step: 1 },
  { path: "/onboarding/bio", label: "Bio & Tagline", step: 2 },
  { path: "/onboarding/offering", label: "Offering Type", step: 3 },
  { path: "/onboarding/logo", label: "Brand Logo", step: 4 },
  { path: "/onboarding/greetings", label: "Client Greetings", step: 5 },
];

function OnboardingHeader() {
  const pathname = usePathname();
  const { skipAllToDashboard, isSaving } = useOnboarding();

  const currentStep = STEPS.find((s) => s.path === pathname) || STEPS[0];
  const progressPercent = (currentStep.step / STEPS.length) * 100;

  return (
    <header className="w-full max-w-4xl mx-auto pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between border-b border-black/[0.06] mb-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="inline-flex items-center">
          <span className="font-['Disolve'] text-3xl sm:text-4xl text-[#105F68] tracking-tight">
            Ovel
          </span>
        </Link>
        <div className="h-5 w-px bg-black/10 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#3A9295]">
          <Sparkles className="w-3.5 h-3.5 text-[#105F68]" />
          <span>Business Workspace Setup</span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Step indicator badge & bar */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#105F68]">
              Step {currentStep.step} of {STEPS.length}
            </span>
            <ArcBadge variant="teal" size="xs">
              {currentStep.label}
            </ArcBadge>
          </div>
          <div className="w-28 sm:w-36 h-1.5 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#105F68] via-[#3A9295] to-[#63C1BB] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Global Skip to Dashboard Button */}
        <button
          type="button"
          onClick={skipAllToDashboard}
          disabled={isSaving}
          className="text-xs text-[#3A9295] hover:text-[#105F68] font-medium transition-colors hover:underline px-2 py-1.5 rounded-lg flex items-center gap-1 group disabled:opacity-50"
          title="Skip setup and go directly to your dashboard"
        >
          <span>{isSaving ? "Finalizing..." : "Skip to Dashboard"}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </header>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <InterludeWipeProvider>
      <OnboardingProvider>
        <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-between relative overflow-hidden">
          {/* Ambient luminous glow background orbs */}
          <div className="absolute top-1/6 -right-24 w-[28rem] h-[28rem] bg-[#C8E6E2]/50 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-1/6 -left-24 w-[28rem] h-[28rem] bg-[#9ED5D1]/40 rounded-full blur-[130px] pointer-events-none -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-[#C8E6E2]/25 rounded-full blur-[140px] pointer-events-none -z-10" />

          {/* Sticky Header */}
          <OnboardingHeader />

          {/* Main Question View Area */}
          <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-6 w-full max-w-3xl mx-auto">
            {children}
          </main>

          {/* Footer note */}
          <footer className="w-full text-center py-6 text-xs text-[#3A9295]/70 border-t border-black/[0.04]">
            <span>Everything configured here can be updated anytime in your Business Settings.</span>
          </footer>
        </div>
      </OnboardingProvider>
    </InterludeWipeProvider>
  );
}
