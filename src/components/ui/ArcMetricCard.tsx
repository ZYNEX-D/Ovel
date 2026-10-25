"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

export interface ArcMetricCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  subtext?: string;
  icon?: React.ReactNode | LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  pulse?: boolean;
  pulseLabel?: string;
  statusDot?: "live" | "neutral" | "warning";
  highlight?: boolean;
  variant?: "default" | "brand" | "emerald" | "amber" | "dark";
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

export function ArcMetricCard({
  label,
  value,
  subValue,
  subtext,
  icon,
  trend,
  pulse = false,
  pulseLabel,
  statusDot,
  highlight = false,
  variant = "default",
  badgeText,
  className = "",
  onClick,
}: ArcMetricCardProps) {
  const finalSubtext = subValue || subtext;
  const isLive = pulse || statusDot === "live";

  // Variant styling
  const variantClasses = {
    default: "bg-white border-slate-200/80 text-slate-900 shadow-xs hover:border-[#105F68]/30",
    brand: "bg-[#105F68] border-[#105F68] text-white shadow-xs hover:bg-[#0D4F57]",
    emerald: "bg-emerald-50/50 border-emerald-200/70 text-emerald-950 shadow-xs hover:border-emerald-300",
    amber: "bg-amber-50/50 border-amber-200/70 text-amber-950 shadow-xs hover:border-amber-300",
    dark: "bg-slate-900 border-slate-800 text-white shadow-xs",
  }[variant] || "bg-white border-slate-200/80 text-slate-900";

  const isBrand = variant === "brand" || variant === "dark";

  const iconNode = (() => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="w-3.5 h-3.5" />;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${variantClasses} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Ambient background glow for highlight or live */}
      {(highlight || isLive) && (
        <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${isBrand ? "from-[#63C1BB]/20 to-transparent" : "from-[#105F68]/10 via-[#63C1BB]/10 to-transparent"} -z-10 blur-[2px] opacity-70`} />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLive && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBrand ? "bg-[#63C1BB]" : "bg-emerald-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isBrand ? "bg-[#63C1BB]" : "bg-emerald-500"}`} />
            </span>
          )}
          <span className={`text-[11px] font-medium uppercase tracking-wider truncate ${isBrand ? "text-[#C8E6E2]" : "text-slate-500"}`}>
            {label}
          </span>
          {pulseLabel && (
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/50">
              {pulseLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isBrand ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
              {badgeText}
            </span>
          )}
          {iconNode && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isBrand ? "bg-white/10 text-[#63C1BB]" : "bg-slate-50 text-slate-600"}`}>
              {iconNode}
            </div>
          )}
        </div>
      </div>

      {/* Value & Trend */}
      <div className="mt-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-2xl sm:text-3xl font-light tracking-tight ${isBrand ? "text-white" : "text-slate-900"}`}>
            {value}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                trend.isNeutral
                  ? isBrand ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                  : trend.isPositive
                  ? isBrand ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                  : isBrand ? "bg-rose-500/20 text-rose-200" : "bg-rose-50 text-rose-700"
              }`}
            >
              {!trend.isNeutral && (
                trend.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {finalSubtext && (
          <p className={`text-[11px] mt-1 ${isBrand ? "text-[#C8E6E2]" : "text-slate-500"}`}>
            {finalSubtext}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default ArcMetricCard;
