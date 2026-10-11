"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs/legacy";
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from "lucide-react";
import { useAudio } from "@/components/AudioController";

export default function ClerkCustomSignUp() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { playClick, playSuccess } = useAudio();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const businessSlug = businessName
    ? businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : "my-studio";

  const handleStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    try {
      await signUp.create({
        emailAddress: email,
        password: password,
        firstName: fullName.split(" ")[0] || "Owner",
        lastName: fullName.split(" ").slice(1).join(" ") || "",
        unsafeMetadata: {
          businessName: businessName || "My Business",
          businessSlug,
        },
      });

      // Send Clerk verification code to email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      playSuccess();
      setVerifying(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message || "Failed to start sign up.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !code) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === "complete") {
        playSuccess();
        await setActive({ session: completeSignUp.createdSessionId });
        try {
          const newProfile = {
            id: completeSignUp.createdUserId || "usr_" + Date.now(),
            email,
            fullName: fullName || "Owner",
            role: "business_owner" as const,
            organizationId: "org_" + businessSlug,
            organizationName: businessName || "My Studio",
            organizationSlug: businessSlug,
            permissions: ["bookings:manage", "invoicing:manage", "staff:manage", "whatsapp:manage", "settings:manage"],
            status: "active" as const,
            lastLogin: "Just now",
            createdAt: new Date().toISOString().split("T")[0],
          };
          localStorage.setItem("ovel_active_auth_profile_v2", JSON.stringify(newProfile));
          const existingStr = localStorage.getItem("ovel_system_users_v2");
          const existing = existingStr ? JSON.parse(existingStr) : [];
          if (Array.isArray(existing)) {
            localStorage.setItem("ovel_system_users_v2", JSON.stringify([...existing, newProfile]));
          }
        } catch {
          // ignore
        }
        router.push("/dashboard");
      } else {
        setErrorMsg("Verification incomplete. Please retry or request a new code.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message || "Invalid verification code.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (strategy: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) return;
    playClick();
    signUp.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  if (verifying) {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-[#C8E6E2]/50 text-[#105F68] flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#105F68]">Verify Your Email</h3>
          <p className="text-xs text-[#3A9295]">
            We sent a 6-digit confirmation code to <b>{email}</b> via Clerk.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="text-xs text-[#3A9295] font-medium block mb-1.5 text-center">
            Verification Code
          </label>
          <input
            type="text"
            required
            autoFocus
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center tracking-[0.5em] text-lg font-mono py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-[#105F68] focus:outline-none focus:border-[#105F68]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-wide transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? "Verifying with Clerk..." : "Complete Setup & Enter Dashboard"}</span>
          <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
        </button>

        <button
          type="button"
          onClick={() => setVerifying(false)}
          className="w-full text-center text-xs text-[#3A9295] hover:underline pt-1"
        >
          Back to edit email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleStartSignUp} className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Social OAuth with Clerk */}
      <div className="grid grid-cols-2 gap-2 pb-1">
        <button
          type="button"
          onClick={() => handleOAuth("oauth_google")}
          className="py-2.5 px-3 rounded-2xl border border-black/10 bg-[#FBFDFD] hover:bg-[#F6FAF9] text-xs text-[#105F68] font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          className="py-2.5 px-3 rounded-2xl border border-black/10 bg-[#FBFDFD] hover:bg-[#F6FAF9] text-xs text-[#105F68] font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4 fill-current text-[#103438]" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.92-1 .04-2.15.67-2.83 1.46-.59.69-1.12 1.79-.98 2.87 1.11.08 2.24-.63 2.87-1.41z"/>
          </svg>
          <span>Apple</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#3A9295] my-2">
        <div className="flex-1 h-px bg-black/5" />
        <span className="text-[10px] uppercase tracking-wider">or registration</span>
        <div className="flex-1 h-px bg-black/5" />
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1">
          Full Name
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="e.g. Elena Rostova"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <User className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1">
          Business Name
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="e.g. Lumina Skin & Body Studio"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <Building2 className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-[#3A9295]">
          <span>Your Public Ovelink:</span>
          <span className="font-mono text-[#105F68] font-medium">ovel.app/l/{businessSlug}</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1">
          Work Email
        </label>
        <div className="relative">
          <input
            type="email"
            required
            placeholder="elena@luminaskin.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <Mail className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            minLength={8}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <Lock className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-[#C8E6E2]/25 border border-[#9ED5D1]/40 text-xs text-[#105F68] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#63C1BB] flex-shrink-0" />
        <span>14-day free pilot • 0% platform transaction take-rate • No credit card required.</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-wide transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span>{loading ? "Registering with Clerk..." : "Create Merchant Account"}</span>
        <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
      </button>
    </form>
  );
}
