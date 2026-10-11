"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  Terminal, 
  Building2,
  ChevronRight 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import ProgressiveBlur from "@/components/ProgressiveBlur";

import ClerkCustomSignIn from "@/components/auth/ClerkCustomSignIn";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signInWithMagicLink, switchDemoRole } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkActive =
    Boolean(publishableKey) &&
    !publishableKey?.includes("placeholder") &&
    publishableKey?.startsWith("pk_");

  const [authMode, setAuthMode] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);
    setMessage(null);
    playClick();

    if (authMode === "password") {
      const { error } = await signInWithPassword(email, password);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        playSuccess();
        const isRoot = email.toLowerCase().includes("root") || email.toLowerCase().includes("tharuux") || email.toLowerCase().includes("admin");
        router.push(isRoot ? "/admin" : "/dashboard");
      }
    } else {
      const { error } = await signInWithMagicLink(email);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        playSuccess();
        setMessage(`Passwordless magic link dispatched to ${email}! Check your inbox.`);
      }
    }
  };

  const handleQuickLogin = (role: "super_admin" | "business_owner") => {
    playSuccess();
    switchDemoRole(role);
    router.push(role === "super_admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ProgressiveBlur position="top" height="h-20" />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#C8E6E2]/60 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#9ED5D1]/50 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-[#C8E6E2]/50 border border-[#9ED5D1]/60 flex items-center justify-center p-2.5 transition-transform group-hover:scale-105">
            <Image src="/icon.svg" alt="Ovel Logo" width={30} height={30} />
          </div>
          <span className="font-['Disolve'] text-3xl text-[#105F68]">ovel</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Sign In to Your Workspace
        </h2>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
          {isClerkActive ? (
            <ClerkCustomSignIn />
          ) : (
            <>
              {/* Notice when Clerk keys are waiting to be pasted in .env.local */}
              <div className="p-3.5 rounded-2xl bg-[#C8E6E2]/30 border border-[#9ED5D1]/50 text-xs text-[#105F68] space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-[#105F68]" />
                  <span>Clerk Ready: Paste Keys into .env.local</span>
                </div>
                <p className="text-[11px] text-[#3A9295] leading-relaxed">
                  Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to enable live Clerk auth.
                </p>
              </div>

              {/* Mode Selector Toggle */}
              <div className="flex p-1 rounded-2xl bg-[#F6FAF9] border border-black/5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setAuthMode("password");
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    authMode === "password"
                      ? "bg-[#105F68] text-white font-medium shadow-sm"
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
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    authMode === "magic_link"
                      ? "bg-[#105F68] text-white font-medium shadow-sm"
                      : "text-[#3A9295] hover:text-[#105F68]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#63C1BB]" />
                  <span>Passwordless Magic Link</span>
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
                      placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>
            </div>

            {authMode === "password" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-[#3A9295] hover:text-[#105F68] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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
              className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-light tracking-tight transition-all flex items-center justify-center gap-2 shadow-md mt-2"
            >
              <span>{loading ? "Verifying..." : authMode === "password" ? "Sign In" : "Send Magic Link"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Instant Logins */}
          <div className="pt-4 border-t border-black/5 space-y-2.5">
            <span className="text-[11px] uppercase tracking-wider text-[#3A9295] font-light block text-center">
              Quick 1-Click Role Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("super_admin")}
                className="p-3 rounded-2xl border border-black/10 hover:border-[#105F68] bg-[#FBFDFD] text-left text-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-[#105F68] font-medium mb-1">
                  <Terminal className="w-3.5 h-3.5 text-[#3A9295]" />
                  <span>Developer Root</span>
                </div>
                <span className="text-[10px] text-[#3A9295]">tharuux@root</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("business_owner")}
                className="p-3 rounded-2xl border border-black/10 hover:border-[#105F68] bg-[#FBFDFD] text-left text-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 text-[#105F68] font-medium mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#3A9295]" />
                  <span>Business Owner</span>
                </div>
                <span className="text-[10px] text-[#3A9295]">Merchant</span>
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
