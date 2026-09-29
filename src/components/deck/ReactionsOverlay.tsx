"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { openReaction } from "@/lib/e2ee";
import { type Reaction, parseBatch } from "@/lib/reactions";
import { useRoom } from "./RoomProvider";
import { usePresenterIdentity } from "./usePresenterIdentity";

type Floater = {
  id: number;
  emoji: Reaction;
  x: number;
  rise: number;
  drift: number;
  tilt: number;
  size: number;
  duration: number;
};

const MAX_FLOATERS = 70;

/** Live-stream style reactions, decrypted in this browser with the presenter's reply key. */
export function ReactionsOverlay() {
  const { onReactions } = useRoom();
  const identity = usePresenterIdentity();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const mutedRef = useRef(false);
  const nextId = useRef(0);

  const spawn = useCallback((emoji: Reaction) => {
    if (mutedRef.current) return;
    setFloaters((f) =>
      f.length >= MAX_FLOATERS
        ? f
        : [
            ...f,
            {
              id: nextId.current++,
              emoji,
              x: Math.random() * 75,
              rise: window.innerHeight * (0.45 + Math.random() * 0.2),
              drift: (Math.random() - 0.5) * 90,
              tilt: (Math.random() - 0.5) * 36,
              size: 2.4 + Math.random() * 1.3,
              duration: 2.8 + Math.random() * 1.4,
            },
          ],
    );
  }, []);

  useEffect(() => {
    if (!identity) return undefined;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const off = onReactions((batch) => {
      const emojis = batch.flatMap((r) => {
        const text = openReaction(r, identity);
        return text ? parseBatch(text).flatMap(([emoji, n]) => Array<Reaction>(n).fill(emoji)) : [];
      });
      // Spread each poll's batch over ~1s so it streams instead of popping all at once
      emojis.forEach((emoji, i) => {
        const t = setTimeout(
          () => {
            timers.delete(t);
            spawn(emoji);
          },
          (i / emojis.length) * 1100 + Math.random() * 120,
        );
        timers.add(t);
      });
    });
    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [identity, onReactions, spawn]);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      mutedRef.current = !mutedRef.current;
      if (mutedRef.current) setFloaters([]);
      setToast(mutedRef.current ? "Reactions hidden (R)" : "Reactions on (R)");
      clearTimeout(hide);
      hide = setTimeout(() => setToast(null), 1600);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hide);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed right-[3.5rem] bottom-[3rem] z-40 h-[70vh] w-[11rem]">
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            className="absolute bottom-0 leading-none drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)] select-none"
            style={{ left: `${f.x}%`, fontSize: `${f.size}rem` }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.3, rotate: 0 }}
            animate={{
              y: -f.rise,
              x: [0, f.drift, -f.drift * 0.4, f.drift * 0.7],
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.25, 1, 0.9],
              rotate: [0, f.tilt, -f.tilt * 0.5, f.tilt],
            }}
            transition={{
              y: { duration: f.duration, ease: [0.2, 0.6, 0.35, 1] },
              x: { duration: f.duration, ease: "easeInOut" },
              rotate: { duration: f.duration, ease: "easeInOut" },
              opacity: { duration: f.duration, times: [0, 0.08, 0.7, 1] },
              scale: { duration: f.duration, times: [0, 0.1, 0.25, 1] },
            }}
            onAnimationComplete={() => setFloaters((all) => all.filter((x) => x.id !== f.id))}
          >
            {f.emoji}
          </motion.span>
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none fixed right-6 bottom-14 z-50 rounded-xl border border-line bg-card px-3 py-1.5 font-mono text-[0.85rem] text-muted shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
