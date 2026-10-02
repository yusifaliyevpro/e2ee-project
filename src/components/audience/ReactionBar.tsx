"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fromB64 } from "@/lib/bytes";
import { sealReaction } from "@/lib/e2ee";
import { MAX_PER_EMOJI, REACTIONS, type Reaction, type ReactionBatch } from "@/lib/reactions";

// Taps are collected and sent as one encrypted batch, keeping requests (and Redis commands) low
const FLUSH_MS = 900;

type Burst = { id: number; emoji: Reaction; x: number; drift: number };

function makeBurst(id: number, emoji: Reaction, x: number): Burst {
  return { id, emoji, x, drift: (Math.random() - 0.5) * 60 };
}

export function ReactionBar({ deviceId, replyKey }: { deviceId: string; replyKey: string }) {
  const pending = useRef<ReactionBatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);

  const flush = useCallback(async () => {
    timer.current = null;
    const batch = pending.current;
    pending.current = {};
    if (Object.keys(batch).length === 0) return;
    try {
      const res = await fetch("/api/room/react", {
        method: "POST",
        body: JSON.stringify({ id: deviceId, ...sealReaction(JSON.stringify(batch), fromB64(replyKey), deviceId) }),
      });
      if (res.status === 429) {
        // Too fast: fold the batch back in and try again shortly
        for (const emoji of REACTIONS) {
          const n = batch[emoji];
          if (n) pending.current[emoji] = Math.min(MAX_PER_EMOJI, (pending.current[emoji] ?? 0) + n);
        }
        timer.current ??= setTimeout(() => void flush(), FLUSH_MS);
      }
    } catch {}
  }, [deviceId, replyKey]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const tap = (emoji: Reaction, button: HTMLElement) => {
    pending.current[emoji] = Math.min(MAX_PER_EMOJI, (pending.current[emoji] ?? 0) + 1);
    timer.current ??= setTimeout(() => void flush(), FLUSH_MS);

    const rect = button.getBoundingClientRect();
    const burst = makeBurst(nextId.current++, emoji, rect.left + rect.width / 2);
    setBursts((b) => [...b.slice(-24), burst]);
    try {
      navigator.vibrate?.(8);
    } catch {}
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="rounded-2xl border border-line bg-card/95 p-1.5 shadow-xl backdrop-blur"
        >
          <div className="pt-0.5 pb-1 text-center text-[0.7rem] font-semibold tracking-widest text-muted uppercase">
            Tap to react · Yusif sees it live
          </div>
          <div className="flex justify-between">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={(e) => tap(r, e.currentTarget)}
                aria-label={`React ${r}`}
                className="grid size-12 place-items-center rounded-xl text-[1.75rem] transition-transform select-none active:scale-90 active:bg-accent/10"
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            className="absolute bottom-[calc(7.5rem+env(safe-area-inset-bottom))] -translate-x-1/2 text-[2rem] leading-none"
            style={{ left: b.x }}
            initial={{ y: 0, opacity: 1, scale: 0.6 }}
            animate={{ y: -220, x: b.drift, opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            onAnimationComplete={() => setBursts((all) => all.filter((x) => x.id !== b.id))}
          >
            {b.emoji}
          </motion.span>
        ))}
      </div>
    </>
  );
}
