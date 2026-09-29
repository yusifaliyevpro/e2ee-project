"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuDoorClosed } from "react-icons/lu";
import { useRoom } from "./RoomProvider";

/** Covers a QR code while joining is closed, so the presenter notices before asking people to scan. */
export function ClosedOverlay() {
  const { state } = useRoom();
  const closed = state !== null && !state.joining;
  return (
    <AnimatePresence>
      {closed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[inherit] bg-white/90 text-center text-[#0b1220]"
        >
          <LuDoorClosed className="text-[2em]" />
          <span className="text-[0.9em] leading-tight font-bold">Joining closed</span>
          <span className="font-mono text-[0.7em] text-[#334058]">press J to open</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
