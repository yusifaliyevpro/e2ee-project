"use client";

import { useSyncExternalStore } from "react";

/** A tiny localStorage-backed value that is safe to read during hydration. */
export function createLocalStore<T>(key: string, fallback: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const get = (): T => {
    if (cache === undefined) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) cache = fallback;
        else {
          const parsed: T = JSON.parse(raw);
          cache = parsed;
        }
      } catch {
        cache = fallback;
      }
    }
    return cache;
  };

  return {
    get,
    set: (update: (prev: T) => T) => {
      cache = update(get());
      try {
        localStorage.setItem(key, JSON.stringify(cache));
      } catch {}
      for (const l of listeners) l();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    fallback,
  };
}

export function useLocalStore<T>(store: ReturnType<typeof createLocalStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}
