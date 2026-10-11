"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clerk.loaded || started.current) return;
    started.current = true;
    void clerk.handleRedirectCallback({
      signInUrl: "/login",
      signUpUrl: "/signup",
      continueSignUpUrl: "/signup#/continue",
      signInForceRedirectUrl: "/auth/redirect",
      signUpForceRedirectUrl: "/auth/redirect",
    }, async (destination) => {
      window.location.replace(destination);
    }).catch(() => setFailed(true));
  }, [clerk, clerk.loaded]);

  return (
    <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-['Kaleko_105',sans-serif]">
      <div className="p-8 rounded-3xl bg-white border border-[#105F68]/15 shadow-xl space-y-3">
        {failed ? (
          <p role="alert" className="text-sm text-red-700">Sign-in could not be completed. Please try again.</p>
        ) : (
          <div role="status" aria-label="Completing sign-in" className="w-8 h-8 border-2 border-[#105F68] border-t-transparent rounded-full animate-spin mx-auto" />
        )}
        <div id="clerk-captcha" />
        <Link href="/login" className="block text-sm text-[#105F68] hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
