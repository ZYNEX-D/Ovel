"use client";

import React, { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
}

const valueRoll: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: `${direction * 0.35}em`,
    filter: `blur(${motionTokens.blur.soft}px)`,
  }),
  center: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: motionTokens.duration.standard,
      ease: [...motionTokens.ease.enter],
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: `${direction * -0.3}em`,
    filter: `blur(${motionTokens.blur.subtle}px)`,
    transition: {
      duration: motionTokens.duration.fast,
      ease: [...motionTokens.ease.standard],
    },
  }),
};

const valueFade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: motionTokens.duration.instant } },
  exit: { opacity: 0, transition: { duration: motionTokens.duration.instant } },
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    label,
    options,
    value: controlledValue,
    defaultValue = "",
    onValueChange,
    placeholder = "Select an option",
    disabled = false,
    id,
    className,
    triggerClassName,
  },
  ref
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const activeIndex = options.findIndex((opt) => opt.value === currentValue);
  const selectedOption = options[activeIndex];
  const [previousIndex, setPreviousIndex] = useState(activeIndex);
  const [direction, setDirection] = useState(1);

  if (previousIndex !== activeIndex) {
    setPreviousIndex(activeIndex);
    setDirection(activeIndex > previousIndex ? 1 : -1);
  }

  // Click-outside listener
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const enabled = options.filter((o) => !o.disabled);
      if (!enabled.length) return;
      const currentIdx = enabled.findIndex((o) => o.value === currentValue);
      const nextIdx =
        e.key === "ArrowDown"
          ? (currentIdx + 1) % enabled.length
          : (currentIdx - 1 + enabled.length) % enabled.length;
      const nextVal = enabled[nextIdx].value;
      if (controlledValue === undefined) setUncontrolledValue(nextVal);
      onValueChange?.(nextVal);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      if (!open) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      return;
    }
  };

  const handleSelect = (val: string) => {
    if (controlledValue === undefined) setUncontrolledValue(val);
    onValueChange?.(val);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={controlId} className={styles.label}>
          {label}
        </label>
      )}
      <button
        ref={ref}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-open={open ? "true" : "false"}
        data-disabled={disabled ? "true" : "false"}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={[styles.trigger, triggerClassName].filter(Boolean).join(" ")}
      >
        <span className={styles.valueContainer}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.span
              key={currentValue ? `val-${currentValue}` : "placeholder"}
              custom={direction}
              variants={reduceMotion ? valueFade : valueRoll}
              initial="enter"
              animate="center"
              exit="exit"
              className={styles.valueText}
            >
              {selectedOption ? (
                <span className="flex items-center gap-1.5">
                  {selectedOption.icon}
                  <span>{selectedOption.label}</span>
                </span>
              ) : (
                <span className="text-slate-400">{placeholder}</span>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDown size={15} strokeWidth={2} className={styles.chevron} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.popover}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: reduceMotion
                ? { duration: motionTokens.duration.instant }
                : { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast } },
            }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.98,
              transition: { duration: motionTokens.duration.instant },
            }}
          >
            <div className={styles.listbox} role="listbox">
              {options.map((opt) => {
                const isSelected = opt.value === currentValue;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected ? "true" : "false"}
                    data-disabled={opt.disabled ? "true" : "false"}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={styles.item}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && <Check size={14} strokeWidth={2.5} className={styles.check} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = "Select";
