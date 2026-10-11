"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function AuthRedirectPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [statusText, setStatusText] = useState("Finalizing workspace session...");
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoaded || redirected.current) return;

    if (!isSignedIn || !user) {
      // Allow a brief moment in case Clerk session token handshake is finishing
      const timer = setTimeout(() => {
        if (!redirected.current) {
          redirected.current = true;
          window.location.replace("/login");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    // User is authenticated
    redirected.current = true;
    setStatusText("Preparing your workspace...");

    async function routeUser() {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.role === "super_admin") {
            window.location.replace("/admin");
            return;
          }
        }
      } catch (err) {
        console.warn("Profile check fallback:", err);
      }

      // Default destination for studio owners and operators
      window.location.replace("/dashboard");
    }

    void routeUser();
  }, [isLoaded, isSignedIn, user]);

  return (
    <div className="min-h-screen bg-[#F6FAF9] text-[#103438] antialiased selection:bg-[#105F68] selection:text-white font-['Kaleko_105',sans-serif] flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#C8E6E2]/60 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#9ED5D1]/50 rounded-full blur-[110px] pointer-events-none -z-10" />

      <div className="w-full max-w-sm text-center space-y-6">
        <Link href="/" className="inline-flex items-center justify-center">
          <span className="font-['Disolve'] text-4xl text-[#105F68] tracking-tight">Ovel</span>
        </Link>

        <div className="bg-white py-10 px-8 rounded-[2.5rem] border border-[#105F68]/15 shadow-xl space-y-5 flex flex-col items-center">
          <div
            role="status"
            aria-label="Redirecting"
            className="w-9 h-9 border-2 border-[#105F68] border-t-transparent rounded-full animate-spin"
          />

          <div className="space-y-1">
            <h2 className="text-base font-medium text-[#105F68]">
              {statusText}
            </h2>
            <p className="text-xs text-[#3A9295]">
              Connecting your credentials to your Ovel platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
