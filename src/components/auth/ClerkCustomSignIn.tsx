"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useAudio } from "@/components/AudioController";

export default function ClerkCustomSignIn() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { playClick, playSuccess } = useAudio();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !email) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        playSuccess();
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        // Needs second factor or further step
        setErrorMsg("Additional verification required. Please check your email.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
      const message = clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message || "Invalid email or password.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (strategy: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) return;
    playClick();
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <span className="text-[10px] uppercase tracking-wider">or email</span>
        <div className="flex-1 h-px bg-black/5" />
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1.5">
          Work Email
        </label>
        <div className="relative">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <Mail className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#3A9295] font-medium block mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68] transition-colors"
          />
          <Lock className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[11px] text-[#3A9295]">Clerk 256-Bit TLS</span>
        <Link
          href="/forgot-password"
          className="text-[#105F68] hover:underline text-[11px] font-medium"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-light tracking-wide transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <span>{loading ? "Authenticating with Clerk..." : "Sign In to Workspace"}</span>
        <ArrowRight className="w-4 h-4 text-[#63C1BB]" />
      </button>
    </form>
  );
}
