"use client";

import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PresenterState, StoredReaction } from "@/lib/room-types";

type RoomCtx = {
  state: PresenterState | null;
  error: string | null;
  refresh: () => Promise<void>;
  joinUrl: string;
  /** New encrypted reactions as they arrive; returns an unsubscribe function */
  onReactions: (listener: ReactionListener) => () => void;
};

type ReactionListener = (reactions: StoredReaction[]) => void;

const Ctx = createContext<RoomCtx | null>(null);

const noopSubscribe = () => () => {};

function useJoinUrl() {
  return useSyncExternalStore(
    noopSubscribe,
    () => process.env.NEXT_PUBLIC_JOIN_URL || `${window.location.origin}/join`,
    () => "",
  );
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PresenterState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joinUrl = useJoinUrl();
  const listeners = useRef(new Set<ReactionListener>());
  // null until the first poll: reactions sent before the deck opened are skipped
  const reactionCursor = useRef<number | null>(null);

  const onReactions = useCallback((listener: ReactionListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const cursor = reactionCursor.current;
      const res = await fetch(`/api/room/state${cursor === null ? "" : `?rx=${cursor}`}`, { cache: "no-store" });
      if (res.status === 401) {
        setError("Session expired — reload and log in again.");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const next: PresenterState = await res.json();
      const seen = reactionCursor.current;
      if (seen === null || next.reactionSeq < seen) {
        // First poll, or the counter expired: start from "now"
        reactionCursor.current = next.reactionSeq;
      } else {
        // Two overlapping polls can return the same batch; the cursor dedupes them
        const fresh = next.reactions.filter((r) => r.seq > seen);
        if (fresh.length > 0) {
          reactionCursor.current = Math.max(seen, ...fresh.map((r) => r.seq));
          for (const l of listeners.current) l(fresh);
        }
      }
      setState(next);
      setError(null);
    } catch {
      setError("Room server unreachable");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      if (alive) timer = setTimeout(loop, 1200);
    };
    void loop();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [refresh]);

  return <Ctx value={{ state, error, refresh, joinUrl, onReactions }}>{children}</Ctx>;
}

export function useRoom(): RoomCtx {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
}
