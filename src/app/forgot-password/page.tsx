"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import ProgressiveBlur from "@/components/ProgressiveBlur";

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const { playClick, playSuccess } = useAudio();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    playClick();

    await resetPasswordForEmail(email);
    setLoading(false);
    playSuccess();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ProgressiveBlur position="top" height="h-20" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#C8E6E2]/50 border border-[#9ED5D1]/60 flex items-center justify-center p-2.5">
            <Image src="/icon.svg" alt="Ovel Logo" width={30} height={30} />
          </div>
          <span className="font-['Disolve'] text-3xl text-[#105F68]">ovel</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-[#3A9295] font-light">
          Enter your email and we&apos;ll dispatch a secure recovery link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1.5">
                  Account Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-light tracking-tight transition-all flex items-center justify-center gap-2 shadow-md mt-2"
              >
                <span>{loading ? "Sending link..." : "Dispatch Password Reset Link"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-3">
              <div className="w-14 h-14 rounded-full bg-[#C8E6E2] text-[#105F68] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-light text-[#105F68]">
                Recovery Link Dispatched
              </h3>
              <p className="text-xs text-[#3A9295]">
                We have transmitted a secure password reset link to <b>{email}</b>. Please inspect your inbox.
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#3A9295] hover:text-[#105F68] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
