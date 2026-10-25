export const STORE_EVENT = "ovel:store";

export function emitStoreChange(key?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORE_EVENT));
}
