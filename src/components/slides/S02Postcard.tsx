"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { LuEye, LuRadioTower, LuServer, LuSmartphone, LuWifi } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal, TermCard } from "../deck/ui";

type Hop = { label: string; sub: string; Icon: IconType; endpoint?: boolean };

const HOPS: Hop[] = [
  { label: "You", sub: "your phone", Icon: LuSmartphone, endpoint: true },
  { label: "Café Wi-Fi", sub: "router owner", Icon: LuWifi },
  { label: "Mobile / ISP", sub: "internet provider", Icon: LuRadioTower },
  { label: "App server", sub: "company + staff", Icon: LuServer },
  { label: "Friend", sub: "their phone", Icon: LuSmartphone, endpoint: true },
];

export function S02Postcard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [tick, setTick] = useState(0);
  const [answer, setAnswer] = useState(false);

  useEffect(() => {
    if (!inView) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, [inView]);

  const hop = tick % (HOPS.length + 2);
  const cycle = Math.floor(tick / (HOPS.length + 2));
  const pos = Math.min(hop, HOPS.length - 1);

  return (
    <Slide id="postcard" title="A message is a postcard">
      <Eyebrow index="00">Why should we care?</Eyebrow>
      <Heading>
        Without encryption, every message is a <Hl tone="warn">postcard</Hl>.
      </Heading>
      <Reveal delay={0.15}>
        <p className="mt-4 max-w-[62rem] text-[1.5rem] leading-snug text-muted">
          Anyone who handles it on the way can <Hl tone="bad">read</Hl> it, <Hl tone="bad">copy</Hl> it — or quietly{" "}
          <Hl tone="bad">change</Hl> it.
        </p>
      </Reveal>

      <div ref={ref} className="relative mt-14 mb-8">
        <div className="absolute top-[3.25rem] right-[10%] left-[10%] h-1 rounded-full bg-line" />
        <div className="relative grid grid-cols-5">
          {HOPS.map((h, i) => {
            const seen = !h.endpoint && hop > i && hop <= HOPS.length;
            const trusted = answer && h.endpoint;
            return (
              <Reveal key={h.label} delay={0.2 + i * 0.08} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative grid size-[6.5rem] place-items-center rounded-3xl border-2 bg-card text-[2.8rem] transition-all duration-500",
                    trusted ? "border-good text-good shadow-[0_0_40px_-5px_var(--good)]" : "border-line",
                    answer && !h.endpoint && "opacity-40",
                  )}
                >
                  <h.Icon />
                  <AnimatePresence>
                    {seen && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="absolute -top-3 -right-3 grid size-11 place-items-center rounded-full bg-bad text-[1.4rem] text-white shadow-lg"
                      >
                        <LuEye />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-4 font-display text-[1.45rem] font-bold">{h.label}</div>
                <div className="text-[1.05rem] text-muted">{h.sub}</div>
              </Reveal>
            );
          })}
        </div>

        <motion.div
          key={cycle}
          initial={{ left: "0%", opacity: 0 }}
          className="pointer-events-none absolute top-[-2.6rem] w-[20%] px-3"
          animate={{ left: `${pos * 20}%`, opacity: hop > HOPS.length - 1 ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="mx-auto w-fit -rotate-3 rounded-lg border-2 border-amber-700/40 bg-[#fff7e0] px-3 py-1.5 font-mono text-[0.95rem] leading-tight whitespace-nowrap text-[#3b2a0a] shadow-xl">
            ✉ “PIN is 4921”
          </div>
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_24rem] items-stretch gap-8">
        <Reveal delay={0.5}>
          <button
            type="button"
            onClick={() => setAnswer((a) => !a)}
            className="h-full w-full rounded-2xl border-2 border-line bg-card/70 p-6 text-left transition-colors hover:border-accent"
          >
            <div className="font-display text-[1.8rem] font-bold">How many of these machines do you control?</div>
            <AnimatePresence mode="wait">
              {answer ? (
                <motion.div
                  key="a"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-[1.5rem] font-semibold text-good"
                >
                  Only two — the ends. End-to-end encryption trusts nothing in between.
                </motion.div>
              ) : (
                <motion.div key="q" exit={{ opacity: 0 }} className="mt-3 text-[1.2rem] text-muted">
                  (click to reveal)
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </Reveal>
        <TermCard k="intermediary" delay={0.6} compact />
      </div>
    </Slide>
  );
}
