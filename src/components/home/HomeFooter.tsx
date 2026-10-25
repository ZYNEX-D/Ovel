"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import ClickLink from "@/components/home/ClickLink";

export function BottomBlur() {
  return (
    <>
      {/* Multi-tier Progressive Lens Blur fixed to the bottom viewport (identical to cronicle.me) */}
      <div className="footer-blur" aria-hidden="true">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>

      {/* Atmospheric gradient fade blending content smoothly into the canvas */}
      <div className="footer-fade" aria-hidden="true" />

      <style jsx global>{`
        .footer-blur {
          bottom: 0;
          height: clamp(72px, 13vw, 200px);
          left: 0;
          pointer-events: none;
          position: fixed;
          right: 0;
          z-index: 30;
        }
        .footer-blur > div {
          inset: 0;
          position: absolute;
        }
        .footer-blur > div:first-child {
          backdrop-filter: blur(0.5px);
          -webkit-backdrop-filter: blur(0.5px);
          -webkit-mask: linear-gradient(0deg, transparent 70%, #000 87.5%, transparent);
          mask: linear-gradient(0deg, transparent 70%, #000 87.5%, transparent);
        }
        .footer-blur > div:nth-child(2) {
          backdrop-filter: blur(1px);
          -webkit-backdrop-filter: blur(1px);
          -webkit-mask: linear-gradient(0deg, transparent 55%, #000 70%, #000 82.5%, transparent 92.5%);
          mask: linear-gradient(0deg, transparent 55%, #000 70%, #000 82.5%, transparent 92.5%);
        }
        .footer-blur > div:nth-child(3) {
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          -webkit-mask: linear-gradient(0deg, transparent 40%, #000 55%, #000 67.5%, transparent 80%);
          mask: linear-gradient(0deg, transparent 40%, #000 55%, #000 67.5%, transparent 80%);
        }
        .footer-blur > div:nth-child(4) {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          -webkit-mask: linear-gradient(0deg, transparent 25%, #000 40%, #000 52.5%, transparent 67.5%);
          mask: linear-gradient(0deg, transparent 25%, #000 40%, #000 52.5%, transparent 67.5%);
        }
        .footer-blur > div:nth-child(5) {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          -webkit-mask: linear-gradient(0deg, transparent 12.5%, #000 25%, #000 37.5%, transparent 52.5%);
          mask: linear-gradient(0deg, transparent 12.5%, #000 25%, #000 37.5%, transparent 52.5%);
        }
        .footer-blur > div:nth-child(6) {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          -webkit-mask: linear-gradient(0deg, #000 0, #000 25%, transparent 40%);
          mask: linear-gradient(0deg, #000 0, #000 25%, transparent 40%);
        }
        .footer-fade {
          background: linear-gradient(0deg, #F6FAF9 0 20%, rgba(246, 250, 249, 0));
          bottom: 0;
          height: clamp(48px, 14vw, 280px);
          left: 0;
          pointer-events: none;
          position: fixed;
          right: 0;
          z-index: 31;
        }
        .footer-links-row a {
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-thickness: 1px;
          transition: opacity 0.2s ease;
        }
        .footer-links-row a:hover {
          opacity: 0.6;
        }
      `}</style>
    </>
  );
}

export default function HomeFooter() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#F6FAF9] pt-24 sm:pt-32 pb-0 flex flex-col items-center">
      {/* Call to action section styled with Cronicle's clean editorial rhythm */}
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#105F68]/5 border border-[#105F68]/15 text-[#105F68] text-xs font-light">
          <Sparkles className="w-3.5 h-3.5 text-[#3A9295]" />
          <span>Zero Commission Guarantee • Instant Direct Payouts</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-light text-[#105F68] tracking-tight leading-[1.05]">
          Reconnect to what you build.
        </h2>

        <p className="text-base sm:text-xl text-[#3A9295] font-light max-w-xl mx-auto leading-relaxed">
          The single link that replaces your booking app, quote software, deposit processor, and reminder system.
        </p>

        <div className="pt-2">
          <ClickLink
            href="/signup"
            className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-[#105F68] text-white text-base sm:text-lg font-light tracking-tight hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(16,95,104,0.25)] hover:scale-[1.02]"
          >
            <span>Claim your Ovelink free</span>
            <ArrowUpRight className="w-4 h-4" />
          </ClickLink>
        </div>
      </div>

      {/* Editorial Navigation Links (identical to Cronicle's layout) */}
      <nav className="footer-links-row mt-24 sm:mt-32 px-6 flex flex-wrap justify-center items-center gap-x-12 sm:gap-x-16 gap-y-4 text-sm sm:text-base font-light text-[#105F68] z-10">
        <a href="#how-it-works">How It Works</a>
        <a href="#savings">Savings Calculator</a>
        <Link href="/l/apex-studio" target="_blank">Live Studio Demo</Link>
        <Link href="/login">Sign In</Link>
        <Link href="/signup">Create Account</Link>
        <a href="mailto:hello@ovel.lk">Email Support</a>
      </nav>

      {/* Subtext info */}
      <div className="mt-8 text-center text-xs text-[#3A9295]/70 font-light z-10 px-6">
        © 2026 Ovel Inc. 0% take-rate direct commerce engine. All rights reserved.
      </div>

      {/* Giant Edge-to-Edge Architectural Wordmark (identical to Cronicle's bottom-mark) */}
      <div className="w-full mt-16 sm:mt-20 pointer-events-none select-none relative z-0">
        <svg
          viewBox="0 0 1440 290"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block transform translate-y-[8%]"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Subtle architectural grid lines behind wordmark */}
          <line x1="0" y1="288" x2="1440" y2="288" stroke="#105F68" strokeOpacity="0.08" strokeWidth="1" />
          
          <g opacity="0.08" fill="#105F68">
            {/* O */}
            <path d="M110 145C110 65 168 12 250 12C332 12 390 65 390 145C390 225 332 278 250 278C168 278 110 225 110 145ZM175 145C175 195 205 228 250 228C295 228 325 195 325 145C325 95 295 62 250 62C205 62 175 95 175 145Z" />
            {/* V */}
            <path d="M410 16H478L565 222H567L654 16H722L606 274H526L410 16Z" />
            {/* E */}
            <path d="M760 16H980V66H825V120H965V168H825V224H985V274H760V16Z" />
            {/* L */}
            <path d="M1030 16H1095V224H1260V274H1030V16Z" />
          </g>
        </svg>
      </div>

      {/* Fixed bottom blur and atmospheric fade */}
      <BottomBlur />
    </footer>
  );
}
