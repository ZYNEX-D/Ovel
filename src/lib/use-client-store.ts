"use client";

import { useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
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
  const [draft, setDraft] = useState(stored);
  const [seen, setSeen] = useState(stored);
  if (!Object.is(stored, seen)) {
    setSeen(stored);
    setDraft(stored);
  }
  return [draft, setDraft];
}
