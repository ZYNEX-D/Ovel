"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth, BusinessType } from "@/lib/auth-context";
import { saveOvelink, getOvelink } from "@/lib/ovelink-store";
import { useInterludeWipe } from "@/components/InterludeWipeTransition";
import confetti from "canvas-confetti";

export interface OnboardingData {
  businessName: string;
  businessSlug: string;
  businessTagline: string;
  businessBio: string;
  businessType: BusinessType;
  logoUrl: string;
  avatarInitials: string;
  greetings: string;
  coverGradient?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
  goNext: (currentStepNumber: number, nextUrl: string) => void;
  goBack: (prevUrl: string) => void;
  skipStep: (currentStepNumber: number, nextUrl: string) => void;
  skipAllToDashboard: () => void;
  completeOnboarding: () => Promise<void>;
  isSaving: boolean;
}

const STORAGE_KEY = "ovel_onboarding_draft_v1";

const DEFAULT_DATA: OnboardingData = {
  businessName: "",
  businessSlug: "",
  businessTagline: "Online Bookings & Instant Confirmation",
  businessBio: "",
  businessType: "both",
  logoUrl: "",
  avatarInitials: "OV",
  greetings: "Welcome! Browse our services and curated products below to reserve your appointment with instant confirmation.",
  coverGradient: "from-[#105F68] to-[#0D4F57]",
};

const OnboardingContext = createContext<OnboardingContextType>({
  data: DEFAULT_DATA,
  updateData: () => {},
  goNext: () => {},
  goBack: () => {},
  skipStep: () => {},
  skipAllToDashboard: () => {},
  completeOnboarding: async () => {},
  isSaving: false,
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateOrganizationDetails, updateBusinessType } = useAuth();
  const { triggerWipe, setStepLabel } = useInterludeWipe();
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize data from profile or localStorage draft
  useEffect(() => {
    let initial = { ...DEFAULT_DATA };
    let hasSavedDraft = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        initial = { ...initial, ...JSON.parse(saved) };
        hasSavedDraft = true;
      }
    } catch {
      // ignore
    }

    if (profile) {
      if (profile.organizationName && !initial.businessName) {
        initial.businessName = profile.organizationName;
      }
      if (profile.organizationSlug && !initial.businessSlug) {
        initial.businessSlug = profile.organizationSlug;
      }
      if (profile.businessType && !hasSavedDraft) {
        initial.businessType = profile.businessType;
      }
      if (profile.logoUrl && !initial.logoUrl) {
        initial.logoUrl = profile.logoUrl;
      }
      if (profile.businessBio && !initial.businessBio) {
        initial.businessBio = profile.businessBio;
      }
      if (profile.businessTagline && !initial.businessTagline) {
        initial.businessTagline = profile.businessTagline;
      }
      if (profile.greetings && !initial.greetings) {
        initial.greetings = profile.greetings;
      }
    }

    // Default slug if empty
    if (initial.businessName && !initial.businessSlug) {
      initial.businessSlug = initial.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    setData(initial);
  }, [profile]);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };

      // Auto-compute slug and initials if business name changed
      if (patch.businessName !== undefined) {
        const cleanName = patch.businessName.trim();
        const autoSlug = cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        if (patch.businessSlug === undefined) {
          next.businessSlug = autoSlug || "my-brand";
        }

        const words = cleanName.split(/\s+/).filter(Boolean);
        next.avatarInitials = words.length >= 2
          ? (words[0][0] + words[1][0]).toUpperCase()
          : (cleanName.slice(0, 2) || "OV").toUpperCase();
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const goNext = useCallback((stepNumber: number, nextUrl: string) => {
    const labels: Record<number, string> = {
      1: "Question 2: Business Bio",
      2: "Question 3: Offering Type",
      3: "Question 4: Brand Logo",
      4: "Question 5: Client Greetings",
      5: "Completing Workspace",
    };
    setStepLabel(labels[stepNumber] || `Step ${stepNumber + 1}`);
    triggerWipe(nextUrl, "forward");
  }, [triggerWipe, setStepLabel]);

  const goBack = useCallback((prevUrl: string) => {
    setStepLabel("Previous Question");
    triggerWipe(prevUrl, "backward");
  }, [triggerWipe, setStepLabel]);

  const skipStep = useCallback((stepNumber: number, nextUrl: string) => {
    const labels: Record<number, string> = {
      1: "Question 2: Business Bio",
      2: "Question 3: Offering Type",
      3: "Question 4: Brand Logo",
      4: "Question 5: Client Greetings",
      5: "Finalizing Workspace",
    };
    setStepLabel(labels[stepNumber] || `Step ${stepNumber + 1}`);
    triggerWipe(nextUrl, "forward");
  }, [triggerWipe, setStepLabel]);

  const persistAllData = useCallback(async (completed: boolean) => {
    setIsSaving(true);
    const finalName = data.businessName.trim() || profile?.organizationName || "My Business";
    const finalSlug = data.businessSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "my-brand";
    const finalType = data.businessType || "both";

    // 1. Update auth context organization details
    if (updateOrganizationDetails) {
      updateOrganizationDetails(finalName, finalSlug, data.logoUrl || undefined, finalType);
    }
    if (updateBusinessType) {
      updateBusinessType(finalType);
    }

    // 2. Persist local cache for instant dashboard shell access
    try {
      localStorage.setItem("ovel_selected_business_type", finalType);
      if (profile?.organizationId) {
        localStorage.setItem(`ovel_business_type_${profile.organizationId}`, finalType);
      }
      localStorage.setItem(`ovel_business_type_${finalSlug}`, finalType);
    } catch {
      // ignore
    }

    // 3. Persist to Ovelink storefront store
    try {
      const existing = getOvelink(finalSlug, finalName, profile?.organizationId);
      saveOvelink({
        ...existing,
        businessName: finalName,
        slug: finalSlug,
        organizationId: profile?.organizationId || existing.organizationId,
        businessBio: data.businessBio.trim() || existing.businessBio,
        businessTagline: data.businessTagline.trim() || existing.businessTagline,
        logoUrl: data.logoUrl || existing.logoUrl,
        avatarInitials: data.avatarInitials || existing.avatarInitials,
        greetings: data.greetings.trim() || existing.greetings,
        coverGradient: data.coverGradient || existing.coverGradient || "from-[#105F68] to-[#0D4F57]",
      }, existing.slug);
    } catch (e) {
      console.warn("Ovelink storefront sync:", e);
    }

    // 4. Persist to Clerk user unsafeMetadata via PATCH /api/user/me
    // Note: Clerk unsafeMetadata has an 8KB limit, so data URLs are kept locally
    try {
      const safeAvatarUrl = data.logoUrl && !data.logoUrl.startsWith("data:") ? data.logoUrl : undefined;
      await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: finalName,
          businessSlug: finalSlug,
          businessType: finalType,
          avatarUrl: safeAvatarUrl,
          logoUrl: safeAvatarUrl,
          businessBio: data.businessBio.trim(),
          businessTagline: data.businessTagline.trim(),
          greetings: data.greetings.trim(),
          onboardingCompleted: completed,
        }),
      });
    } catch (e) {
      console.warn("Clerk metadata sync:", e);
    }

    // 5. Set local completion flags and remove draft
    try {
      localStorage.setItem("ovel_onboarding_completed", "true");
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    setIsSaving(false);
  }, [data, profile, updateOrganizationDetails, updateBusinessType]);

  const skipAllToDashboard = useCallback(async () => {
    await persistAllData(true);
    setStepLabel("Opening Dashboard");
    triggerWipe("/dashboard", "forward", () => {
      window.location.href = "/dashboard";
    });
  }, [persistAllData, setStepLabel, triggerWipe]);

  const completeOnboarding = useCallback(async () => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#105F68", "#63C1BB", "#C8E6E2", "#3A9295"],
      });
    } catch {
      // ignore
    }

    await persistAllData(true);
    setStepLabel("Launching Your Dashboard");
    triggerWipe("/dashboard", "forward", () => {
      window.location.href = "/dashboard";
    });
  }, [persistAllData, setStepLabel, triggerWipe]);

  const value = useMemo(() => ({
    data,
    updateData,
    goNext,
    goBack,
    skipStep,
    skipAllToDashboard,
    completeOnboarding,
    isSaving,
  }), [
    data,
    updateData,
    goNext,
    goBack,
    skipStep,
    skipAllToDashboard,
    completeOnboarding,
    isSaving,
  ]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
