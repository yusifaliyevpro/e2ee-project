"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuArrowRight, LuKeyRound, LuRefreshCw, LuShieldCheck, LuShieldX, LuTrash2 } from "react-icons/lu";
import { PiDetectiveFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import type { TermKey } from "@/lib/vocab";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";
import { Padlock } from "../visual/Padlock";

const N = 8;
const STOLEN = 4; // index of K5
const HEAL = 6; // K7 brings fresh DH randomness

const COPY: { title: React.ReactNode; text: string; term: TermKey }[] = [
  {
    title: (
      <>
        A <Hl tone="gold">new key</Hl> for every single message.
      </>
    ),
    text: "Signal's Double Ratchet derives a fresh key for each message and deletes it right after use. Like a ratchet, it only turns one way.",
    term: "ratchet",
  },
  {
    title: (
      <>
        Stolen key? <Hl tone="good">The past stays secret.</Hl>
      </>
    ),
    text: "An attacker steals key #5. The chain can't run backwards, and old keys were deleted — so messages 1–4 remain unreadable.",
    term: "forward",
  },
  {
    title: (
      <>
        …and the future <Hl tone="good">heals itself</Hl>.
      </>
    ),
    text: "The next reply carries a fresh Diffie–Hellman key. New randomness the attacker never saw → they're locked out again.",
    term: "pcs",
  },
];

type KeyState = "fresh" | "deleted" | "stolen" | "leaked" | "safe" | "healed";

function keyState(i: number, step: number): KeyState {
  if (step === 0) return i < N - 1 ? "deleted" : "fresh";
  if (i < STOLEN) return "safe";
  if (i === STOLEN) return "stolen";
  if (i < HEAL) return "leaked";
  return step === 2 ? "healed" : "leaked";
}

export function S10Ratchet() {
  return (
    <PinnedSlide id="double-ratchet" title="Double Ratchet" steps={3}>
      {(step) => (
        <div>
          <Eyebrow index="08">The Double Ratchet</Eyebrow>
          <div className="grid grid-cols-[1.5fr_1fr] items-end gap-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease }}
              >
                <h2 className="font-display text-[3.2rem] leading-[1.05] font-bold tracking-tight">
                  {COPY[step].title}
                </h2>
                <p className="mt-4 text-[1.4rem] leading-snug text-muted">{COPY[step].text}</p>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TermCard k={COPY[step].term} delay={0.1} />
              </motion.div>
            </AnimatePresence>
          </div>

          <Chain step={step} />
        </div>
      )}
    </PinnedSlide>
  );
}

function Chain({ step }: { step: number }) {
  return (
    <div className="relative mt-10 rounded-3xl border-2 border-line bg-card/60 px-6 pt-10 pb-6">
      <div className="flex items-start gap-3">
        <div className="flex w-[6.5rem] shrink-0 flex-col items-center">
          <motion.div
            animate={{ rotate: step === 0 ? [0, 45, 90, 135, 180, 225, 270, 315, 360] : 0 }}
            transition={{ duration: 6, repeat: step === 0 ? Infinity : 0, ease: "anticipate" }}
          >
            <Gear />
          </motion.div>
          <span className="mt-1 text-[0.95rem] font-semibold text-muted">ratchet</span>
        </div>

        <div className="grid flex-1 grid-cols-8 gap-3">
          {Array.from({ length: N }, (_, i) => {
            const s = keyState(i, step);
            return (
              <div key={i} className="relative flex flex-col items-center gap-2">
                {step === 2 && i === HEAL && (
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-7 -left-3 z-10 flex items-center gap-1 rounded-full bg-good px-2 py-0.5 text-[0.8rem] font-bold whitespace-nowrap text-bg"
                  >
                    <LuRefreshCw /> new DH
                  </motion.div>
                )}
                <AnimatePresence>
                  {step >= 1 && i === STOLEN && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.4, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-[3.4rem] z-10 grid size-12 place-items-center rounded-full border-4 border-bad bg-card text-[1.6rem] text-bad"
                    >
                      <PiDetectiveFill />
                    </motion.span>
                  )}
                </AnimatePresence>
                <KeyChip i={i} s={s} step={step} />
                <MessageChip i={i} s={s} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-6 text-[1rem] text-muted">
        <Legend className="bg-good" label="unreadable to the attacker" />
        {step >= 1 && <Legend className="bg-bad" label="exposed" />}
        {step === 0 && (
          <span className="flex items-center gap-1">
            <LuTrash2 /> key deleted after use
          </span>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", className)} /> {label}
    </span>
  );
}

function KeyChip({ i, s, step }: { i: number; s: KeyState; step: number }) {
  const styles: Record<KeyState, string> = {
    fresh: "border-gold text-gold bg-gold/10",
    deleted: "border-line text-muted",
    stolen: "border-bad text-bad bg-bad/15",
    leaked: "border-bad/60 text-bad bg-bad/5",
    safe: "border-line text-muted",
    healed: "border-good text-good bg-good/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, scale: s === "stolen" ? 1.12 : 1 }}
      transition={{ delay: step === 0 ? i * 0.35 : 0, type: "spring", stiffness: 300, damping: 18 }}
      className={cn(
        "relative flex w-full items-center justify-center gap-1.5 rounded-xl border-2 py-2 font-mono text-[1.15rem] font-bold",
        styles[s],
      )}
    >
      <LuKeyRound /> K{i + 1}
      {s === "deleted" && <span className="absolute inset-x-2 top-1/2 h-0.5 -rotate-12 bg-muted/70" />}
      {i < N - 1 && <LuArrowRight className="absolute -right-[1.05rem] size-4 text-muted" />}
    </motion.div>
  );
}

function MessageChip({ i, s }: { i: number; s: KeyState }) {
  const exposed = s === "stolen" || s === "leaked";
  return (
    <motion.div
      layout
      className={cn(
        "flex w-full flex-col items-center gap-1 rounded-2xl border-2 px-1 py-3 transition-colors duration-500",
        exposed ? "border-bad bg-bad/10" : "border-good/60 bg-good/10",
      )}
    >
      {exposed ? (
        <LuShieldX className="size-7 text-bad" />
      ) : s === "healed" || s === "safe" ? (
        <LuShieldCheck className="size-7 text-good" />
      ) : (
        <Padlock locked className="w-6 text-good" />
      )}
      <span className="font-display text-[1.05rem] font-bold">msg {i + 1}</span>
    </motion.div>
  );
}

function Gear() {
  const teeth = 12;
  return (
    <svg viewBox="0 0 100 100" className="size-[5rem] text-gold">
      {Array.from({ length: teeth }, (_, i) => (
        <path
          key={i}
          d="M44 6 L56 6 L60 20 L40 20 Z"
          fill="currentColor"
          transform={`rotate(${(360 / teeth) * i} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="32" fill="currentColor" />
      <circle cx="50" cy="50" r="13" className="fill-card" />
      <path d="M50 37 L50 22" stroke="var(--card)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
