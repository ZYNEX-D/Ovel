"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ColorBendsProps } from "@/components/ColorBends";

const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
});

export const REACT_BITS_DEFAULT_COLORS = ["#ff5c7a", "#8a5cff", "#00ffd1"];

interface LandingBackgroundProps extends Partial<ColorBendsProps> {
  palette?: "vibrant" | "brand" | "custom";
}

export default function LandingBackground({
  colors = ["#ff5c7a", "#8a5cff", "#00ffd1"],
  rotation = 90,
  speed = 0.2,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  noise = 0.08,
  parallax = 0.5,
  iterations = 1,
  intensity = 1.2,
  bandWidth = 6,
  transparent = true,
  className = "",
  style,
  ...rest
}: LandingBackgroundProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let idleId = 0;
    let timeoutId = 0;
    let cancelled = false;

    const enable = () => {
      if (!cancelled && !media.matches) setReady(true);
    };

    const schedule = () => {
      if (media.matches) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(enable, { timeout: 800 });
        return;
      }
      timeoutId = window.setTimeout(enable, 50);
    };

    const onChange = () => {
      if (media.matches) {
        setReady(false);
        return;
      }
      schedule();
    };

    schedule();
    media.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      media.removeEventListener("change", onChange);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden w-full h-full ${className}`}
      style={style}
      aria-hidden="true"
    >
      <ColorBends
        colors={colors}
        rotation={rotation}
        speed={speed}
        scale={scale}
        frequency={frequency}
        warpStrength={warpStrength}
        mouseInfluence={mouseInfluence}
        noise={noise}
        parallax={parallax}
        iterations={iterations}
        intensity={intensity}
        bandWidth={bandWidth}
        transparent={transparent}
        {...rest}
      />
    </div>
  );
}
