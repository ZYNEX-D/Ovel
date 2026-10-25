"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOvelink, PRESET_OVELINKS } from "@/lib/ovelink-store";
import { getVipPassByToken, redeemVipPass } from "@/lib/vip-passes";
import OvelinkView from "@/components/OvelinkView";
import { Sparkles, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { useClientStore } from "@/lib/use-client-store";

export default function VipPassOfferPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "leclat";
  const token = (params?.token as string) || "";

  const vipPass = useMemo(() => {
    return getVipPassByToken(token);
  }, [token]);

  const rawConfig = useClientStore(
    () => getOvelink(slug),
    () => PRESET_OVELINKS[slug] || PRESET_OVELINKS.leclat
  );

  // If VIP pass is invalid or expired/redeemed
  const isInvalidOrExpired = !vipPass || vipPass.isRedeemed || new Date(vipPass.expiresAt).getTime() < Date.now();

  // If valid, customize the config with the VIP offerings
  const customizedConfig = useMemo(() => {
    if (!rawConfig || !vipPass || isInvalidOrExpired) return rawConfig;

    const overriddenOfferings = rawConfig.offerings.map((off) => {
      const match = vipPass.offerings.find((v) => v.offeringId === off.id);
      if (match) {
        return {
          ...off,
          name: `${off.name} (VIP Offer)`,
          priceCents: match.vipPriceCents,
          depositCents: match.vipDepositCents,
          description: match.description || off.description,
        };
      }
      return off;
    });

    return {
      ...rawConfig,
      businessTagline: `⭐ ${vipPass.title} • Private VIP Pass`,
      offerings: overriddenOfferings,
    };
  }, [rawConfig, vipPass, isInvalidOrExpired]);

  if (isInvalidOrExpired) {
    return (
      <div className="min-h-screen bg-[#F6FAF9] flex items-center justify-center p-6 text-center font-sans antialiased">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-black/10 shadow-xl space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#3A9295]">
              Single-Use VIP Pass
            </span>
            <h2 className="text-2xl font-light text-[#105F68] tracking-tight">
              Offer Expired or Already Redeemed
            </h2>
            <p className="text-xs text-[#3A9295] leading-relaxed">
              This private VIP pass has already been used to confirm an order or booking and is strictly limited to a single transaction.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/l/${slug}`}
              className="w-full py-3.5 rounded-full bg-[#105F68] hover:bg-[#0D4F57] text-white text-xs font-medium tracking-tight shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Visit Standard Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Top Floating VIP Pass Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white px-4 py-2 text-center text-xs font-medium shadow-md flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
        <span>VIP Single-Use Pass Active: Special discounted pricing applied. Auto-expires upon checkout.</span>
      </div>

      <OvelinkView
        config={customizedConfig}
        onBookingCreated={(bookingId) => {
          redeemVipPass(token, bookingId);
        }}
      />
    </div>
  );
}
