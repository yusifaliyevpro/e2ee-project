"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { LuKeyRound, LuPackage, LuUser } from "react-icons/lu";
import { PiDetectiveFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";
import { Padlock } from "../visual/Padlock";

export function S05Keys() {
  return (
    <PinnedSlide id="keys" title="Symmetric vs asymmetric" steps={2}>
      {(step) => (
        <AnimatePresence mode="wait">
          {step === 0 ? <Symmetric key="sym" /> : <Asymmetric key="asym" />}
        </AnimatePresence>
      )}
    </PinnedSlide>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.55, ease }}
      className="grid grid-cols-[1fr_1.1fr] items-center gap-12"
    >
      {children}
    </motion.div>
  );
}

function Person({ name, tone, children }: { name: string; tone: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("grid size-[5.5rem] place-items-center rounded-full border-4 bg-card text-[2.6rem]", tone)}>
        <LuUser />
      </div>
      <div className="font-display text-[1.4rem] font-bold">{name}</div>
      {children}
    </div>
  );
}

function Eve({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid size-[4.8rem] place-items-center rounded-full border-4 border-bad bg-bad/10 text-[2.4rem] text-bad">
        <PiDetectiveFill />
      </div>
      <div className="font-display text-[1.25rem] font-bold text-bad">Eve</div>
      <div className="text-[1rem] text-muted">{label}</div>
    </div>
  );
}

function Symmetric() {
  return (
    <Frame>
      <div>
        <Eyebrow index="03">Two families</Eyebrow>
        <h2 className="font-display text-[3.3rem] leading-[1.05] font-bold tracking-tight">
          <Hl tone="gold">Symmetric</Hl>: one key locks <em>and</em> unlocks.
        </h2>
        <p className="mt-5 text-[1.45rem] leading-snug text-muted">
          Fast and strong (that's AES). But Alice and Bob need the <Hl tone="fg">same</Hl> key first. How do they share
          it if Eve is listening to everything?
        </p>
        <div className="mt-7 max-w-[34rem]">
          <TermCard k="distribution" delay={0.2} />
        </div>
      </div>

      <div className="relative h-[26rem] rounded-3xl border-2 border-line bg-card/60">
        <div className="absolute top-10 left-10">
          <Person name="Alice" tone="border-accent text-accent">
            <LuKeyRound className="size-10 text-gold" />
          </Person>
        </div>
        <div className="absolute top-10 right-10">
          <Person name="Bob" tone="border-iris text-iris">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.55, 0.62, 1] }}
            >
              <LuKeyRound className="size-10 text-gold" />
            </motion.span>
          </Person>
        </div>
        <div className="absolute top-[5.2rem] right-[10rem] left-[10rem] border-t-4 border-dashed border-line" />
        {/* the key travelling over the wire */}
        <motion.div
          className="absolute top-[3.6rem] text-[2.6rem] text-gold"
          animate={{ left: ["22%", "72%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <LuKeyRound />
        </motion.div>
        {/* Eve's copy */}
        <motion.div
          className="absolute left-1/2 text-[2.2rem] text-gold"
          animate={{ top: ["5rem", "5rem", "15rem", "15rem"], opacity: [0, 0, 1, 1, 0] }}
          transition={{
            top: { duration: 3.2, repeat: Infinity, times: [0, 0.45, 0.7, 1] },
            opacity: { duration: 3.2, repeat: Infinity, times: [0, 0.45, 0.55, 0.9, 1] },
          }}
        >
          <LuKeyRound className="-translate-x-1/2" />
        </motion.div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <Eve label="copies the key → reads everything" />
        </div>
      </div>
    </Frame>
  );
}

function Asymmetric() {
  return (
    <Frame>
      <div>
        <Eyebrow index="03">Two families</Eyebrow>
        <h2 className="font-display text-[3.3rem] leading-[1.05] font-bold tracking-tight">
          <Hl tone="good">Asymmetric</Hl>: a <em>pair</em> of keys.
        </h2>
        <ul className="mt-5 space-y-3 text-[1.4rem] leading-snug">
          <li className="flex gap-3">
            <Padlock locked={false} className="mt-1 w-7 shrink-0 text-good" />
            <span>
              <Hl tone="good">Public key</Hl> = an open padlock. Give copies to everyone — even Eve.
            </span>
          </li>
          <li className="flex gap-3">
            <LuKeyRound className="mt-1 size-7 shrink-0 text-gold" />
            <span>
              <Hl tone="gold">Private key</Hl> = the only key that opens it. It never leaves Bob's device.
            </span>
          </li>
        </ul>
        <div className="mt-6 grid grid-cols-[1fr_1fr] gap-4">
          <TermCard k="trapdoor" delay={0.2} compact />
          <div className="flex flex-col justify-center rounded-2xl border-2 border-line bg-card/70 p-5 font-mono text-[1rem]">
            <div className="text-good">easy →</div>
            <div className="font-bold whitespace-nowrap">1,013 × 2,027 = 2,053,351</div>
            <div className="mt-3 text-bad">hard ←</div>
            <div className="font-bold whitespace-nowrap">2,053,351 = ? × ?</div>
            <div className="mt-2 font-sans text-[0.95rem] text-muted">Real keys use numbers with 600+ digits.</div>
          </div>
        </div>
      </div>

      <div className="relative h-[26rem] rounded-3xl border-2 border-line bg-card/60">
        <div className="absolute top-10 left-10">
          <Person name="Alice" tone="border-accent text-accent" />
        </div>
        <div className="absolute top-10 right-10">
          <Person name="Bob" tone="border-iris text-iris">
            <LuKeyRound className="size-9 text-gold" />
          </Person>
        </div>
        <div className="absolute top-[5.2rem] right-[10rem] left-[10rem] border-t-4 border-dashed border-line" />

        {/* Bob hands out an open padlock, Alice sends back a locked box */}
        <motion.div
          className="absolute top-[3.4rem] w-12 text-good"
          animate={{ left: ["72%", "72%", "24%", "24%"], opacity: [0, 1, 1, 0, 0] }}
          transition={{
            left: { duration: 4, repeat: Infinity, times: [0, 0.08, 0.4, 1], ease: "easeInOut" },
            opacity: { duration: 4, repeat: Infinity, times: [0, 0.08, 0.4, 0.46, 1] },
          }}
        >
          <Padlock locked={false} />
        </motion.div>
        <motion.div
          className="absolute top-[3.2rem] flex items-end"
          animate={{ left: ["24%", "24%", "70%", "70%"], opacity: [0, 0, 1, 1, 0] }}
          transition={{
            left: { duration: 4, repeat: Infinity, times: [0, 0.5, 0.88, 1], ease: "easeInOut" },
            opacity: { duration: 4, repeat: Infinity, times: [0, 0.44, 0.5, 0.92, 1] },
          }}
        >
          <LuPackage className="size-12 text-fg" />
          <Padlock locked className="-ml-3 w-7 text-good" />
        </motion.div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <Eve label="has the public key too — still can't open the box" />
        </div>
      </div>
    </Frame>
  );
}
