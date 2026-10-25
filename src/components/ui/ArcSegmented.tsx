"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAudio } from "@/components/AudioController";

export interface ArcSegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface ArcSegmentedProps<T extends string = string> {
  options: ArcSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  layoutId?: string;
}

export default function ArcSegmented<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
  layoutId = "arc-segmented-pill",
}: ArcSegmentedProps<T>) {
  const { playClick } = useAudio();

  const sizeClasses = size === "sm" ? "p-0.5 text-[11px]" : "p-1 text-xs";
  const itemPadding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";

  return (
    <div
      role="tablist"
      className={`relative inline-flex items-center rounded-2xl bg-[#F0F5F4] border border-black/[0.06] select-none ${sizeClasses} ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.id;

        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              if (value !== option.id) {
                playClick();
                onChange(option.id);
              }
            }}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors duration-150 ${itemPadding} ${
              isSelected ? "text-[#105F68] font-semibold" : "text-slate-600 hover:text-[#105F68]"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
                className="absolute inset-0 z-[-1] rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-black/[0.04]"
              />
            )}
            {option.icon && (
              <span className="shrink-0">
                {React.isValidElement(option.icon)
                  ? option.icon
                  : React.createElement(option.icon as unknown as React.ComponentType<{ className?: string }>, { className: "w-3.5 h-3.5" })}
              </span>
            )}
            <span>{option.label}</span>
            {typeof option.count === "number" && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-[#105F68]/10 text-[#105F68]" : "bg-black/5 text-slate-500"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { ArcSegmented };
