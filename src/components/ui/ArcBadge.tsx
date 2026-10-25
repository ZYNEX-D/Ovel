"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export type ArcBadgeVariant = 
  | "teal" 
  | "emerald" 
  | "amber" 
  | "rose" 
  | "neutral" 
  | "pro" 
  | "outline";

export interface ArcBadgeProps {
  children: React.ReactNode;
  variant?: ArcBadgeVariant;
  size?: "xs" | "sm" | "md";
  pulse?: boolean;
  pulseDot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode | LucideIcon;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<ArcBadgeVariant, { bg: string; text: string; border: string; dot: string; ping: string }> = {
  teal: {
    bg: "bg-[#105F68]/10",
    text: "text-[#105F68]",
    border: "border-[#105F68]/20",
    dot: "bg-[#105F68]",
    ping: "bg-[#63C1BB]",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    ping: "bg-rose-400",
  },
  neutral: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    ping: "bg-slate-300",
  },
  pro: {
    bg: "bg-gradient-to-r from-[#105F68]/15 via-[#63C1BB]/20 to-[#105F68]/15",
    text: "text-[#105F68]",
    border: "border-[#63C1BB]/40 shadow-xs",
    dot: "bg-[#63C1BB]",
    ping: "bg-[#105F68]",
  },
  outline: {
    bg: "bg-transparent",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    ping: "bg-slate-300",
  },
};

export function ArcBadge({
  children,
  variant = "teal",
  size = "md",
  pulse = false,
  pulseDot = false,
  icon,
  className = "",
  onClick,
}: ArcBadgeProps) {
  const styles = variantStyles[variant];
  const isPulsing = pulse || pulseDot;
  const sizeClasses = size === "xs"
    ? "text-[9px] px-1.5 py-0.5 gap-1"
    : size === "sm" 
    ? "text-[10px] px-2 py-0.5 gap-1" 
    : "text-[11px] px-2.5 py-1 gap-1.5";

  // Check if icon is a React component or node
  const iconNode = (() => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />;
  })();

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium rounded-full border transition-all duration-200 select-none ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${
        onClick ? "cursor-pointer hover:opacity-85 active:scale-95" : ""
      } ${className}`}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.ping}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
        </span>
      )}
      {iconNode && <span className="shrink-0">{iconNode}</span>}
      <span>{children}</span>
    </span>
  );
}

export default ArcBadge;
