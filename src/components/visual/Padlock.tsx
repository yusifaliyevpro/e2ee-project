"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/** Padlock whose shackle animates open/closed. Colour follows `currentColor`. */
export function Padlock({ locked, className }: { locked: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={cn("overflow-visible", className)} aria-hidden>
      <motion.path
        d="M18 32 V20 a14 14 0 0 1 28 0 V32"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        initial={false}
        animate={locked ? { y: 0, rotate: 0 } : { y: -9, rotate: 0 }}
        style={{ originX: "46px", originY: "32px" }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
      />
      <rect x="8" y="30" width="48" height="38" rx="8" fill="currentColor" />
      <circle cx="32" cy="46" r="5" className="fill-bg" />
      <rect x="29.5" y="48" width="5" height="10" rx="2.5" className="fill-bg" />
    </svg>
  );
}
