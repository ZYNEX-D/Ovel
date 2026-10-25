"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Package, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  ArrowUpRight, 
  Zap, 
  Calendar, 
  Gauge, 
  ShieldCheck, 
  Layers,
  ArrowRight,
  Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useClientStore, useHydrated } from "@/lib/use-client-store";
import { getServices, getProducts, getBookings, INITIAL_SERVICES, INITIAL_PRODUCTS, INITIAL_BOOKINGS } from "@/lib/platform-store";
import { 
  getMerchantSubscription, 
  setMerchantSubscription, 
  checkOfferingCapacity, 
  checkOrderQuotaStatus, 
  calculateOverflowFee,
  SUBSCRIPTION_PLANS, 
  SubscriptionTier 
} from "@/lib/subscription-store";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { getOvelink } from "@/lib/ovelink-store";
import { UsageMeter } from "@/components/arc/usage-meter/usage-meter";
import { ArcMetricCard } from "@/components/ui/ArcMetricCard";
import ArcBadge from "@/components/ui/ArcBadge";
import Toast from "@/components/arc/toast/toast";
import Alert from "@/components/arc/alert/alert";

export default function UsageDashboardPage() {
  const { profile } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const mounted = useHydrated();

  const merchantTarget = profile?.organizationId || profile?.organizationSlug || "leclat";
  const [subscription, setSubState] = useState(() => getMerchantSubscription(merchantTarget));
  const [notification, setNotification] = useState<string | null>(null);

  // Live Catalog and Booking State
  const services = useClientStore(() => getServices(merchantTarget), () => INITIAL_SERVICES);
  const products = useClientStore(() => getProducts(merchantTarget), () => INITIAL_PRODUCTS);
  const bookings = useClientStore(() => getBookings(merchantTarget), () => INITIAL_BOOKINGS);

  const activeOvelink = useClientStore(() => getOvelink(merchantTarget), () => null);
  const currency = activeOvelink?.currency || DEFAULT_CURRENCY;

  const totalCatalogCount = services.length + products.length;
  const capacity = checkOfferingCapacity(merchantTarget, totalCatalogCount);
  const monthlyOrderCount = bookings.length;
  const quota = checkOrderQuotaStatus(merchantTarget, monthlyOrderCount);
  const overflow = calculateOverflowFee(merchantTarget, monthlyOrderCount);

  const showToast = (msg: string) => {
    setNotification(msg);
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    playSuccess();
    const updated = setMerchantSubscription(merchantTarget, tier);
    setSubState(updated);
    showToast(`Switched plan to ${SUBSCRIPTION_PLANS[tier].name}!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Toast
            key={notification || "idle"}
            open={Boolean(notification)}
            onOpenChange={(open) => { if (!open) setNotification(null); }}
            title={notification || ""}
            duration={3500}
          />
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-light text-[#103438] tracking-tight">
              Usage &amp; Capacity
            </h1>
            <ArcBadge variant="teal" size="sm">
              {subscription.name} Plan
            </ArcBadge>
          </div>
          <p className="text-xs text-[#3A9295] max-w-2xl leading-relaxed">
            Monitor real-time catalog capacity allowances, physical inventory quotas, bookable services limits, and active subscription benefits.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/services"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-white hover:bg-[#F6FAF9] text-xs text-[#105F68] transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Manage Services</span>
          </Link>
          <Link
            href="/dashboard/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-white hover:bg-[#F6FAF9] text-xs text-[#105F68] transition-all shadow-xs"
          >
            <Package className="w-3.5 h-3.5 text-[#3A9295]" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* Capacity Warning Alert if near or at limit */}
      {capacity.isAtCapacity && (
        <Alert
          tone="warning"
          title="Catalog Capacity Limit Reached"
        >
          Your active {subscription.name} tier limit of {capacity.maxOfferings} items is full. Upgrade your plan below to publish more services or products.
        </Alert>
      )}

      {/* Primary Bento: Catalog Capacity Allowance Meter */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-[#105F68]" />
              <h2 className="text-base font-semibold text-[#103438]">
                Catalog Capacity Allowance
              </h2>
            </div>
            <p className="text-xs text-[#3A9295] mt-1">
              Live consumption across all bookable services and physical merchandise.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ArcBadge variant={capacity.isAtCapacity ? "amber" : "neutral"} size="sm">
              {totalCatalogCount} of {capacity.maxOfferings} items used
            </ArcBadge>
            <ArcBadge variant="teal" size="sm">
              {capacity.remainingCapacity} items free
            </ArcBadge>
          </div>
        </div>

        {/* Arc UI UsageMeter */}
        <div className="pt-2">
          <UsageMeter
            label="Catalog Capacity Allowance"
            limit={capacity.maxOfferings}
            unit="items"
            decimals={0}
            freeLabel="Available Slots"
            overLabel="Over Plan Limit"
            warnAt={0.8}
            segments={[
              { id: "products", label: "Physical Products", value: products.length },
              { id: "services", label: "Bookable Services", value: services.length },
            ]}
          />
        </div>

        {/* Breakdown Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-black/5">
          <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#3A9295] block">Physical Products</span>
              <span className="text-lg font-light text-[#103438] tracking-tight">{products.length} items</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F6FAF9] border border-black/5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#105F68]/10 text-[#105F68] flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#3A9295] block">Bookable Services</span>
              <span className="text-lg font-light text-[#103438] tracking-tight">{services.length} items</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#C8E6E2]/25 border border-[#105F68]/15 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#105F68] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#105F68] block">Available Slots</span>
              <span className="text-lg font-semibold text-[#105F68] tracking-tight">{capacity.remainingCapacity} items free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ArcMetricCard
          label="Catalog Capacity"
          value={`${totalCatalogCount} / ${capacity.maxOfferings}`}
          subValue={`${capacity.remainingCapacity} items free`}
          trend={{ value: `${Math.round((totalCatalogCount / capacity.maxOfferings) * 100)}% used`, isNeutral: true }}
          icon={Gauge}
        />
        <ArcMetricCard
          label="Monthly Bookings & Orders"
          value={monthlyOrderCount}
          subValue={`Quota: ${quota.maxMonthlyOrders} orders/mo`}
          trend={{ value: `${Math.max(0, quota.maxMonthlyOrders - monthlyOrderCount)} remaining`, isPositive: true }}
          icon={Calendar}
        />
        <ArcMetricCard
          label="Estimated Overflow Fee"
          value={mounted ? `LKR ${overflow.overflowFeeLkr.toLocaleString()}` : "LKR 0"}
          subValue={quota.isOverQuota ? `${overflow.overflowOrders} excess bookings (+1 LKR/ea)` : "Within quota allowance"}
          icon={Sparkles}
          statusDot="live"
        />
      </div>

      {/* Subscription Plans & Upgrade Center */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[#103438]">
            Subscription Plans &amp; Quota Tiers
          </h2>
          <p className="text-xs text-[#3A9295] mt-1">
            Choose the capacity tier suited to your catalog size and booking throughput. All plans feature direct customer deposits and zero payment processing commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionTier[]).map((tierKey) => {
            const plan = SUBSCRIPTION_PLANS[tierKey];
            const isCurrent = subscription.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative ${
                  isCurrent
                    ? "border-[#105F68] bg-[#F6FAF9] ring-2 ring-[#105F68]/20 shadow-sm"
                    : "border-black/10 bg-white hover:border-[#105F68]/30 hover:shadow-xs"
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <ArcBadge variant="teal" size="xs">
                      Active Plan
                    </ArcBadge>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#103438]">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-light text-[#103438]">
                        {plan.priceLkr > 0 ? `LKR ${plan.priceLkr.toLocaleString()}` : "Free"}
                      </span>
                      {plan.priceLkr > 0 && <span className="text-xs text-slate-500">/ month</span>}
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#3A9295] pt-2 border-t border-black/5">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                      <span>Up to <b>{plan.maxOfferings} catalog items</b></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                      <span><b>{plan.maxMonthlyOrders} orders/mo</b> included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                      <span>Public Ovelink storefront &amp; booking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#105F68] shrink-0" />
                      <span>Custom brand typography &amp; themes</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(tierKey)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? "bg-[#105F68]/10 text-[#105F68] cursor-default"
                        : "bg-[#105F68] hover:bg-[#0D4F57] text-white shadow-xs active:scale-95"
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <span>Switch to {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
