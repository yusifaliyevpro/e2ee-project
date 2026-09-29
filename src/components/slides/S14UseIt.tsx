"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  LuCheck,
  LuCloudCog,
  LuFingerprint,
  LuMail,
  LuMessageCircle,
  LuRefreshCw,
  LuShieldCheck,
  LuTimer,
} from "react-icons/lu";
import { cn } from "@/lib/cn";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";
import { AppIcon, BRANDS, type BrandKey } from "../visual/Brands";

type App = { brand: BrandKey; what: string; badges: string[]; star?: boolean };

const APPS: App[] = [
  {
    brand: "signal",
    what: "Chats & calls. Non-profit, open source, keeps almost no metadata.",
    badges: ["E2EE by default", "Open source"],
    star: true,
  },
  {
    brand: "whatsapp",
    what: "E2EE by default with the Signal Protocol — but Meta still collects metadata.",
    badges: ["E2EE by default"],
  },
  {
    brand: "imessage",
    what: "E2EE between Apple devices. Turn on Advanced Data Protection for backups.",
    badges: ["E2EE by default"],
  },
  {
    brand: "protonmail",
    what: "Encrypted email from Switzerland. Zero-access storage, E2EE between Proton users.",
    badges: ["Zero-access", "Open source"],
    star: true,
  },
  {
    brand: "protondrive",
    what: "Cloud storage for files and photos — encrypted before it leaves your device.",
    badges: ["E2EE files", "Open source"],
  },
  {
    brand: "protoncalendar",
    what: "Your schedule, end-to-end encrypted. Same Proton account.",
    badges: ["E2EE events"],
  },
  {
    brand: "tuta",
    what: "Encrypted email & calendar from Germany, with post-quantum encryption.",
    badges: ["Post-quantum", "Open source"],
  },
  {
    brand: "element",
    what: "Decentralised team chat on the open Matrix protocol.",
    badges: ["E2EE by default", "Open source"],
  },
];

type Todo = { Icon: IconType; text: React.ReactNode };

const TODOS: Todo[] = [
  {
    Icon: LuMessageCircle,
    text: (
      <>
        Install <b>Signal</b> and invite three friends.
      </>
    ),
  },
  {
    Icon: LuCloudCog,
    text: (
      <>
        WhatsApp → Chats → Chat backup → <b>End-to-end encrypted backup</b>.
      </>
    ),
  },
  {
    Icon: LuShieldCheck,
    text: (
      <>
        iPhone: turn on <b>Advanced Data Protection</b> for iCloud.
      </>
    ),
  },
  {
    Icon: LuFingerprint,
    text: (
      <>
        Verify <b>safety numbers</b> with the people who matter most.
      </>
    ),
  },
  {
    Icon: LuMail,
    text: (
      <>
        Move sensitive email and files to <b>Proton Mail / Proton Drive</b>.
      </>
    ),
  },
  {
    Icon: LuTimer,
    text: (
      <>
        Use <b>disappearing messages</b> for sensitive chats.
      </>
    ),
  },
  {
    Icon: LuRefreshCw,
    text: (
      <>
        Keep your phone <b>updated</b> — your endpoint is the weakest link.
      </>
    ),
  },
];

export function S14UseIt() {
  return (
    <PinnedSlide id="use-it" title="Why you should use E2EE" steps={2}>
      {(step) => (
        <AnimatePresence mode="wait">{step === 0 ? <Apps key="apps" /> : <Checklist key="todo" />}</AnimatePresence>
      )}
    </PinnedSlide>
  );
}

function Apps() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="grid grid-cols-[1fr_24rem] items-end gap-10">
        <div>
          <Eyebrow index="12">Use it</Eyebrow>
          <h2 className="font-display text-[3.2rem] leading-[1.05] font-bold tracking-tight">
            Privacy is a <Hl>default</Hl> you can switch on today.
          </h2>
        </div>
        <TermCard k="zeroaccess" delay={0.1} compact />
      </div>
      <div className="mt-8 grid grid-cols-4 gap-4">
        {APPS.map((a, i) => (
          <motion.div
            key={a.brand}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease }}
            className={cn(
              "relative flex flex-col rounded-3xl border-2 bg-card/80 p-5",
              a.star ? "border-accent" : "border-line",
            )}
          >
            {a.star && (
              <span className="absolute -top-3 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[0.8rem] font-bold text-bg">
                ★ top pick
              </span>
            )}
            <div className="flex items-center gap-3">
              <AppIcon brand={a.brand} className="size-14" />
              <span className="font-display text-[1.45rem] leading-tight font-bold">{BRANDS[a.brand].name}</span>
            </div>
            <p className="mt-3 flex-1 text-[1.05rem] leading-snug text-muted">{a.what}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-md border border-good/50 bg-good/10 px-2 py-0.5 text-[0.8rem] font-bold text-good"
                >
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function Checklist() {
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease }}
      className="grid grid-cols-[0.8fr_1.2fr] items-center gap-12"
    >
      <div>
        <Eyebrow index="12">Action plan</Eyebrow>
        <h2 className="font-display text-[3.4rem] leading-[1.02] font-bold tracking-tight">
          Your <Hl>5-minute</Hl> security upgrade.
        </h2>
        <p className="mt-5 text-[1.45rem] leading-snug text-muted">
          Encryption only protects you if you actually use it. Start with the people you talk to most.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-line bg-card/70 p-5">
          <div className="font-mono text-[0.9rem] tracking-widest text-muted uppercase">Progress</div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full bg-good" animate={{ width: `${(done.length / TODOS.length) * 100}%` }} />
          </div>
          <div className="mt-2 font-display text-[1.4rem] font-bold">
            {done.length} / {TODOS.length} done {done.length === TODOS.length && "🎉"}
          </div>
        </div>
      </div>
      <ul className="space-y-3">
        {TODOS.map((t, i) => {
          const isDone = done.includes(i);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.45, ease }}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-3.5 text-left text-[1.3rem] transition-colors",
                  isDone ? "border-good bg-good/10" : "border-line bg-card/70 hover:border-accent",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg border-2 text-[1.2rem] transition-colors",
                    isDone ? "border-good bg-good text-bg" : "border-line text-muted",
                  )}
                >
                  {isDone ? <LuCheck /> : <t.Icon />}
                </span>
                <span className={cn(isDone && "text-muted line-through decoration-2")}>{t.text}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
