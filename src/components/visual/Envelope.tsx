"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const PAPER = "#fdf6e3";
const PAPER_DARK = "#efe0bb";
const EDGE = "#c9b68a";

/**
 * Paper envelope. The flap is two layers (behind / in front of the letter) so it can fold closed over it.
 * `letterOut` slides the letter up; `sealed` stamps the wax seal.
 */
export function Envelope({
  closed,
  sealed,
  letterOut,
  lines,
  className,
}: {
  closed: boolean;
  sealed: boolean;
  letterOut: boolean;
  lines: string[];
  className?: string;
}) {
  const fold = { duration: 0.28, ease: "easeInOut" } as const;
  return (
    <svg viewBox="0 -90 240 250" className={cn("overflow-visible drop-shadow-2xl", className)} aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="10" fill={PAPER_DARK} stroke={EDGE} strokeWidth="2" />

      <motion.path
        d="M2 2 L120 82 L238 2 Z"
        fill={PAPER_DARK}
        stroke={EDGE}
        strokeWidth="2"
        style={{ originY: 0 }}
        initial={false}
        animate={{ scaleY: closed ? 0 : -1 }}
        transition={{ ...fold, delay: closed ? 0 : fold.duration }}
      />

      <motion.g
        initial={false}
        animate={{ y: letterOut ? -78 : 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <rect x="18" y="12" width="204" height="130" rx="6" fill="#ffffff" stroke={EDGE} strokeWidth="1.5" />
        {lines.slice(0, 4).map((l, i) => (
          <text
            key={i}
            x="30"
            y={36 + i * 22}
            fontSize="13"
            fontFamily="var(--font-jetbrains), monospace"
            fill="#4b3b8f"
          >
            {l}
          </text>
        ))}
      </motion.g>

      <path
        d="M0 30 L120 104 L240 30 L240 150 Q240 160 230 160 L10 160 Q0 160 0 150 Z"
        fill={PAPER}
        stroke={EDGE}
        strokeWidth="2"
      />

      <motion.path
        d="M2 2 L120 88 L238 2 Z"
        fill={PAPER}
        stroke={EDGE}
        strokeWidth="2"
        style={{ originY: 0 }}
        initial={false}
        animate={{ scaleY: closed ? 1 : 0 }}
        transition={{ ...fold, delay: closed ? fold.duration : 0 }}
      />

      <motion.g
        initial={false}
        animate={{ scale: sealed ? 1 : 0, rotate: sealed ? 0 : -40 }}
        transition={{ type: "spring", stiffness: 420, damping: 14 }}
      >
        <circle cx="120" cy="84" r="22" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="3" />
        <path d="M112 82 v-5 a8 8 0 0 1 16 0 v5" fill="none" stroke="#fee2e2" strokeWidth="3" strokeLinecap="round" />
        <rect x="108" y="81" width="24" height="16" rx="3" fill="#fee2e2" />
      </motion.g>
    </svg>
  );
}
