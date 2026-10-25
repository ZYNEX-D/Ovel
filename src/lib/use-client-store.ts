"use client";

import { useCallback, useRef, useState, useEffect, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { STORE_EVENT } from "./store-events";

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !deepEqual(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}

function subscribe(notify: () => void) {
  if (typeof window === "undefined") return () => {};
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
  const readRef = useRef(read);
  const serverRef = useRef(getServerSnapshot);

  useEffect(() => {
    readRef.current = read;
    serverRef.current = getServerSnapshot;
  });

  const clientCacheRef = useRef<{ value: T; hasValue: boolean }>({
    value: undefined as unknown as T,
    hasValue: false,
  });
  const serverCacheRef = useRef<{ value: T; hasValue: boolean }>({
    value: undefined as unknown as T,
    hasValue: false,
  });

  const getSnapshot = useCallback(() => {
    const next = readRef.current();
    if (clientCacheRef.current.hasValue && deepEqual(clientCacheRef.current.value, next)) {
      return clientCacheRef.current.value;
    }
    clientCacheRef.current = { value: next, hasValue: true };
    return next;
  }, []);

  const getStableServerSnapshot = useCallback(() => {
    const next = serverRef.current();
    if (serverCacheRef.current.hasValue && deepEqual(serverCacheRef.current.value, next)) {
      return serverCacheRef.current.value;
    }
    serverCacheRef.current = { value: next, hasValue: true };
    return next;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getStableServerSnapshot);
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
