"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InputHTMLAttributes, KeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
  badge?: string;
  subtext?: string;
  disabled?: boolean;
  keywords?: string[];
  icon?: ReactNode;
  renderItem?: () => ReactNode;
}

export interface ComboboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "placeholder"> {
  label?: string;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  description?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  controlClassName?: string;
}

function AutoHeight({ children, reduceMotion }: { children: ReactNode; reduceMotion: boolean | null }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setHeight(inner.offsetHeight));
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div
      className={styles.autoHeight}
      initial={false}
      animate={{ height }}
      transition={reduceMotion ? { duration: 0 } : motionTokens.spring.smooth}
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    label,
    options,
    value: controlledValue,
    defaultValue = "",
    onValueChange,
    description,
    placeholder = "Type to search or select…",
    emptyMessage = "No matches found",
    id,
    className,
    controlClassName,
    disabled,
    onFocus,
    ...inputProps
  },
  forwardedRef
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const listboxId = `${controlId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const reduceMotion = useReducedMotion();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedValue = controlledValue ?? uncontrolledValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      [option.label, option.group, option.subtext, ...(option.keywords ?? [])]
        .filter(Boolean)
        .some((term) => term!.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [options, query]);

  const enabledIndices = useMemo(() => {
    return filteredOptions.reduce<number[]>((indices, option, index) => {
      if (!option.disabled) indices.push(index);
      return indices;
    }, []);
  }, [filteredOptions]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;
    const option = activeOption ? optionRefs.current[activeOption.value] : null;
    const listbox = option?.parentElement;
    if (option && listbox) {
      const top = option.offsetTop;
      const bottom = top + option.offsetHeight;
      if (top < listbox.scrollTop) listbox.scrollTop = top;
      else if (bottom > listbox.scrollTop + listbox.clientHeight)
        listbox.scrollTop = bottom - listbox.clientHeight;
    }
  }, [activeIndex, filteredOptions, open]);

  // Click outside listener
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    setUncontrolledValue(option.value);
    onValueChange?.(option.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const clear = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setUncontrolledValue("");
    onValueChange?.("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      if (!enabledIndices.length) return;
      const currentPosition = enabledIndices.indexOf(activeIndex);
      const nextPosition =
        event.key === "ArrowDown"
          ? (currentPosition + 1) % enabledIndices.length
          : (currentPosition - 1 + enabledIndices.length) % enabledIndices.length;
      setActiveIndex(enabledIndices[nextPosition]!);
      return;
    }
    if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) choose(option);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
  };

  const inputValue = open ? query : selectedOption?.label ?? "";
  const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;

  return (
    <div ref={rootRef} className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={controlId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={[
          styles.control,
          open ? styles.open : "",
          disabled ? styles.disabled : "",
          controlClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Search className={styles.searchIcon} size={15} strokeWidth={2} aria-hidden="true" />
        <input
          {...inputProps}
          ref={inputRef}
          id={controlId}
          type="text"
          role="combobox"
          value={inputValue}
          placeholder={selectedOption?.label ?? placeholder}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeOption ? `${controlId}-option-${activeOption.value}` : undefined
          }
          onFocus={(event) => {
            onFocus?.(event);
            openMenu();
          }}
          onClick={openMenu}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
        />
        <AnimatePresence initial={false}>
          {selectedOption && !disabled && (
            <motion.button
              type="button"
              className={styles.clear}
              aria-label="Clear selection"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.6, filter: `blur(${motionTokens.blur.subtle}px)` }
              }
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                transition: reduceMotion
                  ? { duration: motionTokens.duration.instant }
                  : { ...motionTokens.spring.snappy, opacity: { duration: motionTokens.duration.fast } },
              }}
              exit={{
                opacity: 0,
                ...(reduceMotion ? {} : { scale: 0.6, filter: `blur(${motionTokens.blur.subtle}px)` }),
                transition: { duration: motionTokens.duration.instant },
              }}
            >
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => (open ? setOpen(false) : openMenu())}
          className="flex items-center justify-center p-1"
        >
          <ChevronDown className={styles.chevron} size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence initial={false}>
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
              ...(reduceMotion ? {} : { y: -4, scale: 0.98 }),
              transition: { duration: motionTokens.duration.instant },
            }}
            role="presentation"
          >
            <AutoHeight reduceMotion={reduceMotion}>
              <div id={listboxId} className={styles.listbox} role="listbox">
                {filteredOptions.length ? (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.value === selectedValue;
                    return (
                      <div
                        key={option.value}
                        ref={(element) => {
                          optionRefs.current[option.value] = element;
                        }}
                        id={`${controlId}-option-${option.value}`}
                        className={styles.option}
                        data-active={index === activeIndex ? "true" : undefined}
                        data-selected={isSelected ? "true" : undefined}
                        data-disabled={option.disabled ? "true" : undefined}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled || undefined}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                        onClick={() => choose(option)}
                      >
                        {option.renderItem ? (
                          option.renderItem()
                        ) : (
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                            {option.icon}
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{option.label}</span>
                                {option.badge && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#105F68]/10 text-[#105F68] font-semibold">
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              {option.subtext && (
                                <p className="text-[10px] text-slate-400 truncate">{option.subtext}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {isSelected && (
                          <Check className={styles.check} size={15} strokeWidth={2.5} aria-hidden="true" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <motion.div
                    className={styles.empty}
                    role="status"
                    initial={reduceMotion ? false : { opacity: 0, y: 4, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: motionTokens.duration.standard }}
                  >
                    {emptyMessage}
                  </motion.div>
                )}
              </div>
            </AutoHeight>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Combobox.displayName = "Combobox";
