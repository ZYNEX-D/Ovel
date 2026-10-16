"use client";

import { useCallback, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { STORE_EVENT } from "./store-events";

function subscribe(notify: () => void) {
  window.addEventListener(STORE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(STORE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

function subscribeHydration() {
  return () => {};
}

export function useClientStore<T>(read: () => T, getServerSnapshot: () => T): T {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}

export function useDraftStore<T>(stored: T): [T, Dispatch<SetStateAction<T>>] {
  const [override, setOverride] = useState<{ base: T; value: T } | null>(null);
  const draft = override && Object.is(override.base, stored) ? override.value : stored;
  const setDraft = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setOverride((current) => {
      const baseValue = current && Object.is(current.base, stored) ? current.value : stored;
      const value = typeof action === "function" ? (action as (prev: T) => T)(baseValue) : action;
      return { base: stored, value };
    });
  }, [stored]);
  return [draft, setDraft];
}
