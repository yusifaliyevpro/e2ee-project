"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { LuDoorClosed, LuDoorOpen } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { useRoom } from "./RoomProvider";

/** Opens or closes /join for new phones. Phones already in the room keep working either way. */
export function JoinToggle() {
  const { state, refresh } = useRoom();
  // Optimistic value while the request is in flight
  const [pending, setPending] = useState<boolean | null>(null);
  const open = pending ?? state?.joining ?? false;

  const toggle = async () => {
    const next = !open;
    setPending(next);
    try {
      await fetch("/api/room/joining", { method: "POST", body: JSON.stringify({ open: next }) });
      await refresh();
    } finally {
      setPending(null);
    }
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== "j" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
    void toggle();
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <button
      type="button"
      onClick={(e) => {
        void toggle();
        e.currentTarget.blur();
      }}
      disabled={!state}
      title={open ? "New phones can join — click to close (J)" : "Joining is closed — click to open (J)"}
      aria-pressed={open}
      className={cn(
        "flex h-10 items-center gap-2 rounded-xl border px-3 text-[0.85rem] font-semibold backdrop-blur transition-colors disabled:opacity-50",
        open ? "border-good/60 bg-good/15 text-good" : "border-line bg-card/70 text-muted hover:text-fg",
      )}
    >
      {open ? <LuDoorOpen className="text-[1.1rem]" /> : <LuDoorClosed className="text-[1.1rem]" />}
      {open ? "Joining open" : "Joining closed"}
    </button>
  );
}
