"use client";

import React, { createContext, useContext, useState } from "react";
import Image from "next/image";
import { useAudio } from "./AudioController";

interface TransitionContextType {
  triggerTransition: (callback?: () => void) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const useChannelTransition = () => useContext(TransitionContext);
export const useCurtainTransition = () => useContext(TransitionContext);

export function ChannelTransitionProvider({ children }: { children: React.ReactNode }) {
  // Phase: 'idle' | 'covering' | 'uncovering'
  const [phase, setPhase] = useState<"idle" | "covering" | "uncovering">("idle");
  const { playClick } = useAudio();

  const triggerTransition = (callback?: () => void) => {
    if (phase !== "idle") return;
    playClick();

    // 1. Curtain rises from bottom to cover page (translateY: 100% -> 0%)
    setPhase("covering");

    // After curtain covers the viewport (500ms)
    setTimeout(() => {
      if (callback) callback();

      // 2. Short pause then curtain carries on off the top (translateY: 0% -> -100%)
      setTimeout(() => {
        setPhase("uncovering");

        // 3. Reset to idle after curtain leaves top (550ms)
        setTimeout(() => {
          setPhase("idle");
        }, 550);
      }, 80);
    }, 500);
  };

  const isTransitioning = phase !== "idle";

  return (
    <TransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
      {/* Page Content with subtle drift and fade matching Interlude Curtain */}
      <div
        className={`w-full min-h-screen transition-transform transition-opacity duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          phase === "covering"
            ? "-translate-y-8 opacity-40 filter blur-[1px]"
            : phase === "uncovering"
            ? "translate-y-0 opacity-100"
            : "translate-y-0 opacity-100"
        }`}
      >
        {children}
      </div>

      {/* Primary Brand Curtain Panel (#105F68) */}
      <div
        className={`fixed inset-0 z-[999] pointer-events-none flex flex-col items-center justify-center bg-[#105F68] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          phase === "idle"
            ? "translate-y-full"
            : phase === "covering"
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
        aria-hidden="true"
      >
        {/* Subtle accent border line on the curtain leading edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8E6E2] via-[#63C1BB] to-[#3A9295]" />

        {/* Minimalist Logo Mark Reveal in Center of Curtain */}
        <div
          className={`flex flex-col items-center gap-3 transition-opacity duration-300 ${
            phase === "covering" ? "opacity-100 delay-150" : "opacity-0"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2.5 shadow-xl">
            <Image src="/icon.svg" alt="Ovel" width={36} height={36} className="brightness-200 invert" />
          </div>
          <span className="font-['Disolve'] text-2xl tracking-wider text-[#C8E6E2]">
            ovel
          </span>
        </div>

        {/* Subtle accent border line on the curtain trailing edge */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#105F68] via-[#3A9295] to-[#63C1BB]" />
      </div>

      {/* Secondary Depth Layer: Thin Mint Trail (#63C1BB) for fluid physical feel */}
      <div
        className={`fixed inset-0 z-[998] pointer-events-none bg-[#63C1BB] transition-transform duration-500 delay-75 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          phase === "idle"
            ? "translate-y-full"
            : phase === "covering"
            ? "translate-y-0"
            : "-translate-y-full"
        }`}
        aria-hidden="true"
      />
    </TransitionContext.Provider>
  );
}

export const CurtainTransitionProvider = ChannelTransitionProvider;
