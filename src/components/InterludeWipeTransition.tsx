"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "./AudioController";

type WipeDirection = "forward" | "backward";
type WipePhase = "idle" | "covering" | "covered" | "uncovering";

interface InterludeWipeContextType {
  triggerWipe: (targetUrl: string, direction?: WipeDirection, callback?: () => void) => void;
  isWiping: boolean;
  phase: WipePhase;
  stepLabel?: string;
  setStepLabel: (label: string) => void;
}

const InterludeWipeContext = createContext<InterludeWipeContextType>({
  triggerWipe: () => {},
  isWiping: false,
  phase: "idle",
  stepLabel: undefined,
  setStepLabel: () => {},
});

export const useInterludeWipe = () => useContext(InterludeWipeContext);

export function InterludeWipeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { playClick, playChannelSwitch } = useAudio();
  
  const [phase, setPhase] = useState<WipePhase>("idle");
  const [direction, setDirection] = useState<WipeDirection>("forward");
  const [stepLabel, setStepLabel] = useState<string | undefined>(undefined);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      // Clean up timers on unmount
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const triggerWipe = useCallback((targetUrl: string, dir: WipeDirection = "forward", callback?: () => void) => {
    if (phaseRef.current !== "idle") return;

    // Trigger audio feedback
    if (playChannelSwitch) {
      playChannelSwitch();
    } else {
      playClick();
    }

    setDirection(dir);
    setPhase("covering");

    // Phase 1: Covering (360ms to slide across to center)
    const t1 = setTimeout(() => {
      setPhase("covered");

      // Midpoint: execute callback or route navigation
      if (callback) {
        callback();
      } else if (targetUrl) {
        router.push(targetUrl);
      }

      // Small pause to allow React / Next.js to mount the new page while curtain is closed
      const t2 = setTimeout(() => {
        setPhase("uncovering");

        // Phase 2: Uncovering (380ms to slide off viewport)
        const t3 = setTimeout(() => {
          setPhase("idle");
        }, 420);
        timerRefs.current.push(t3);
      }, 70);
      timerRefs.current.push(t2);
    }, 360);
    timerRefs.current.push(t1);
  }, [router, playClick, playChannelSwitch]);

  const value = useMemo(() => ({
    triggerWipe,
    isWiping: phase !== "idle",
    phase,
    stepLabel,
    setStepLabel,
  }), [triggerWipe, phase, stepLabel]);

  // Transform styles based on direction and phase
  // Forward: Left to Right (-100% -> 0 -> +100%)
  // Backward: Right to Left (+100% -> 0 -> -100%)
  const getPanelTransform = () => {
    const isForward = direction === "forward";

    if (phase === "idle") {
      return isForward ? "-translate-x-full" : "translate-x-full";
    }

    if (phase === "covering" || phase === "covered") {
      return "translate-x-0";
    }

    // Uncovering
    return isForward ? "translate-x-full" : "-translate-x-full";
  };

  const isIdle = phase === "idle";

  return (
    <InterludeWipeContext.Provider value={value}>
      {/* Page Content Wrapper with subtle exit/entrance drift */}
      <div
        className={`w-full min-h-screen transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          phase === "covering"
            ? "opacity-60 scale-[0.985] blur-[0.5px]"
            : phase === "uncovering"
            ? "opacity-95 scale-[0.995]"
            : "opacity-100 scale-100 blur-0"
        }`}
      >
        {children}
      </div>

      {/* Layer 1: Leading Accent Blade (Mint Trail #63C1BB / #C8E6E2) */}
      <div
        className={`fixed inset-0 z-[998] pointer-events-none bg-gradient-to-r from-[#63C1BB] to-[#3A9295] will-change-transform ${
          isIdle
            ? "invisible transition-none"
            : "visible transition-transform ease-[cubic-bezier(0.76,0,0.24,1)]"
        } ${getPanelTransform()}`}
        style={{
          transitionDuration: isIdle ? "0ms" : phase === "covering" ? "360ms" : "400ms",
          transitionDelay: isIdle ? "0ms" : phase === "covering" ? "0ms" : "40ms",
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Main Primary Curtain (Deep Brand Teal #105F68) */}
      <div
        className={`fixed inset-0 z-[999] pointer-events-none flex flex-col items-center justify-center bg-[#105F68] will-change-transform shadow-2xl ${
          isIdle
            ? "invisible transition-none"
            : "visible transition-transform ease-[cubic-bezier(0.76,0,0.24,1)]"
        } ${getPanelTransform()}`}
        style={{
          transitionDuration: isIdle ? "0ms" : phase === "covering" ? "380ms" : "420ms",
          transitionDelay: isIdle ? "0ms" : phase === "covering" ? "35ms" : "0ms",
        }}
        aria-hidden="true"
      >
        {/* Subtle accent border on the leading wipe edge */}
        <div
          className={`absolute top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#C8E6E2] via-[#63C1BB] to-[#9ED5D1] shadow-[0_0_15px_rgba(99,193,187,0.8)] ${
            direction === "forward" ? "right-0" : "left-0"
          }`}
        />

        {/* Minimalist Interlude Reveal at Curtain Center */}
        <div
          className={`flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
            phase === "covering" || phase === "covered"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }`}
        >
          <span className="font-['Disolve'] text-4xl sm:text-5xl tracking-widest text-[#C8E6E2]">
            Ovel
          </span>
          {stepLabel && (
            <span className="text-xs uppercase tracking-[0.25em] font-medium text-[#9ED5D1]/90">
              {stepLabel}
            </span>
          )}
        </div>
      </div>
    </InterludeWipeContext.Provider>
  );
}

export default InterludeWipeProvider;
