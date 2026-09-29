"use client";

import { motion, useInView } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { LuArrowLeftRight, LuCheck, LuServer, LuSmartphone, LuUser } from "react-icons/lu";
import { PiDetectiveFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal, TermCard } from "../deck/ui";
import { usePresenterIdentity } from "../deck/usePresenterIdentity";

const DEMO_NUMBER = "37291 04856 11923 58402 76610 29384 50172 93846 61059 38271 04495 82736".split(" ");

export function S11Safety() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [checked, setChecked] = useState(-1);
  const identity = usePresenterIdentity();

  useEffect(() => {
    if (!inView) return undefined;
    let i = -1;
    const id = setInterval(() => {
      i++;
      setChecked(i);
      if (i >= DEMO_NUMBER.length) clearInterval(id);
    }, 220);
    return () => {
      clearInterval(id);
      setChecked(-1);
    };
  }, [inView]);

  const verified = checked >= DEMO_NUMBER.length;

  return (
    <Slide id="safety-numbers" title="Safety numbers">
      <div className="grid grid-cols-[1fr_1.05fr] gap-12">
        <div>
          <Eyebrow index="09">Verification</Eyebrow>
          <Heading>
            But is it <Hl>really</Hl> Bob's key?
          </Heading>
          <Reveal delay={0.15}>
            <p className="mt-5 text-[1.4rem] leading-snug text-muted">
              A malicious server could hand Alice <Hl tone="bad">its own key</Hl> instead of Bob's — then decrypt, read
              and re-encrypt everything in the middle. E2EE apps let you check.
            </p>
          </Reveal>

          <Reveal
            delay={0.25}
            className="mt-6 flex items-center justify-between rounded-2xl border-2 border-line bg-card/60 px-6 py-4"
          >
            <Actor icon={<LuUser />} name="Alice" tone="text-accent" />
            <Dashes />
            <div className="flex flex-col items-center">
              <div className="relative grid size-16 place-items-center rounded-2xl border-2 border-bad bg-bad/10 text-[1.8rem] text-bad">
                <LuServer />
                <PiDetectiveFill className="absolute -top-3 -right-3 size-8 rounded-full border-2 border-bad bg-card p-0.5" />
              </div>
              <span className="mt-1 text-[1rem] font-bold text-bad">Mallory swaps keys</span>
            </div>
            <Dashes />
            <Actor icon={<LuUser />} name="Bob" tone="text-iris" />
          </Reveal>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <TermCard k="aitm" delay={0.35} compact />
            <TermCard k="tofu" delay={0.45} compact />
          </div>
        </div>

        <div ref={ref} className="flex flex-col gap-5">
          <Reveal delay={0.1} className="flex items-center justify-center gap-4">
            <SafetyPhone owner="Alice's phone" checked={checked} verified={verified} />
            <motion.div
              animate={verified ? { scale: [1, 1.3, 1] } : {}}
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-full border-2 text-[1.6rem] transition-colors",
                verified ? "border-good bg-good text-bg" : "border-line text-muted",
              )}
            >
              {verified ? <LuCheck /> : <LuArrowLeftRight />}
            </motion.div>
            <SafetyPhone owner="Bob's phone" checked={checked} verified={verified} />
          </Reveal>

          <div className="grid grid-cols-[1.25fr_1fr] gap-4">
            <Reveal delay={0.3} className="rounded-2xl border-2 border-accent bg-accent/10 p-5">
              <div className="flex items-center gap-2 font-mono text-[0.9rem] font-bold tracking-widest text-accent uppercase">
                <LuSmartphone /> Check your phone now
              </div>
              <p className="mt-2 text-[1.1rem] leading-snug">
                Under the demo message, Yusif's safety number should be:
              </p>
              <div className="mt-2 grid grid-cols-3 gap-x-3 font-display font-mono text-[1.6rem] font-bold tabular-nums">
                {(identity?.safety ?? Array.from({ length: 6 }, () => "·····")).map((g, i) => (
                  <span key={i}>{g}</span>
                ))}
              </div>
            </Reveal>
            <TermCard k="oob" delay={0.4} compact />
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Actor({ icon, name, tone }: { icon: React.ReactNode; name: string; tone: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "grid size-14 place-items-center rounded-full border-2 border-current bg-card text-[1.6rem]",
          tone,
        )}
      >
        {icon}
      </div>
      <span className="mt-1 text-[1.05rem] font-bold">{name}</span>
    </div>
  );
}

function Dashes() {
  return (
    <div className="relative mx-2 h-1 flex-1 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 w-[200%] bg-bad/70"
        style={{ maskImage: "repeating-linear-gradient(90deg, black 0 10px, transparent 10px 18px)" }}
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function SafetyPhone({ owner, checked, verified }: { owner: string; checked: number; verified: boolean }) {
  return (
    <div
      className={cn(
        "flex w-[15.5rem] flex-col items-center rounded-[2rem] border-4 bg-bg p-4 transition-colors duration-500",
        verified ? "border-good" : "border-fg/25",
      )}
    >
      <div className="mb-3 h-1.5 w-14 rounded-full bg-fg/25" />
      <div className="text-[0.9rem] font-semibold text-muted">{owner}</div>
      <div className="font-display text-[1.15rem] font-bold">Safety number</div>
      <div className="mt-2 rounded-xl bg-white p-2">
        <QRCodeSVG value={DEMO_NUMBER.join("")} size={100} className="size-[6.2rem]" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-1 font-mono text-[1.05rem] font-bold tabular-nums">
        {DEMO_NUMBER.map((g, i) => (
          <span
            key={i}
            className={cn(
              "rounded px-0.5 transition-colors duration-200",
              i <= checked ? "bg-good/20 text-good" : "text-fg",
            )}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}
