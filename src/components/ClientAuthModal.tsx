"use client";

import React, { useState } from "react";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Phone, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck 
} from "lucide-react";
import { registerOrLoginClient, loginClientWithPhone, ClientAccount } from "@/lib/client-auth";
import { useAudio } from "@/components/AudioController";
import { BottomSheet } from "@/components/arc/bottom-sheet/bottom-sheet";

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: ClientAccount) => void;
  businessName?: string;
}

export default function ClientAuthModal({
  isOpen,
  onClose,
  onSuccess,
  businessName = "Merchant",
}: ClientAuthModalProps) {
  const { playClick, playSuccess } = useAudio();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrorMsg(null);
    playClick();

    if (step === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      setDirection("forward");
      setStep(2);
      return;
    }

    if (step === 2) {
      const cleanPhone = phone.replace(/[^0-9+]/g, "");
      if (!cleanPhone || cleanPhone.length < 8) {
        setErrorMsg("Please enter a valid mobile phone number.");
        return;
      }
      setDirection("forward");
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!password || password.length < 4) {
        setErrorMsg("Password must be at least 4 characters.");
        return;
      }
      setDirection("forward");
      setStep(4);
      return;
    }

    if (step === 4) {
      // Complete registration / login
      try {
        const account = registerOrLoginClient(fullName, phone, password, keepSignedIn);
        playSuccess();
        setDirection("forward");
        setStep(5);
        // Automatically proceed after greeting
        setTimeout(() => {
          onSuccess(account);
        }, 1800);
      } catch (err: unknown) {
        setErrorMsg((err as Error)?.message || "Failed to initialize account.");
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    playClick();
    setDirection("back");
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={step < 5 ? `Step ${step} of 4 • Client Access` : "Welcome"}
      description={`Quick sign-in for ${businessName}`}
      detents={[0.78, 0.95]}
      initialDetent={0}
    >
      <div className="relative w-full overflow-hidden flex flex-col bg-white">
        {/* Progress header bar */}
        <div className="pb-2 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#3A9295] transition-all cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs font-mono uppercase tracking-wider text-[#3A9295]">
              {step < 5 ? `Step ${step} of 4 • Client Access` : "Welcome"}
            </span>
          </div>
        </div>

        {/* Visual Progress Line */}
        {step < 5 && (
          <div className="w-full h-1 bg-black/5">
            <div
              className="h-full bg-[#105F68] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Dynamic Multi-Step Conversational Body */}
        <div className="p-8 min-h-[320px] flex flex-col justify-between">
          {/* SCREEN 1: Full Name */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  Quick Client Sign-In
                </span>
                <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                  What is your full name?
                </h3>
                <p className="text-xs text-[#3A9295]">
                  Your name will be placed on your appointment booking and official receipt.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Kasun Perera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-sm text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner"
                />
                <User className="w-5 h-5 text-[#3A9295] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* SCREEN 2: Phone Number */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  Contact Number
                </span>
                <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                  What is your phone number?
                </h3>
                <p className="text-xs text-[#3A9295]">
                  Used to confirm your slot, send WhatsApp reminders, and sign into your portal.
                </p>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  autoFocus
                  required
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-sm text-[#105F68] font-mono focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner"
                />
                <Phone className="w-5 h-5 text-[#3A9295] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          {/* SCREEN 3: Password */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  Portal Security
                </span>
                <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                  Choose a password
                </h3>
                <p className="text-xs text-[#3A9295]">
                  Simple password to access your client portal, check order status, or reschedule.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  required
                  placeholder="Create your secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#F6FAF9] border border-black/10 text-sm text-[#105F68] focus:outline-none focus:border-[#105F68] focus:bg-white transition-all shadow-inner"
                />
                <Lock className="w-5 h-5 text-[#3A9295] absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: Keep Signed In */}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3A9295]">
                  One-Tap Convenience
                </span>
                <h3 className="text-2xl font-light text-[#105F68] tracking-tight">
                  Stay signed in on this device?
                </h3>
                <p className="text-xs text-[#3A9295]">
                  Skip typing your password next time you book or track your order with {businessName}.
                </p>
              </div>

              <div
                onClick={() => setKeepSignedIn(!keepSignedIn)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  keepSignedIn
                    ? "border-[#105F68] bg-[#C8E6E2]/25 shadow-sm"
                    : "border-black/10 bg-[#F6FAF9]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      keepSignedIn ? "bg-[#105F68] text-white" : "border border-black/20 bg-white"
                    }`}
                  >
                    {keepSignedIn && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#105F68] block">
                      Keep me signed in
                    </span>
                    <span className="text-[11px] text-[#3A9295]">
                      Encrypted local session token
                    </span>
                  </div>
                </div>

                <ShieldCheck className="w-5 h-5 text-[#105F68]" />
              </div>
            </div>
          )}

          {/* SCREEN 5: Greetings & Confirmation Celebration */}
          {step === 5 && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-full bg-[#105F68] text-white flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-8 h-8 text-[#63C1BB]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
                  Welcome, {fullName.split(" ")[0]}!
                </h3>
                <p className="text-xs text-[#3A9295] max-w-xs mx-auto">
                  Your account is secured. Returning to complete your order at {businessName}...
                </p>
              </div>

              <div className="w-8 h-1 bg-[#105F68]/20 rounded-full overflow-hidden">
                <div className="w-full h-full bg-[#105F68] animate-pulse" />
              </div>
            </div>
          )}

          {/* Error notification */}
          {errorMsg && (
            <p className="text-xs text-red-600 font-medium mt-2 animate-in fade-in">
              {errorMsg}
            </p>
          )}

          {/* Bottom Actions */}
          {step < 5 && (
            <div className="pt-6 border-t border-black/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {step === 4 ? "Final Step" : `Next: ${step === 1 ? "Phone" : step === 2 ? "Password" : "Session"}`}
              </span>

              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all"
              >
                <span>{step === 4 ? "Complete & Continue" : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
