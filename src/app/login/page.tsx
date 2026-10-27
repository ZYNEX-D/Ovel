"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

import ClerkCustomSignIn from "@/components/auth/ClerkCustomSignIn";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signInWithMagicLink, switchDemoRole } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkAvailable =
    Boolean(publishableKey) &&
    !publishableKey?.includes("placeholder") &&
    publishableKey?.startsWith("pk_");

  const [loginMethod, setLoginMethod] = useState<"direct" | "clerk">("direct");
  const [authMode, setAuthMode] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDeletedNotice, setIsDeletedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("deleted") === "1" || params.get("deleted") === "true") {
        setIsDeletedNotice(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);
    setMessage(null);
    playClick();

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin =
      cleanEmail === "admin@ovel.app" ||
      cleanEmail === "admin@ovel.lk" ||
      cleanEmail.startsWith("admin@");

    if (authMode === "password") {
      // Check admin credentials
      if (isAdmin) {
        if (password === "OvelAdmin@2026!") {
          try {
            await fetch("/api/auth/admin-session", { method: "POST" });
          } catch {
            // fallback
          }
          await signInWithPassword(cleanEmail, password);
          switchDemoRole("super_admin");
          setLoading(false);
          playSuccess();
          // Forward admin to admin panel
          router.push("/admin");
          return;
        } else {
          setLoading(false);
          setErrorMsg("Invalid email or password.");
          return;
        }
      }

      // Standard customer / merchant authentication
      const { error } = await signInWithPassword(cleanEmail, password);
      setLoading(false);

      if (error) {
        setErrorMsg(error);
      } else {
        playSuccess();
        router.push("/dashboard");
      }
    } else {
      const { error } = await signInWithMagicLink(cleanEmail);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        playSuccess();
        setMessage(`Passwordless magic link dispatched to ${cleanEmail}! Check your inbox.`);
      }
    }
  };

  const handleQuickMerchantLogin = async (targetEmail: string) => {
    playSuccess();
    await signInWithPassword(targetEmail, "MerchantPass@2026!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#C8E6E2]/60 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#9ED5D1]/50 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center justify-center group">
          <span className="font-['Disolve'] text-4xl text-[#105F68] tracking-tight">Ovel</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Sign In to Your Workspace
        </h2>
        <p className="text-xs text-[#3A9295] font-light">
          Access your sovereign Ovelink storefront and merchant operations.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {isDeletedNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center animate-in fade-in duration-200 shadow-sm">
            ✓ Your account, business workspace, and all related records have been permanently deleted.
          </div>
        )}

        <div className="bg-white py-8 px-6 sm:px-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
          {/* Top Auth Method Switcher (Direct Login vs Clerk SSO) */}
          {isClerkAvailable && (
            <div className="flex p-1 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setLoginMethod("direct");
                }}
                className={`flex-1 py-2 rounded-xl transition-all font-medium ${
                  loginMethod === "direct"
                    ? "bg-[#105F68] text-white shadow-sm"
                    : "text-[#3A9295] hover:text-[#105F68]"
                }`}
              >
                Standard Login
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setLoginMethod("clerk");
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  loginMethod === "clerk"
                    ? "bg-[#105F68] text-white font-medium shadow-sm"
                    : "text-[#3A9295] hover:text-[#105F68]"
                }`}
              >
                Clerk Cloud SSO
              </button>
            </div>
          )}

          {loginMethod === "clerk" && isClerkAvailable ? (
            <ClerkCustomSignIn />
          ) : (
            <>
              {/* Mode Selector Toggle (Password vs Magic Link) */}
              <div className="flex p-1 rounded-xl bg-[#F6FAF9] border border-black/5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAuthMode("password");
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    authMode === "password"
                      ? "bg-white text-[#105F68] font-medium shadow-sm border border-black/5"
                      : "text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAuthMode("magic_link");
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === "magic_link"
                      ? "bg-white text-[#105F68] font-medium shadow-sm border border-black/5"
                      : "text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#63C1BB]" />
                  <span>Magic Link</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="you@yourbusiness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                    />
                  </div>
                </div>

                {authMode === "password" && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {message && (
                  <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#1B5E20] text-xs border border-[#A5D6A7]">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-light tracking-tight transition-all flex items-center justify-center gap-2 shadow-md mt-2 cursor-pointer"
                >
                  <span>
                    {loading
                      ? "Authenticating..."
                      : authMode === "password"
                      ? "Sign In"
                      : "Send Magic Link"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Merchant Quick-Switch (No admin details shown here) */}
              <div className="pt-4 border-t border-black/5 space-y-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#3A9295] font-mono block text-center">
                  Demo Merchant Profiles
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickMerchantLogin("genevieve@ovel.lk")}
                    className="p-2.5 rounded-xl border border-black/10 hover:border-[#105F68] bg-[#FBFDFD] text-left text-xs transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[#105F68] font-medium mb-0.5">
                      <Building2 className="w-3 h-3 text-[#3A9295]" />
                      <span className="text-[11px] truncate">L&apos;Éclat</span>
                    </div>
                    <span className="text-[9px] text-[#3A9295] font-mono truncate">Clinical Care</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickMerchantLogin("apex@ovel.lk")}
                    className="p-2.5 rounded-xl border border-black/10 hover:border-[#105F68] bg-[#FBFDFD] text-left text-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[#105F68] font-medium mb-0.5">
                      <Zap className="w-3 h-3 text-[#3A9295]" />
                      <span className="text-[11px] truncate">Apex Auto</span>
                    </div>
                    <span className="text-[9px] text-[#3A9295] font-mono truncate">Auto Lab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickMerchantLogin("bakes@ovel.lk")}
                    className="p-2.5 rounded-xl border border-black/10 hover:border-[#105F68] bg-[#FBFDFD] text-left text-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[#105F68] font-medium mb-0.5">
                      <Check className="w-3 h-3 text-[#3A9295]" />
                      <span className="text-[11px] truncate">Velvet Crumb</span>
                    </div>
                    <span className="text-[9px] text-[#3A9295] font-mono truncate">Bakery</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="text-center pt-2 text-xs text-[#3A9295]">
            <span>Don&apos;t have an account? </span>
            <Link href="/signup" className="text-[#105F68] font-medium hover:underline">
              Register business (0% fee)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
