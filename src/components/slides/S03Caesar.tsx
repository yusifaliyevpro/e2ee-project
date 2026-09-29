"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { LuKeyRound, LuX, LuZap } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal, TermCard } from "../deck/ui";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function caesar(text: string, shift: number) {
  return text
    .toUpperCase()
    .split("")
    .map((c) => {
      const i = A.indexOf(c);
      return i < 0 ? c : A[(i + shift + 26) % 26];
    })
    .join("");
}

export function S03Caesar() {
  const [shift, setShift] = useState(3);
  const [text, setText] = useState("ATTACK AT DAWN");
  const [cracking, setCracking] = useState(false);
  const cipher = caesar(text, shift);

  return (
    <Slide id="caesar" title="Caesar cipher">
      <div className="grid grid-cols-[1fr_1.15fr] items-center gap-12">
        <div>
          <Eyebrow index="01">Foundations</Eyebrow>
          <Heading>
            Encryption turns <Hl>plaintext</Hl> into <Hl tone="iris">ciphertext</Hl>.
          </Heading>
          <Reveal delay={0.15}>
            <div className="mt-7 flex flex-wrap items-center gap-3 font-mono text-[1.3rem]">
              <span className="rounded-xl border-2 border-line bg-card px-4 py-2">HELLO</span>
              <span className="text-muted">+</span>
              <span className="flex items-center gap-2 rounded-xl border-2 border-gold/60 bg-gold/10 px-4 py-2 text-gold">
                <LuKeyRound /> key = 3
              </span>
              <span className="text-muted">→ cipher →</span>
              <span className="rounded-xl border-2 border-iris/60 bg-iris/10 px-4 py-2 text-iris">KHOOR</span>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-6 text-[1.35rem] leading-snug text-muted">
              Julius Caesar, around 50 BC: shift every letter by 3. The <Hl tone="fg">cipher</Hl> is the method, the{" "}
              <Hl tone="gold">key</Hl> is the secret.
            </p>
          </Reveal>
          <div className="mt-7 grid grid-cols-2 gap-4">
            <TermCard k="kerckhoffs" delay={0.35} compact />
            <TermCard k="keyspace" delay={0.45} compact />
          </div>
        </div>

        <Reveal delay={0.2} className="relative rounded-3xl border-2 border-line bg-card/80 p-6">
          <div className="grid grid-cols-[auto_1fr] items-center gap-6">
            <Wheel shift={shift} />
            <div className="min-w-0">
              <label className="font-mono text-[0.9rem] tracking-widest text-muted uppercase" htmlFor="caesar-text">
                Plaintext
              </label>
              <input
                id="caesar-text"
                value={text}
                maxLength={22}
                onChange={(e) => setText(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))}
                className="mt-1 w-full rounded-xl border-2 border-line bg-bg px-3 py-2 font-mono text-[1.35rem] tracking-wider outline-none focus:border-accent"
              />
              <div className="mt-5 flex items-baseline justify-between">
                <span className="font-mono text-[0.9rem] tracking-widest text-muted uppercase">Key (shift)</span>
                <span className="font-mono text-[2rem] font-bold text-gold tabular-nums">{shift}</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
                aria-label="Shift"
                className="w-full accent-accent"
              />
              <div className="mt-5 font-mono text-[0.9rem] tracking-widest text-muted uppercase">Ciphertext</div>
              <div className="font-mono text-[1.6rem] font-bold tracking-wider break-all text-iris">
                {cipher || "—"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCracking(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-bad px-5 py-3 text-[1.25rem] font-bold text-white transition-transform hover:scale-[1.01] active:scale-95"
          >
            <LuZap /> Crack it by brute force
          </button>

          <AnimatePresence>
            {cracking && <Cracker key={cipher} cipher={cipher} plain={text} onClose={() => setCracking(false)} />}
          </AnimatePresence>
        </Reveal>
      </div>
    </Slide>
  );
}

function Wheel({ shift }: { shift: number }) {
  const size = 300;
  const c = size / 2;
  const step = 360 / 26;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-[17rem]">
      <circle cx={c} cy={c} r={146} className="fill-bg stroke-line" strokeWidth="2" />
      {A.split("").map((ch, i) => (
        <text
          key={ch}
          x={c}
          y={c - 122}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${i * step} ${c} ${c})`}
          className={cn("font-mono font-bold", i === 0 ? "fill-accent" : "fill-fg")}
          fontSize="17"
        >
          {ch}
        </text>
      ))}
      <motion.g animate={{ rotate: -shift * step }} transition={{ type: "spring", stiffness: 120, damping: 16 }}>
        <circle cx={c} cy={c} r={104} className="fill-card stroke-iris" strokeWidth="2" />
        {A.split("").map((ch, i) => (
          <text
            key={ch}
            x={c}
            y={c - 84}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${i * step} ${c} ${c})`}
            className="fill-iris font-mono font-bold"
            fontSize="16"
          >
            {ch}
          </text>
        ))}
      </motion.g>
      <path d={`M${c - 11} 2 L${c + 11} 2 L${c} 20 Z`} className="fill-accent" />
      <circle cx={c} cy={c} r={42} className="fill-bg stroke-line" strokeWidth="2" />
      <text x={c} y={c - 6} textAnchor="middle" className="fill-muted font-mono" fontSize="12">
        SHIFT
      </text>
      <text x={c} y={c + 16} textAnchor="middle" className="fill-gold font-mono font-bold" fontSize="24">
        {shift}
      </text>
    </svg>
  );
}

function Cracker({ cipher, plain, onClose }: { cipher: string; plain: string; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setShown((n) => (n >= 25 ? n : n + 1)), 70);
    return () => clearInterval(id);
  }, []);
  const done = shown >= 25;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute inset-0 z-10 flex flex-col rounded-3xl border-2 border-bad/60 bg-card p-5"
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-2 font-display text-[1.35rem] font-bold",
            done ? "text-good" : "text-bad",
          )}
        >
          <LuZap /> {done ? "Cracked! 25 keys tried in microseconds." : "Trying every key…"}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 text-[1.4rem] text-muted hover:text-fg"
        >
          <LuX />
        </button>
      </div>
      <div className="mt-3 grid flex-1 grid-flow-col grid-cols-2 grid-rows-[repeat(13,minmax(0,1fr))] gap-x-6 font-mono text-[0.95rem]">
        {Array.from({ length: 25 }, (_, i) => {
          const k = i + 1;
          const guess = caesar(cipher, -k);
          const hit = guess === plain.toUpperCase();
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i < shown ? 1 : 0, x: i < shown ? 0 : -10 }}
              className={cn(
                "flex items-center gap-3 truncate rounded px-1.5",
                done && hit && "bg-good/20 font-bold text-good",
                done && !hit && "opacity-40",
              )}
            >
              <span className="w-8 shrink-0 text-muted tabular-nums">k={k}</span>
              <span className="truncate">{guess}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
