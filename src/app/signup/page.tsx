"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Zap,
  CreditCard,
  TrendingUp,
  Percent
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

import ClerkCustomSignUp from "@/components/auth/ClerkCustomSignUp";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithPassword } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkActive =
    Boolean(publishableKey) &&
    !publishableKey?.includes("placeholder") &&
    publishableKey?.startsWith("pk_");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    if (typeof window !== "undefined") {
      localStorage.setItem("ovel_selected_business_type", "both");
    }
    const { error } = await signUpWithPassword(email, password, "Owner", "My Business");
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      playSuccess();
      router.push("/onboarding/offering");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white grid lg:grid-cols-12">
      {/* ░░ LEFT COLUMN: Editorial Showcase & Brand Story (Desktop) ░░ */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#103438] text-[#F6FAF9] p-10 xl:p-14 flex-col justify-between relative overflow-hidden select-none">
        {/* Ambient lighting glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#105F68]/60 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#63C1BB]/25 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#F6FAF9 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Top brand header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1 group">
            <span className="font-['Disolve'] text-3xl xl:text-4xl text-[#F6FAF9] tracking-tight group-hover:opacity-90 transition-opacity">
              Ovel<span className="text-[#63C1BB]">—</span>
            </span>
          </Link>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#C8E6E2]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>0% Commission Platform</span>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 my-8 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-medium tracking-tight text-white leading-tight">
              Keep 100% of what your studio earns.
            </h2>
            <p className="text-sm xl:text-base text-[#F6FAF9]/75 font-light leading-relaxed">
              The unified operating system that replaces fragmented booking software, quote tools, deposit processors, and reminder bots with zero marketplace tax.
            </p>
          </div>

          {/* Key Feature Pillars */}
          <div className="grid grid-cols-2 gap-3 text-xs text-[#F6FAF9]/80 font-light pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#63C1BB] shrink-0" />
              <span>Instant Bank Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#63C1BB] shrink-0" />
              <span>Zero Transaction Take</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#63C1BB] shrink-0" />
              <span>Direct Client Ownership</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#63C1BB] shrink-0" />
              <span>WhatsApp Automations</span>
            </div>
          </div>
        </div>

        {/* Bottom Guarantee */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#F6FAF9]/60 font-mono">
          <span>Ovel © 2026</span>
          <span>14-day free pilot · No card required</span>
        </div>
      </div>

      {/* ░░ RIGHT COLUMN: Clean, Streamlined Registration ░░ */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-20 min-h-screen overflow-y-auto">
        <div className="max-w-xl mx-auto w-full space-y-6">
          {/* Top navigation row */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-[#103438]/60 hover:text-[#103438] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </Link>

            <div className="text-xs text-[#103438]/70">
              Already a merchant?{" "}
              <Link href="/login" className="text-[#105F68] font-semibold hover:underline">
                Sign In →
              </Link>
            </div>
          </div>

          {/* Mobile brand header (< lg) */}
          <div className="lg:hidden text-center space-y-2 pt-2">
            <Link href="/" className="inline-flex items-center justify-center">
              <span className="font-['Disolve'] text-3xl text-[#105F68] tracking-tight">
                Ovel<span className="text-[#63C1BB]">—</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#105F68] font-semibold">
              Get Started Free
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#103438]">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-[#103438]/65 leading-relaxed">
              Enter your work email to begin your 14-day free pilot.
            </p>
          </div>

          {/* Sign up form */}
          {isClerkActive ? (
            <ClerkCustomSignUp />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2.5">
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Work Email */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#103438] block mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#103438]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="elena@luminaskin.co"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#103438]/15 text-sm text-[#103438] placeholder:text-[#103438]/35 shadow-xs focus:outline-none focus:border-[#105F68] focus:ring-4 focus:ring-[#105F68]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#103438] block mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#103438]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#103438]/15 text-sm text-[#103438] placeholder:text-[#103438]/35 shadow-xs focus:outline-none focus:border-[#105F68] focus:ring-4 focus:ring-[#105F68]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Minimalist Trust Grid */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center">
                <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
                  <span className="text-[11px] font-medium text-[#103438]">14-Day Free Pilot</span>
                </div>
                <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
                  <span className="text-[11px] font-medium text-[#103438]">0% Commission</span>
                </div>
                <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
                  <span className="text-[11px] font-medium text-[#103438]">No Card Needed</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#103438] hover:bg-[#0c272a] text-white text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Creating your account..." : "Continue"}</span>
                <ArrowRight className="w-4 h-4 text-[#C8E6E2] group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[11px] text-center text-[#103438]/50 leading-relaxed pt-1">
                By registering, you agree to Ovel's Terms of Service and Merchant Agreement.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
