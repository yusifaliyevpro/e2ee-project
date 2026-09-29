"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { LuRotateCw } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { RECAP, TERMS } from "@/lib/vocab";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal } from "../deck/ui";

export function S15Vocab() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const allFlipped = flipped.size === RECAP.length;

  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Slide id="vocabulary" title="New terms recap">
      <div className="flex items-end justify-between gap-8">
        <div>
          <Eyebrow index="13">Technical English</Eyebrow>
          <Heading>
            <Hl tone="warn">{RECAP.length} new terms</Hl> — how many can you define?
          </Heading>
        </div>
        <Reveal delay={0.2}>
          <button
            type="button"
            onClick={() => setFlipped(allFlipped ? new Set() : new Set(RECAP.map((_, i) => i)))}
            className="flex items-center gap-2 rounded-xl border-2 border-line px-4 py-2 text-[1.05rem] font-semibold whitespace-nowrap text-muted hover:text-fg"
          >
            <LuRotateCw /> {allFlipped ? "Hide all" : "Reveal all"}
          </button>
        </Reveal>
      </div>

      <div className="mt-7 grid grid-cols-6 gap-3" style={{ perspective: "1200px" }}>
        {RECAP.map((k, i) => {
          const t = TERMS[k];
          const isFlipped = flipped.has(i);
          return (
            <Reveal key={k} delay={0.1 + (i % 6) * 0.05 + Math.floor(i / 6) * 0.08} y={20}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-label={isFlipped ? `${t.term}: ${t.definition}` : `Reveal definition of ${t.term}`}
                className="relative block h-[8.6rem] w-full text-left"
              >
                <motion.div
                  className="relative size-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 20 }}
                >
                  <div
                    className="absolute inset-0 flex flex-col justify-center rounded-2xl border-2 border-warn/60 bg-card p-3"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="font-display text-[1.25rem] leading-tight font-bold">{t.term}</div>
                    <div className="mt-1 line-clamp-2 font-ipa text-[0.9rem] leading-tight text-muted">{t.ipa}</div>
                    <div className="mt-1 text-[0.8rem] font-semibold text-warn italic">{t.pos}</div>
                  </div>
                  <div
                    className={cn("absolute inset-0 flex items-center rounded-2xl border-2 border-warn bg-warn/15 p-3")}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <p className="bg-card/0 text-[0.95rem] leading-snug font-medium">{t.definition}</p>
                  </div>
                </motion.div>
              </button>
            </Reveal>
          );
        })}
        <Reveal delay={0.6} y={20}>
          <div className="grid h-[8.6rem] place-items-center rounded-2xl border-2 border-dashed border-line p-3 text-center text-[0.95rem] text-muted">
            Full list with examples on your phone → “New terms” tab
          </div>
        </Reveal>
      </div>
    </Slide>
  );
}
