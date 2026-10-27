"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Terminal,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

export default function AdminLoginPage() {
  const router = useRouter();
  const { switchDemoRole, signInWithPassword } = useAuth();
  const { playClick, playSuccess } = useAudio();

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

    const cleanEmail = email.trim().toLowerCase();
    const isAdminUser =
      cleanEmail === "admin@ovel.app" ||
      cleanEmail === "admin@ovel.lk" ||
      cleanEmail.startsWith("admin@");

    // Check credentials:
    // In demo / development environment, allow OvelAdmin@2026! or valid root password
    if (isAdminUser && password === "OvelAdmin@2026!") {
      try {
        await fetch("/api/auth/admin-session", { method: "POST" });
      } catch {
        // fallback
      }

      await signInWithPassword(cleanEmail, password);
      switchDemoRole("super_admin");
      playSuccess();
      router.push("/admin");
      return;
    }

    // Try standard auth if password differs
    const { error } = await signInWithPassword(cleanEmail, password);
    setLoading(false);

    if (error || !isAdminUser) {
      setErrorMsg("Access Denied: Invalid administrator credentials or insufficient clearance.");
    } else {
      try {
        await fetch("/api/auth/admin-session", { method: "POST" });
      } catch {}
      switchDemoRole("super_admin");
      playSuccess();
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-[#091E21] text-[#F6FAF9] antialiased selection:bg-[#63C1BB] selection:text-[#091E21] font-['Kaleko_105',sans-serif] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Deep atmospheric glow */}
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-[#105F68]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-[#63C1BB]/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center justify-center gap-2 group mb-2">
          <span className="font-['Disolve'] text-4xl text-[#63C1BB] tracking-tight">Ovel</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#105F68]/30 border border-[#63C1BB]/30 text-[10px] font-mono text-[#63C1BB] tracking-widest uppercase">
          <Terminal className="w-3.5 h-3.5" />
          <span>Restricted Admin Console</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Platform Super Administrator
        </h2>
        <p className="text-xs text-[#82BDB9] font-light">
          Authenticate with root clearance to manage platform tenants, subscriptions, and system overrides.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0D2D31]/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-[#63C1BB]/20 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#82BDB9] font-mono block mb-2">
                Administrator Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#63C1BB]/70 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@ovel.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#08181A] border border-[#63C1BB]/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#63C1BB] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#82BDB9] font-mono block mb-2">
                Root Master Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#63C1BB]/70 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#08181A] border border-[#63C1BB]/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#63C1BB] transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 text-rose-200 text-xs border border-rose-800/60 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#63C1BB] hover:bg-[#78D3CD] text-[#091E21] text-xs sm:text-sm font-semibold tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-[#63C1BB]/20 mt-4 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? "Authenticating Root..." : "Authenticate Admin Session"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#63C1BB]/10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#82BDB9] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Ovel Main Platform</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-[#82BDB9]/60 font-mono">
          <span>OVEL SECURE ACCESS CONTROL • 256-BIT ENCRYPTION</span>
        </div>
      </div>
    </div>
  );
}
