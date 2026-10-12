"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), {
  ssr: false,
});

/**
 * The particle field is decorative. Load Three.js after the browser is idle,
 * and skip it entirely when the user prefers reduced motion.
 */
export default function DeferredThreeCanvas() {
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
        idleId = window.requestIdleCallback(enable, { timeout: 1500 });
        return;
      }
      timeoutId = window.setTimeout(enable, 200);
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
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  return <ThreeCanvas />;
}
