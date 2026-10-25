"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, animate, cancelFrame, frame, motion, motionValue, useInView, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue, type Variants } from "motion/react";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import styles from "./usage-meter.module.css";

export interface UsageMeterSegment {
  id: string;
  label: string;
  value: number;
}

export interface UsageMeterProps {
  label: string;
  segments: UsageMeterSegment[];
  limit: number;
  unit?: string;
  decimals?: number;
  freeLabel?: string;
  overLabel?: string;
  warnAt?: number;
}

const { spring, duration, ease, blur } = motionTokens;
const physical = ({ visualDuration, bounce }: { visualDuration: number; bounce: number }, restDelta = 0.001) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { type: "spring" as const, stiffness: root * root, damping: 2 * (1 - bounce) * root, restDelta, restSpeed: restDelta * 2 };
};
const settle = physical(spring.smooth);
const reveal = physical({ visualDuration: duration.considered + 0.1, bounce: 0 });
const turn = physical(spring.smooth);
const fit = physical(spring.morph, 0.01);
const GAP = 2;
const subscribeNothing = () => () => {};

function useReducedMotionSafe() {
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  return { reduced: !!useReducedMotion() && hydrated, hydrated };
}

function soon(start: () => { stop: () => void }) {
  let controls: { stop: () => void } | null = null;
  const run = () => { controls = start(); };
  frame.update(run);
  return () => { cancelFrame(run); controls?.stop(); };
}

const rise: Variants = {
  hidden: (direction: number) => ({ opacity: 0, y: `${0.3 * direction}em`, scale: 1, filter: `blur(${blur.soft}px)` }),
  shown: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: duration.standard, ease: [...ease.enter] } },
  gone: (direction: number) => ({ opacity: 0, y: `${-0.3 * direction}em`, scale: 1, filter: `blur(${blur.subtle}px)`, transition: { duration: duration.instant, ease: [...ease.standard] } }),
};
const pop: Variants = {
  hidden: { opacity: 0, y: 0, scale: 0.6, filter: `blur(${blur.subtle + 1}px)` },
  shown: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { ...spring.snappy, opacity: { duration: duration.fast, ease: [...ease.enter] }, filter: { duration: duration.fast, ease: [...ease.enter] } } },
  gone: { opacity: 0, y: 0, scale: 0.6, filter: `blur(${blur.subtle + 1}px)`, transition: { duration: duration.instant, ease: [...ease.standard] } },
};
const fade: Variants = { hidden: { opacity: 0, y: 0, scale: 1, filter: "blur(0px)" }, shown: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: duration.fast } }, gone: { opacity: 0, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: duration.instant } } };

function Swap({ text, reduced, direction = 1 }: { text: string; reduced: boolean; direction?: number }) {
  return (
    <span className={styles.swap}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span key={text} className={styles.swapText} custom={direction} variants={reduced ? fade : rise} initial="hidden" animate="shown" exit="gone">
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type Part = { key: string; digit: number } | { key: string; text: string };
const formats = new Map<number, Intl.NumberFormat>();

function partsFor(value: number, decimals: number): Part[] {
  let format = formats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formats.set(decimals, format);
  }
  const parts = format.formatToParts(value);
  let place = parts.reduce((count, part) => count + (part.type === "integer" ? part.value.length : 0), 0);
  let fraction = 0;
  return parts.flatMap((part, index): Part[] => {
    if (part.type === "integer") return [...part.value].map(char => ({ key: `i${--place}`, digit: Number(char) }));
    if (part.type === "fraction") return [...part.value].map(char => ({ key: `f${fraction++}`, digit: Number(char) }));
    return [{ key: part.type === "group" ? `g${place}` : part.type === "decimal" ? "d" : `${part.type}${index}`, text: part.value }];
  });
}
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Glyph({ position, digit }: { position: MotionValue<number>; digit: number }) {
  const offset = useTransform(position, current => ((((digit - current) % 10) + 15) % 10) - 5);
  const y = useTransform(offset, current => `${current}em`);
  const opacity = useTransform(offset, current => Math.max(0, 1 - Math.abs(current)));
  const filter = useTransform(offset, current => Math.abs(current) < 0.02 || Math.abs(current) >= 1 ? "none" : `blur(${(Math.abs(current) * blur.subtle).toFixed(2)}px)`);
  return <motion.span className={styles.glyph} style={{ y, opacity, filter }}>{digit}</motion.span>;
}

const column = { initial: { width: 0, opacity: 0 }, animate: { width: "auto", opacity: 1 }, exit: { width: 0, opacity: 0 } };

function Column({ digit, direction, reduced }: { digit: number; direction: number; reduced: boolean }) {
  const position = useMotionValue(digit);
  const wheel = useRef({ digit, target: digit });
  const running = useRef<(() => void) | null>(null);
  useEffect(() => () => running.current?.(), []);
  useEffect(() => {
    const state = wheel.current;
    if (state.digit === digit) return;
    state.target += direction < 0 ? -((state.digit - digit + 10) % 10) : (digit - state.digit + 10) % 10;
    state.digit = digit;
    running.current?.();
    if (reduced) { position.jump(state.target); running.current = null; return; }
    const target = state.target;
    running.current = soon(() => animate(position, target, turn));
  }, [digit, direction, position, reduced]);
  return (
    <motion.span className={styles.column} {...column} transition={reduced ? { duration: 0 } : fit}>
      <span className={styles.sizer}>0</span>
      {DIGITS.map(item => <Glyph key={item} position={position} digit={item} />)}
    </motion.span>
  );
}

function Ticker({ value, decimals, reduced }: { value: number; decimals: number; reduced: boolean }) {
  const [trend, setTrend] = useState({ value, direction: 1 });
  if (trend.value !== value) setTrend({ value, direction: value > trend.value ? 1 : -1 });
  return (
    <span className={styles.ticker} aria-hidden="true">
      <AnimatePresence initial={false}>
        {partsFor(value, decimals).map(part => "digit" in part
          ? <Column key={part.key} digit={part.digit} direction={trend.direction} reduced={reduced} />
          : <motion.span key={part.key} className={styles.symbol} {...column} transition={reduced ? { duration: 0 } : fit}>{part.text}</motion.span>)}
      </AnimatePresence>
    </span>
  );
}

type Status = "ok" | "near" | "over";

function StatusBadge({ status, text, reduced }: { status: Status; text: string; reduced: boolean }) {
  const inner = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | "auto">("auto");
  useLayoutEffect(() => {
    const node = inner.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    let measured = false;
    const observer = new ResizeObserver(() => {
      const next = node.offsetWidth;
      if (measured && !reduced) animate(width, next, fit);
      else width.jump(next);
      measured = next > 0;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, width]);
  const Icon = status === "over" ? TriangleAlert : CircleAlert;
  return (
    <motion.span className={styles.badge} data-status={status} style={{ width }}>
      <span ref={inner} className={styles.badgeInner}>
        <AnimatePresence mode="popLayout" initial={false}>
          {status !== "ok" && (
            <motion.span key={status} className={styles.badgeIcon} variants={reduced ? fade : pop} initial="hidden" animate="shown" exit="gone">
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
        <Swap text={text} reduced={reduced} />
      </span>
    </motion.span>
  );
}

function Segment({ index, amounts, span, width, highlight }: { index: number; amounts: MotionValue<number>[]; span: MotionValue<number>; width: MotionValue<number>; highlight: "on" | "off" | undefined }) {
  const x = useTransform(() => {
    let start = 0;
    for (let at = 0; at < index; at++) start += amounts[at]!.get();
    return (start / span.get()) * width.get();
  });
  const scaleX = useTransform(() => {
    const w = width.get();
    if (!w) return 0;
    const size = (amounts[index]!.get() / span.get()) * w;
    const rest = w - x.get() - size;
    return Math.max(0, size - Math.min(GAP, size, Math.max(0, rest))) / w;
  });
  return <motion.span className={styles.segment} data-index={index} data-highlight={highlight} style={{ x, scaleX, originX: 0 }} />;
}

export function UsageMeter({ label, segments, limit, unit = "", decimals = 1, freeLabel = "Free", overLabel = "Over limit", warnAt = 0.9 }: UsageMeterProps) {
  const { reduced, hydrated } = useReducedMotionSafe();
  const root = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { once: true, amount: 0.4 });
  const titleId = useId();
  const hatchId = `hatch${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ready = hydrated && (inView || reduced);
  const round = (value: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;
  const total = round(segments.reduce((sum, segment) => sum + segment.value, 0));
  const free = round(Math.max(0, limit - total));
  const over = round(Math.max(0, total - limit));
  const status: Status = total > limit ? "over" : total >= limit * warnAt ? "near" : "ok";
  const format = (value: number) => `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
  const limitText = format(limit).replace(/\.0+(?= |$)/, "");

  const [store] = useState(() => new Map<string, MotionValue<number>>());
  const amounts = segments.map(segment => {
    let value = store.get(segment.id);
    if (!value) {
      value = motionValue(0);
      store.set(segment.id, value);
    }
    return value;
  });
  const shownLimit = useMotionValue(limit);
  const width = useMotionValue(0);
  const used = useTransform(() => amounts.reduce((sum, amount) => sum + amount.get(), 0));
  const span = useTransform(() => Math.max(shownLimit.get(), used.get(), 1e-6));
  const limitX = useTransform(() => Math.round((shownLimit.get() / span.get()) * width.get()));
  const markerOpacity = useMotionValue(0);

  useEffect(() => {
    let isOver = used.get() > shownLimit.get();
    markerOpacity.jump(isOver ? 1 : 0);
    let fading: AnimationPlaybackControls | undefined;
    const check = () => {
      const next = used.get() > shownLimit.get();
      if (next === isOver) return;
      isOver = next;
      fading?.stop();
      if (reduced) markerOpacity.jump(next ? 1 : 0);
      else fading = animate(markerOpacity, next ? 1 : 0, { duration: duration.fast, ease: [...ease.standard] });
    };
    const stops = [used.on("change", check), shownLimit.on("change", check)];
    return () => { stops.forEach(stop => stop()); fading?.stop(); };
  }, [markerOpacity, reduced, shownLimit, used]);

  const overClip = useTransform(() => `inset(0 0 0 ${limitX.get() + GAP}px)`);

  useLayoutEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    width.set(node.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => width.set(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);

  const values = segments.map(segment => `${segment.id}:${segment.value}`).join("|");
  const revealed = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const first = !revealed.current;
    revealed.current = true;
    const stops = segments.map((segment, index) => {
      const amount = store.get(segment.id);
      if (!amount || amount.get() === segment.value) return null;
      if (reduced) { amount.jump(segment.value); return null; }
      return soon(() => animate(amount, segment.value, first ? { ...reveal, delay: index * 0.07 } : settle));
    });
    return () => stops.forEach(stop => stop?.());
  }, [values, ready, reduced, store]);

  useEffect(() => {
    if (shownLimit.get() === limit) return;
    if (reduced) { shownLimit.jump(limit); return; }
    return soon(() => animate(shownLimit, limit, settle));
  }, [limit, reduced, shownLimit]);

  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [roving, setRoving] = useState(0);
  const items = [...segments.map(segment => ({ id: segment.id, label: segment.label, value: segment.value })), { id: "free", label: status === "over" ? overLabel : freeLabel, value: status === "over" ? over : free }];
  const active = hovered ?? focused ?? pinned;
  const activeItem = items.find(item => item.id === active) ?? null;
  const legend = useRef<HTMLDivElement>(null);

  const idAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect?.width) return null;
    const at = ((clientX - rect.left) / rect.width) * Math.max(limit, total);
    if (at > limit) return "free";
    let end = 0;
    for (const segment of segments) { end += segment.value; if (at <= end) return segment.id; }
    return "free";
  };
  const onTrackMove = (event: PointerEvent<HTMLDivElement>) => { if (event.pointerType === "mouse") setHovered(idAt(event.clientX)); };
  const onTrackTap = (event: PointerEvent<HTMLDivElement>) => { if (event.pointerType !== "mouse") { const id = idAt(event.clientX); setPinned(current => current === id ? null : id); } };
  const onLegendKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { if (pinned || focused) { event.preventDefault(); setPinned(null); } return; }
    const next = ({ ArrowRight: roving + 1, ArrowDown: roving + 1, ArrowLeft: roving - 1, ArrowUp: roving - 1, Home: 0, End: items.length - 1 } as Record<string, number>)[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = (next + items.length) % items.length;
    setRoving(index);
    legend.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
  };

  const headline = ready ? (activeItem ? activeItem.value : total) : 0;
  const share = activeItem ? Math.round((activeItem.value / limit) * 100) : 0;
  const caption = !activeItem ? `${unit} of ${limitText} used` : activeItem.id === "free" ? `${unit} ${status === "over" ? "over the limit" : "free"}` : `${unit} in ${activeItem.label} · ${share}% of plan`;
  const badge = status === "over" ? `${format(over)} over` : status === "near" ? "Almost full" : `${format(free)} free`;
  const summary = `${label}: ${format(total)} of ${limitText} used. ${segments.map(segment => `${segment.label} ${format(segment.value)}`).join(", ")}. ${status === "over" ? `Over the limit by ${format(over)}.` : `${format(free)} free${status === "near" ? ", almost full" : ""}.`}`;
  const notice = status === "over" ? `over:${over}` : status;
  const [announced, setAnnounced] = useState({ notice, message: "" });
  if (announced.notice !== notice) setAnnounced({ notice, message: status === "over" ? `Over the plan limit by ${format(over)}.` : status === "near" ? `Almost full. ${format(free)} free.` : `Under the limit. ${format(free)} free.` });

  return (
    <div ref={root} className={styles.meter} role="group" aria-labelledby={titleId} data-status={status}>
      <div className={styles.top}>
        <span id={titleId} className={styles.title}>{label}</span>
        <StatusBadge status={status} text={badge} reduced={reduced} />
      </div>
      <p className={styles.total}>
        <span className={styles.srOnly}>{format(total)} of {limitText} used</span>
        <span className={styles.amount} aria-hidden="true"><Ticker value={headline} decimals={decimals} reduced={reduced} /></span>
        <span className={styles.caption} aria-hidden="true"><Swap text={caption} reduced={reduced} /></span>
      </p>
      <div className={styles.bar}>
        <div ref={trackRef} className={styles.track} role="img" aria-label={summary} data-active={active ?? undefined} onPointerMove={onTrackMove} onPointerLeave={() => setHovered(null)} onPointerUp={onTrackTap}>
          {segments.map((segment, index) => <Segment key={segment.id} index={index} amounts={amounts} span={span} width={width} highlight={active ? active === segment.id ? "on" : "off" : undefined} />)}
          <motion.svg className={styles.overflow} data-highlight={active ? active === "free" ? "on" : "off" : undefined} style={{ clipPath: overClip, opacity: markerOpacity }} aria-hidden="true" focusable="false">
            <defs><pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width={2.5} height={6} className={styles.hatch} /></pattern></defs>
            <rect className={styles.overTint} width="100%" height="100%" />
            <rect width="100%" height="100%" fill={`url(#${hatchId})`} />
          </motion.svg>
        </div>
        <motion.span className={styles.limit} style={{ x: limitX, opacity: markerOpacity }} aria-hidden="true" />
      </div>
      <div ref={legend} className={styles.legend} role="group" aria-label={`${label} by category`} onKeyDown={onLegendKey}>
        {items.map((item, index) => {
          const warning = item.id === "free" && status === "over";
          return (
            <button key={item.id} type="button" className={styles.item} data-highlight={active ? active === item.id ? "on" : "off" : undefined} aria-pressed={pinned === item.id} aria-label={`${item.label}, ${format(item.value)}`} tabIndex={index === roving ? 0 : -1}
              onClick={() => { setRoving(index); setPinned(current => current === item.id ? null : item.id); }}
              onFocus={() => { setRoving(index); setFocused(item.id); }} onBlur={() => setFocused(null)}
              onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(item.id); }} onPointerLeave={event => { if (event.pointerType === "mouse") setHovered(null); }}>
              <span className={styles.itemHead}>
                <span className={styles.key} aria-hidden="true">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {warning
                      ? <motion.span key="alert" className={styles.keyIcon} variants={reduced ? fade : pop} initial="hidden" animate="shown" exit="gone"><TriangleAlert size={12} strokeWidth={2} /></motion.span>
                      : <motion.span key="swatch" className={styles.swatch} data-index={item.id === "free" ? "free" : index} variants={reduced ? fade : pop} initial="hidden" animate="shown" exit="gone" />}
                  </AnimatePresence>
                </span>
                <span className={styles.itemLabel}><Swap text={item.label} reduced={reduced} /></span>
              </span>
              <span className={styles.itemValue}><Ticker value={item.value} decimals={decimals} reduced={reduced} />{unit && <span className={styles.itemUnit}>{unit}</span>}</span>
            </button>
          );
        })}
      </div>
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announced.message}</p>
    </div>
  );
}

export default UsageMeter;
