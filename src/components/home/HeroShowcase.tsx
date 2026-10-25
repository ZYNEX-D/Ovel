"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ShoppingBag,
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  ExternalLink,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useAudio } from "@/components/AudioController";

const ENGINES = [
  {
    id: "appointments",
    label: "Appointments & Care",
    icon: Calendar,
    brandName: "Apex Auto Lab",
    tagline: "Paint Correction & Ceramic Coating",
    slug: "apex-studio",
    url: "ovel.lk/l/apex-studio",
    serviceName: "Signature 2-Stage Paint Correction",
    serviceDuration: "3h 30m slot • +30m Buffer",
    servicePrice: "Rs. 28,000.00",
    deposit: "Rs. 6,000.00 upfront deposit",
    themeColor: "#105F68",
    accentColor: "#63C1BB",
    bannerGradient: "from-[#0F282C] via-[#105F68] to-[#1C7A85]",
    slots: ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"],
    selectedSlot: "10:30 AM",
    badge: "Buffer Engine Active",
  },
  {
    id: "rentals",
    label: "Space & Gear Rentals",
    icon: Clock,
    brandName: "Vance Production Loft",
    tagline: "Daylight Cyc & Photography Bay",
    slug: "vance-studio",
    url: "ovel.lk/l/vance-studio",
    serviceName: "Full Daylight Cyc Studio (Hourly)",
    serviceDuration: "2 Hour Minimum • Includes Profoto Kit",
    servicePrice: "Rs. 16,000.00 / 2h",
    deposit: "Rs. 8,000.00 upfront card hold",
    themeColor: "#18181B",
    accentColor: "#6366F1",
    bannerGradient: "from-[#18181B] via-[#27272A] to-[#3F3F46]",
    slots: ["11:00 AM - 01:00 PM", "01:30 PM - 03:30 PM", "04:00 PM - 06:00 PM"],
    selectedSlot: "01:30 PM - 03:30 PM",
    badge: "Zero Overlaps",
  },
  {
    id: "orders",
    label: "Custom Orders",
    icon: ShoppingBag,
    brandName: "Velvet Crumb Bakes",
    tagline: "Artisanal Custom Cakes & Tastings",
    slug: "craft-bakes",
    url: "ovel.lk/l/craft-bakes",
    serviceName: "3-Tier Floral Pistachio Velvet Cake",
    serviceDuration: "Lead time: 4 days • Pickup or Courier",
    servicePrice: "Rs. 18,500.00",
    deposit: "Rs. 5,000.00 booking lock",
    themeColor: "#451A03",
    accentColor: "#D97706",
    bannerGradient: "from-[#451A03] via-[#78350F] to-[#92400E]",
    slots: ["Thu, Oct 29 Tasting", "Fri, Oct 30 Pickup", "Sat, Oct 31 Event"],
    selectedSlot: "Fri, Oct 30 Pickup",
    badge: "Deposit Auto-Credit",
  },
];

export default function HeroShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const activeEngine = ENGINES[activeTab];
  const { playClick } = useAudio();

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-12 sm:mt-16 lg:mt-20">
      {/* Floating Satellite Badge: WhatsApp Confirmation */}
      <div className="hidden lg:flex items-center gap-3 absolute -top-8 -right-6 z-20 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#105F68]/15 shadow-xl shadow-[#105F68]/10 animate-[bounce_6s_ease-in-out_infinite]">
        <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-[#1EBE5D] flex-shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#105F68]">2-Way WhatsApp Confirmation</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1EBE5D] animate-ping" />
          </div>
          <p className="text-[10px] text-[#3A9295] font-light">Client replied &ldquo;1&rdquo; • -25% No-Shows</p>
        </div>
      </div>

      {/* Floating Satellite Badge: 0% Commission */}
      <div className="hidden lg:flex items-center gap-3 absolute -bottom-7 -left-6 z-20 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-[#105F68]/15 shadow-xl shadow-[#105F68]/10 animate-[bounce_7s_ease-in-out_infinite_reverse]">
        <div className="w-9 h-9 rounded-xl bg-[#63C1BB]/20 flex items-center justify-center text-[#105F68] flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#105F68]" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#105F68]">100% Direct Payout</span>
            <span className="text-[9px] bg-[#C8E6E2]/60 text-[#105F68] px-1.5 py-0.2 rounded-full font-bold">
              0% TAKE-RATE
            </span>
          </div>
          <p className="text-[10px] text-[#3A9295] font-light">Rs. 18,500.00 collected • Ovel fee: Rs. 0.00</p>
        </div>
      </div>

      {/* Main Glass Mockup Container */}
      <div className="rounded-3xl border border-[#105F68]/15 bg-white/80 backdrop-blur-xl shadow-[0_25px_80px_-20px_rgba(16,95,104,0.18)] overflow-hidden transition-all duration-500">
        {/* Mockup Header Browser Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#F6FAF9] to-white border-b border-[#105F68]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]/80" />
          </div>

          {/* Clean URL bar */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#105F68]/15 text-xs text-[#105F68] shadow-inner font-mono">
            <Lock className="w-3 h-3 text-[#63C1BB]" />
            <span className="font-semibold">{activeEngine.url}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#63C1BB] animate-pulse" />
          </div>

          <Link
            href={`/l/${activeEngine.slug}`}
            target="_blank"
            onClick={() => playClick()}
            className="flex items-center gap-1.5 text-xs text-[#105F68] hover:text-[#0D4F57] transition-colors font-medium group"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-[#105F68]/10 bg-[#F6FAF9]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {ENGINES.map((engine, idx) => {
            const Icon = engine.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={engine.id}
                onClick={() => {
                  playClick();
                  setActiveTab(idx);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#105F68] text-white shadow-md shadow-[#105F68]/20"
                    : "text-[#3A9295] hover:text-[#105F68] hover:bg-white/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{engine.label}</span>
                {isActive && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-light">Active</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Preview Body */}
        <div className="p-4 sm:p-8 bg-gradient-to-b from-white to-[#F6FAF9]/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Brand Identity Banner */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`p-6 rounded-2xl bg-gradient-to-br ${activeEngine.bannerGradient} text-white shadow-lg space-y-4 relative overflow-hidden`}
              >
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8E6E2]">
                    OVELINK HOSTED
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 font-medium">
                    {activeEngine.badge}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-light tracking-tight">{activeEngine.brandName}</h4>
                  <p className="text-xs text-white/70 font-light mt-1">{activeEngine.tagline}</p>
                </div>
                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-[#C8E6E2]">
                  <span>Instant Card Deposits</span>
                  <Check className="w-4 h-4 text-[#63C1BB]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#105F68]/10 text-xs text-[#3A9295] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#105F68]" />
                  <span>Custom Fonts, Themes &amp; Add-ons</span>
                </div>
                <span className="text-[10px] text-[#105F68] font-bold">100% BRANDED</span>
              </div>
            </div>

            {/* Right: Interactive Booking Selector */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#105F68]/10 shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#3A9295]">
                    SELECT SERVICE OR ITEM
                  </span>
                  <h4 className="text-lg sm:text-xl font-light text-[#105F68] mt-1">
                    {activeEngine.serviceName}
                  </h4>
                  <p className="text-xs text-[#3A9295] mt-0.5">{activeEngine.serviceDuration}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg sm:text-xl font-medium text-[#105F68]">
                    {activeEngine.servicePrice}
                  </span>
                  <div className="text-[10px] text-[#3A9295]">{activeEngine.deposit}</div>
                </div>
              </div>

              {/* Time Slots Chips */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A9295] block mb-2.5">
                  Available Slots Today
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeEngine.slots.map((slot) => {
                    const isSelected = slot === activeEngine.selectedSlot;
                    return (
                      <div
                        key={slot}
                        className={`text-center py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-[#105F68] text-white border-[#105F68] shadow-sm"
                            : "bg-[#F6FAF9] text-[#105F68] border-[#105F68]/10 hover:border-[#105F68]/30"
                        }`}
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button & Trust Guarantee */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5">
                <div className="flex items-center gap-2 text-xs text-[#3A9295]">
                  <Check className="w-3.5 h-3.5 text-[#1EBE5D]" />
                  <span>No card surcharge • Instant confirmation</span>
                </div>

                <Link
                  href={`/l/${activeEngine.slug}`}
                  target="_blank"
                  onClick={() => playClick()}
                  className="w-full sm:w-auto bg-[#105F68] hover:bg-[#0D4F57] text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-light tracking-tight flex items-center justify-center gap-2 transition-all hover:shadow-md group"
                >
                  <span>Experience Live Booking</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
