"use client";

import React, { useState, useEffect, useRef } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { Building2, ArrowRight, Globe, Sparkles, Check, Edit2 } from "lucide-react";
import { useAudio } from "@/components/AudioController";
import { validateSlug, sanitizeSlug } from "@/lib/ovelink-store";
import { useAuth } from "@/lib/auth-context";

export default function BusinessNameStep() {
  const { data, updateData, goNext, skipStep } = useOnboarding();
  const { profile } = useAuth();
  const { playClick } = useAudio();
  const [error, setError] = useState<string | null>(null);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  // Slug availability state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugError, setSlugError] = useState<string | null>(null);

  const cleanName = data.businessName.trim();
  const rawSlug = data.businessSlug || sanitizeSlug(cleanName) || "my-brand";
  const displaySlug = sanitizeSlug(rawSlug) || "my-brand";

  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!displaySlug || displaySlug === "my-brand") {
      setSlugStatus("idle");
      setSlugError(null);
      return;
    }

    // 1. Instant local validation against reserved handles and active organizations
    const localCheck = validateSlug(displaySlug, profile?.organizationId);
    if (!localCheck.valid) {
      setSlugStatus("taken");
      setSlugError(localCheck.error || "This handle is already taken.");
      return;
    }

    // 2. Debounced API check against database / Clerk user accounts
    setSlugStatus("checking");
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(displaySlug)}`);
        if (!res.ok) {
          setSlugStatus("available");
          setSlugError(null);
          return;
        }
        const json = await res.json();
        if (json.available) {
          setSlugStatus("available");
          setSlugError(null);
        } else {
          setSlugStatus("taken");
          setSlugError(json.error || `Handle "${displaySlug}" is already taken.`);
        }
      } catch {
        // Fallback to local validation
        setSlugStatus("available");
        setSlugError(null);
      }
    }, 280);

    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [displaySlug, profile?.organizationId]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName) {
      setError("Please enter your business name or click 'Skip for now'.");
      return;
    }
    if (slugStatus === "taken") {
      setError(slugError || "This URL handle is already taken. Please customize your handle.");
      return;
    }
    setError(null);
    playClick();
    goNext(1, "/onboarding/bio");
  };

  const handleSkip = () => {
    playClick();
    if (!cleanName) {
      updateData({ businessName: "My Business", businessSlug: "my-business" });
    }
    skipStep(1, "/onboarding/bio");
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Step Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#105F68]/10 text-[#105F68] text-xs font-medium border border-[#105F68]/15 mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          What is your business name?
        </h1>
        <p className="text-xs sm:text-sm text-[#3A9295] max-w-md mx-auto leading-relaxed">
          This name will appear on your client portal, booking catalog, and storefront.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-[0_4px_24px_-4px_rgba(16,95,104,0.06)] space-y-6">
        <form onSubmit={handleContinue} className="space-y-6">
          <div>
            <label className="text-[11px] font-semibold text-[#105F68] uppercase tracking-wider block mb-2">
              Business or Studio Name
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={data.businessName}
                onChange={(e) => {
                  setError(null);
                  updateData({ businessName: e.target.value });
                }}
                placeholder="e.g. Lumina Skin & Wellness"
                className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-sm sm:text-base font-medium text-[#105F68] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#105F68]/15 focus:border-[#105F68] focus:bg-white transition-all shadow-2xs"
              />
              <div className="absolute right-3.5 top-3.5 text-[#3A9295]">
                {cleanName ? (
                  <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
                ) : (
                  <Sparkles className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Public Storefront URL with Real-time Database Availability Check */}
          <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#3A9295]">
              <span className="flex items-center gap-1.5 font-medium">
                <Globe className="w-3.5 h-3.5 text-[#105F68]" />
                Public Storefront Handle
              </span>

              {/* Status Badge */}
              {slugStatus === "checking" && (
                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <div className="w-2.5 h-2.5 border-2 border-[#105F68] border-t-transparent rounded-full animate-spin" />
                  Checking...
                </span>
              )}
              {slugStatus === "available" && (
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Available
                </span>
              )}
              {slugStatus === "taken" && (
                <span className="text-[10px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                  Already taken
                </span>
              )}
              {slugStatus === "idle" && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Live Preview
                </span>
              )}
            </div>

            {/* URL Display / Editable Handle */}
            <div className="font-mono text-xs text-[#105F68] font-medium bg-white px-3 py-2 rounded-lg border border-black/[0.05] shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="text-slate-400 select-none">https://ovel.lk/l/</span>
                {isEditingSlug ? (
                  <input
                    type="text"
                    value={data.businessSlug || displaySlug}
                    onChange={(e) => {
                      const clean = sanitizeSlug(e.target.value);
                      updateData({ businessSlug: clean });
                    }}
                    placeholder="my-handle"
                    className="font-semibold text-[#105F68] bg-transparent outline-none border-b border-[#105F68] px-0.5 min-w-[120px] flex-1"
                  />
                ) : (
                  <span className="text-[#3A9295] font-semibold truncate">
                    {displaySlug}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingSlug(!isEditingSlug)}
                className="text-[10px] text-slate-400 hover:text-[#105F68] transition-colors flex items-center gap-1 select-none flex-shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingSlug ? "Done" : "Customize"}</span>
              </button>
            </div>

            {slugStatus === "taken" && (
              <p className="text-xs text-rose-600 font-medium">
                {slugError || `Handle "${displaySlug}" is already taken by another business. Click Customize to choose another handle.`}
              </p>
            )}
          </div>

          {/* Minimal Action Bar */}
          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
            <div />
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
                disabled={slugStatus === "taken"}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#105F68] hover:bg-[#0D4F57] active:scale-[0.99] text-white text-xs sm:text-sm font-medium tracking-tight transition-all shadow-2xs hover:shadow-sm disabled:opacity-50"
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
