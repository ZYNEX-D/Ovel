"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2 
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

  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("Aesthetic Clinic");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !businessName) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    const { error } = await signUpWithPassword(email, password, fullName || "Owner", businessName);
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      playSuccess();
      router.push("/dashboard");
    }
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
          Start Commission-Free Today
        </h2>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-5">
          {isClerkActive ? (
            <ClerkCustomSignUp />
          ) : (
            <>
              {/* Notice when Clerk keys are waiting to be pasted in .env.local */}
              <div className="p-3.5 rounded-2xl bg-[#C8E6E2]/30 border border-[#9ED5D1]/50 text-xs text-[#105F68] space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-[#105F68]" />
                  <span>Clerk Ready: Paste Keys into .env.local</span>
                </div>
                <p className="text-[11px] text-[#3A9295] leading-relaxed">
                  Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to enable live Clerk registration.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1">
                    Business / Studio Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atelier Aesthetics"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1">
                  Owner Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1">
                  Industry
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none"
                >
                  <option value="Aesthetic Clinic">Aesthetic Clinic</option>
                  <option value="Salon & Spa">Salon &amp; Spa</option>
                  <option value="Mobile Detailing">Mobile Detailing</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Wellness">Wellness</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="contact@atelieraesthetics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-[#3A9295] font-light block mb-1">
                Create Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#3A9295] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="At least 8 characters..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#C8E6E2]/25 border border-[#9ED5D1]/40 flex items-center gap-2.5 text-[11px] text-[#105F68]">
              <ShieldCheck className="w-4 h-4 text-[#105F68] flex-shrink-0" />
              <span>Includes 30 days trial + Zero Setup Fee + 0% Marketplace Take</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs sm:text-sm font-light tracking-tight transition-all flex items-center justify-center gap-2 shadow-md mt-2"
            >
              <span>{loading ? "Creating Organization..." : "Create Account & Launch"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          </>
        )}

        <div className="text-center pt-2 text-xs text-[#3A9295]">
            <span>Already have an account? </span>
            <Link href="/login" className="text-[#105F68] font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
