"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
      <div className="p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-xl space-y-3">
        <div className="w-8 h-8 border-2 border-[#105F68] border-t-transparent rounded-full animate-spin mx-auto" />
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
