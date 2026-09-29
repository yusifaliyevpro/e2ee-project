"use client";

import { useSyncExternalStore } from "react";
import { type PresenterIdentity, loadPresenterIdentity, safetyNumber } from "@/lib/e2ee";

type Identity = PresenterIdentity & { safety: string[] };

let cached: Identity | null = null;

function get(): Identity {
  if (!cached) {
    const id = loadPresenterIdentity();
    cached = { ...id, safety: safetyNumber(id.publicKey) };
  }
  return cached;
}

const noop = () => () => {};

/** The presenter's long-term signing identity (lives in this browser's localStorage). */
export function usePresenterIdentity(): Identity | null {
  return useSyncExternalStore(noop, get, () => null);
}
