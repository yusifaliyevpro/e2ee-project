"use client";

import { ecb } from "@noble/ciphers/aes.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import { motion } from "motion/react";
import { useState } from "react";
import { LuShuffle } from "react-icons/lu";
import { fromHex } from "@/lib/bytes";
import { cn } from "@/lib/cn";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal, TermCard } from "../deck/ui";
import { caesar } from "./S03Caesar";

// Fixed demo key so the same input always gives the same output
const DEMO_KEY = fromHex("8e1f0b7c3a5d2e9f4b6a1c0d7e3f5a2b9c8d1e0f6a7b3c4d5e2f1a0b9c8d7e6f");
const TWO_256 = "115792089237316195423570985008687907853269984665640564039457584007913129639936";

function aesBlock(text: string): Uint8Array {
  return ecb(DEMO_KEY).encrypt(utf8ToBytes(text)).slice(0, 16);
}

function bits(block: Uint8Array): number[] {
  return Array.from(block).flatMap((b) => Array.from({ length: 8 }, (_, i) => (b >> (7 - i)) & 1));
}

export function S04Aes() {
  const [text, setText] = useState("MEET ME AT 8PM");
  const [prev, setPrev] = useState("MEET ME AT 8PM");

  const cur = bits(aesBlock(text));
  const old = bits(aesBlock(prev));
  const changed = cur.filter((b, i) => b !== old[i]).length;

  const update = (next: string) => {
    setPrev(text);
    setText(next);
  };

  const flipOne = () => {
    const letters = text
      .split("")
      .map((c, i) => [c, i] as const)
      .filter(([c]) => /[A-Z]/.test(c));
    if (letters.length === 0) return;
    const [c, i] = letters[Math.floor(Math.random() * letters.length)];
    const nextChar = String.fromCharCode(((c.charCodeAt(0) - 65 + 1) % 26) + 65);
    update(text.slice(0, i) + nextChar + text.slice(i + 1));
  };

  const caesarOld = caesar(prev, 3);
  const caesarNew = caesar(text, 3);

  return (
    <Slide id="aes" title="AES-256: modern encryption">
      <div className="grid grid-cols-[1fr_1.05fr] items-center gap-12">
        <div>
          <Eyebrow index="02">Modern ciphers</Eyebrow>
          <Heading>
            <Hl>AES-256</Hl> protects almost everything you do online.
          </Heading>
          <Reveal delay={0.15}>
            <p className="mt-5 text-[1.4rem] leading-snug text-muted">
              Advanced Encryption Standard (2001): your browser, Wi-Fi, WhatsApp, Signal and your bank all use it.
            </p>
          </Reveal>

          <Reveal delay={0.25} className="mt-7 rounded-3xl border-2 border-line bg-card/80 p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[1rem] tracking-widest text-muted uppercase">Caesar keyspace</span>
              <span className="font-display text-[2.4rem] font-bold text-bad">25</span>
            </div>
            <div className="mt-3 border-t-2 border-line pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[1rem] tracking-widest text-muted uppercase">AES-256 keyspace</span>
                <span className="font-display text-[2.4rem] font-bold text-good">
                  2<sup className="text-[0.55em]">256</sup>
                </span>
              </div>
              <p className="mt-1 font-mono text-[1.08rem] leading-snug break-all text-good">{TWO_256}</p>
            </div>
            <p className="mt-4 text-[1.2rem] leading-snug">
              8 billion people × 1 billion computers each × 1 billion keys per second →{" "}
              <Hl tone="good">about 10⁴¹ years</Hl>. The universe is only 1.4 × 10¹⁰ years old.
            </p>
          </Reveal>
        </div>

        <div className="flex flex-col gap-5">
          <Reveal delay={0.3} className="rounded-3xl border-2 border-line bg-card/80 p-6">
            <div className="text-[1.25rem] font-semibold">
              Superpower: <Hl tone="warn">change one letter → about half the bits flip.</Hl>
            </div>
            <div className="mt-4 flex gap-3">
              <input
                value={text}
                maxLength={15}
                onChange={(e) => update(e.target.value.toUpperCase())}
                aria-label="Text to encrypt"
                className="min-w-0 flex-1 rounded-xl border-2 border-line bg-bg px-3 py-2 font-mono text-[1.35rem] tracking-wider outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={flipOne}
                className="flex items-center gap-2 rounded-xl bg-warn px-4 font-bold whitespace-nowrap text-bg transition-transform active:scale-95"
              >
                <LuShuffle /> Change 1 letter
              </button>
            </div>

            <div className="mx-auto mt-5 grid w-fit grid-cols-[repeat(16,1.55rem)] gap-[0.3rem]">
              {cur.map((b, i) => {
                const flipped = b !== old[i];
                return (
                  <motion.div
                    key={`${i}-${text}`}
                    initial={flipped ? { scale: 1.6 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 14, delay: (i % 16) * 0.008 }}
                    className={cn(
                      "aspect-square rounded-[0.2rem] border-2",
                      b ? "border-accent bg-accent" : "border-line bg-bg",
                      flipped && "border-warn!",
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex items-baseline justify-between font-mono">
              <span className="text-[1rem] text-muted">AES output · 128 bits</span>
              <span className="text-[1.3rem] font-bold text-warn tabular-nums">
                {changed} / 128 bits changed ({Math.round((changed / 128) * 100)}%)
              </span>
            </div>

            <div className="mt-3 border-t-2 border-line pt-3 font-mono text-[1.05rem]">
              <span className="text-muted">Caesar, same change: </span>
              {caesarNew.split("").map((ch, i) => (
                <span key={i} className={cn(ch !== caesarOld[i] && "rounded bg-warn/25 font-bold text-warn")}>
                  {ch}
                </span>
              ))}
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            <TermCard k="avalanche" delay={0.4} compact />
            <TermCard k="roll" delay={0.5} compact />
          </div>
        </div>
      </div>
    </Slide>
  );
}
