"use client";

import { type HTMLMotionProps, motion } from "motion/react";
import type { ReactNode } from "react";
import { LuBookOpen, LuVolume2 } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { TERMS, type TermKey } from "@/lib/vocab";

export const ease = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  delay = 0,
  y = 28,
  className,
  children,
  ...rest
}: { delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <Reveal
      y={12}
      className="mb-5 flex items-center gap-4 font-mono text-[1rem] font-semibold tracking-[0.2em] text-accent uppercase"
    >
      <span className="rounded-md border-2 border-accent/60 px-2 py-0.5">{index}</span>
      <span className="h-0.5 w-12 bg-accent/50" />
      <span>{children}</span>
    </Reveal>
  );
}

export function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal delay={0.05}>
      <h2 className={cn("font-display text-[3.3rem] leading-[1.05] font-bold tracking-tight text-balance", className)}>
        {children}
      </h2>
    </Reveal>
  );
}

export function Lead({
  children,
  className,
  delay = 0.15,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <p className={cn("mt-5 max-w-[60rem] text-[1.5rem] leading-snug text-balance text-muted", className)}>
        {children}
      </p>
    </Reveal>
  );
}

/** Highlight for words in running text */
export function Hl({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "good" | "bad" | "warn" | "iris" | "gold" | "fg";
}) {
  const tones = {
    fg: "text-fg",
    accent: "text-accent",
    good: "text-good",
    bad: "text-bad",
    warn: "text-warn",
    iris: "text-iris",
    gold: "text-gold",
  } as const;
  return <span className={cn("font-semibold", tones[tone])}>{children}</span>;
}

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/** Vocabulary card — the Technical English part of every slide. */
export function TermCard({
  k,
  delay = 0.3,
  className,
  compact,
}: {
  k: TermKey;
  delay?: number;
  className?: string;
  compact?: boolean;
}) {
  const t = TERMS[k];
  return (
    <Reveal delay={delay} className={cn("h-full", className)}>
      <div className="relative h-full overflow-hidden rounded-2xl border-2 border-warn/70 bg-warn/[0.08] p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-warn px-2 py-0.5 font-mono text-[0.8rem] font-bold tracking-widest text-bg uppercase">
            <LuBookOpen className="size-[1em]" /> New term
          </span>
          <button
            type="button"
            onClick={() => speak(t.term)}
            className="rounded-full p-1.5 text-warn transition-colors hover:bg-warn/15"
            aria-label={`Pronounce ${t.term}`}
          >
            <LuVolume2 className="size-[1.2rem]" />
          </button>
        </div>
        <div className={cn("mt-3 font-display leading-tight font-bold", compact ? "text-[1.45rem]" : "text-[1.75rem]")}>
          {t.term}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[1.05rem] text-muted">
          <span className="font-ipa">{t.ipa}</span>
          <span className="italic">{t.pos}</span>
        </div>
        <p className={cn("mt-2 leading-snug", compact ? "text-[1.05rem]" : "text-[1.15rem]")}>{t.definition}</p>
        {!compact && t.note && <p className="mt-2 text-[0.95rem] leading-snug font-medium text-warn">{t.note}</p>}
      </div>
    </Reveal>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border-2 border-line bg-card/70 p-5", className)}>{children}</div>;
}
