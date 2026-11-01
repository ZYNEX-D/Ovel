"use client";

import React, { useEffect, useState } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { SignUp } from "@clerk/nextjs";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Zap,
  CreditCard
} from "lucide-react";
import { useAudio } from "@/components/AudioController";

export default function ClerkCustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { playClick, playSuccess } = useAudio();

  const [email, setEmail] = useState("");
  const clerkEmail = isLoaded && signUp?.emailAddress ? signUp.emailAddress : "";
  const visibleEmail = email || clerkEmail;
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const needsAccountDetails = isLoaded && (
    signUp.verifications.externalAccount.status === "verified" ||
    (signUp.verifications.emailAddress.status === "verified" && signUp.missingFields.length > 0)
  );
  const resumeVerification = Boolean(
    isLoaded &&
    signUp?.emailAddress &&
    signUp.verifications.emailAddress.status &&
    !needsAccountDetails
  );

  useEffect(() => {
    if (!needsAccountDetails) return;
    if (!window.location.hash || window.location.hash === "#/") {
      window.location.hash = "/continue";
    }
  }, [needsAccountDetails]);

  const finishSignUp = async (sessionId: string) => {
    if (!setActive) return;
    await setActive({
      session: sessionId,
      navigate: ({ session, decorateUrl }) => {
        window.location.replace(decorateUrl(session.currentTask ? "/login" : "/onboarding/offering"));
      },
    });
  };

  const handleStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    try {
      let result = await signUp.create({
        emailAddress: email.trim(),
        password: password,
        firstName: "Owner",
        lastName: "Owner",
        unsafeMetadata: {
          businessName: "My Business",
          businessSlug: "my-studio",
          businessType: "both",
        },
      });

      if (result.missingFields?.includes("username")) {
        try {
          const autoUsername = (email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") + Math.floor(100 + Math.random() * 900)).slice(0, 20);
          result = await signUp.update({ username: autoUsername });
        } catch (e) {
          console.warn("Could not set auto-username on create:", e);
        }
      }

      if (result.status === "complete" && result.createdSessionId) {
        await finishSignUp(result.createdSessionId);
        return;
      }

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
    if (!isLoaded || loading || !code.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    playClick();

    try {
      const isEmailAlreadyVerified = (signUp.verifications as unknown as { emailAddress?: { status?: string } })?.emailAddress?.status === "verified";
      const completeSignUp = isEmailAlreadyVerified
        ? signUp
        : await signUp.attemptEmailAddressVerification({
            code: code.trim(),
          });

      if (completeSignUp.status === "complete" && completeSignUp.createdSessionId) {
        playSuccess();
        await finishSignUp(completeSignUp.createdSessionId);
        return;
      }

      if (completeSignUp.createdSessionId) {
        playSuccess();
        await finishSignUp(completeSignUp.createdSessionId);
        return;
      }

      if (completeSignUp.status === "missing_requirements") {
        const missing = (completeSignUp as unknown as { missingFields?: string[] }).missingFields || [];
        const updatePayload: Record<string, unknown> = {};

        if (missing.includes("username")) {
          const base = (email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || "user").slice(0, 15);
          updatePayload.username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        }
        if (missing.includes("last_name")) {
          updatePayload.lastName = "Owner";
        }
        if (missing.includes("first_name")) {
          updatePayload.firstName = "Owner";
        }

        if (Object.keys(updatePayload).length > 0) {
          try {
            const updated = await signUp.update(updatePayload);
            if ((updated.status === "complete" || updated.createdSessionId) && updated.createdSessionId) {
              playSuccess();
              await finishSignUp(updated.createdSessionId);
              return;
            }
          } catch (updateErr) {
            console.error("Auto-complete sign-up update error:", updateErr);
          }
        }

        const missingDesc = missing.length > 0 ? missing.join(", ") : "additional account fields";
        setErrorMsg(`Email verified! However, your Clerk dashboard requires: ${missingDesc}. Please check your Clerk settings.`);
        return;
      }

      setErrorMsg("Verification could not be finalized. Please check your Clerk dashboard requirements.");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string; code?: string }> };
      const firstError = clerkError?.errors?.[0];

      if (
        firstError?.code === "verification_already_verified" ||
        (signUp.verifications as unknown as { emailAddress?: { status?: string } })?.emailAddress?.status === "verified"
      ) {
        if (signUp.createdSessionId) {
          playSuccess();
          await finishSignUp(signUp.createdSessionId);
          return;
        }
      }

      const message = firstError?.longMessage || firstError?.message || "Invalid verification code.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || resending) return;
    setResending(true);
    setErrorMsg(null);
    playClick();
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; longMessage?: string }> };
      setErrorMsg(clerkError?.errors?.[0]?.longMessage || clerkError?.errors?.[0]?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_google") => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setErrorMsg(null);
    playClick();
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth/redirect",
      });
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setErrorMsg(error.errors?.[0]?.longMessage || error.errors?.[0]?.message || "Unable to start social sign-up.");
    } finally {
      setLoading(false);
    }
  };

  if (needsAccountDetails) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-[#103438]/10 shadow-sm">
        <SignUp
          routing="hash"
          signInUrl="/login"
          forceRedirectUrl="/onboarding/offering"
          signInForceRedirectUrl="/onboarding/offering"
          appearance={{
            variables: { colorPrimary: "#103438", borderRadius: "0.75rem" },
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
              card: "shadow-none border-0 p-0",
              footer: { display: "none" },
            },
          }}
        />
      </div>
    );
  }

  if (verifying || resumeVerification) {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-[#103438]/10 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#105F68]/10 text-[#105F68] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-[#103438] tracking-tight">Verify Your Email</h3>
          <p className="text-xs text-[#103438]/70 max-w-xs mx-auto leading-relaxed">
            We sent a 6-digit confirmation code to <span className="font-semibold text-[#103438]">{visibleEmail}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="text-xs text-[#103438]/80 font-medium block mb-2 text-center uppercase tracking-wider">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            required
            autoFocus
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            placeholder="······"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3.5 px-4 rounded-xl bg-white border border-[#103438]/20 text-[#103438] focus:outline-none focus:border-[#105F68] focus:ring-4 focus:ring-[#105F68]/10 shadow-xs transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isLoaded}
          className="w-full py-3.5 px-6 rounded-xl bg-[#103438] hover:bg-[#0c272a] text-white text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
        >
          <span>{loading ? "Verifying code..." : "Complete Setup & Continue"}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#103438]/10">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="text-[#105F68] font-medium hover:underline disabled:opacity-50 cursor-pointer"
          >
            {resending ? "Sending new code..." : resendSuccess ? "✓ Code sent!" : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setVerifying(false);
              setCode("");
              setErrorMsg(null);
            }}
            className="text-[#103438]/60 hover:text-[#103438] transition-colors cursor-pointer"
          >
            Change email address
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleStartSignUp} className="space-y-5">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* Social Google OAuth Button */}
      <button
        type="button"
        disabled={!isLoaded || loading}
        onClick={() => handleOAuth("oauth_google")}
        className="w-full py-3 px-4 rounded-xl border border-[#103438]/15 bg-white hover:bg-[#F6FAF9] text-sm text-[#103438] font-medium transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
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
        <span>Continue with Google</span>
      </button>

      {/* Modern Hairline Divider */}
      <div className="relative flex items-center justify-center my-2">
        <div className="w-full border-t border-[#103438]/10" />
        <span className="absolute bg-[#F6FAF9] px-3 text-[11px] uppercase tracking-wider text-[#103438]/50 font-medium">
          or sign up with email
        </span>
      </div>

      {/* Form Fields: Work Email & Password */}
      <div className="space-y-4">
        {/* Work Email */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#103438] block mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#103438]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="elena@luminaskin.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#103438]/15 text-sm text-[#103438] placeholder:text-[#103438]/35 shadow-xs focus:outline-none focus:border-[#105F68] focus:ring-4 focus:ring-[#105F68]/10 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#103438] block mb-1.5">
            Create Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#103438]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#103438]/15 text-sm text-[#103438] placeholder:text-[#103438]/35 shadow-xs focus:outline-none focus:border-[#105F68] focus:ring-4 focus:ring-[#105F68]/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Minimalist Trust Grid */}
      <div className="grid grid-cols-3 gap-2 py-1 text-center">
        <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
          <span className="text-[11px] font-medium text-[#103438]">14-Day Free Pilot</span>
        </div>
        <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
          <span className="text-[11px] font-medium text-[#103438]">0% Commission</span>
        </div>
        <div className="px-2 py-2 rounded-lg bg-[#105F68]/5 border border-[#105F68]/10 flex flex-col items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-[#105F68] mb-0.5" />
          <span className="text-[11px] font-medium text-[#103438]">No Card Needed</span>
        </div>
      </div>

      <div id="clerk-captcha" />

      {/* Primary CTA */}
      <button
        type="submit"
        disabled={loading || !isLoaded}
        className="w-full py-3.5 px-6 rounded-xl bg-[#103438] hover:bg-[#0c272a] text-white text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
      >
        <span>{loading ? "Creating your account..." : "Continue"}</span>
        <ArrowRight className="w-4 h-4 text-[#C8E6E2] group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-[11px] text-center text-[#103438]/50 leading-relaxed pt-1">
        By registering, you agree to Ovel's Terms of Service and Merchant Agreement.
      </p>
    </form>
  );
}
