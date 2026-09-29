"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { LuCheck, LuKeyRound, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { Envelope } from "../visual/Envelope";
import { Padlock } from "../visual/Padlock";
import { CIPHER_CHARS, useScramble } from "../visual/Scramble";
import type { Received } from "./AudienceApp";

const T = { breakSeal: 1300, open: 1700, letterOut: 2200, blob: 3000, decrypt: 4100, reveal: 7000 };

const STEPS = [
  "X25519: shared secret from your private key",
  "Unwrap the message key",
  "AES-256-GCM: decrypt + integrity check",
  "Ed25519: signature is from Yusif",
];

export function Receive({ received, onRevealed }: { received: Received; onRevealed: (r: Received) => void }) {
  const [t, setT] = useState(0);
  const { msg, result, error } = received;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      setT(elapsed);
      if (elapsed < T.reveal + 2000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(() => onRevealed(received), T.reveal + 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [received, onRevealed]);

  const envelopePhase = t < T.blob;
  const stepsDone = Math.max(0, Math.min(4, Math.floor((t - T.decrypt) / 650) + 1));
  const failed = Boolean(error) && t >= T.decrypt + 650;
  const revealed = !error && t >= T.reveal;
  const lines = useMemo(() => [msg.ct.slice(0, 20), msg.ct.slice(20, 40), msg.ct.slice(40, 60), "…"], [msg.ct]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <AnimatePresence mode="wait">
        {envelopePhase ? (
          <motion.div
            key="env"
            className="flex flex-1 flex-col items-center justify-center"
            exit={{ scale: 1.3, opacity: 0, transition: { duration: 0.35 } }}
          >
            <motion.div
              initial={{ y: -500, rotate: -25 }}
              animate={{ y: 0, rotate: [-25, 6, -4, 0] }}
              transition={{
                y: { type: "spring", stiffness: 110, damping: 13 },
                rotate: { duration: 0.9, ease: "easeOut" },
              }}
            >
              <motion.div
                animate={t < T.breakSeal ? { rotate: [0, -3, 3, -2, 0] } : { rotate: 0 }}
                transition={{ duration: 0.5, repeat: t < T.breakSeal ? Infinity : 0, repeatDelay: 0.2 }}
              >
                <Envelope
                  closed={t < T.open}
                  sealed={t < T.breakSeal}
                  letterOut={t >= T.letterOut}
                  lines={lines}
                  className="w-72"
                />
              </motion.div>
            </motion.div>
            <p className="mt-6 text-xl font-bold">
              {t < T.breakSeal ? "📩 New encrypted message!" : "Opening the envelope…"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-1 flex-col"
          >
            <MessageBody ct={msg.ct} plaintext={result?.plaintext ?? ""} revealed={revealed} failed={failed} />

            <div className="mt-4 rounded-2xl border-2 border-line bg-card p-4">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={t >= T.decrypt ? { x: [-40, 0], opacity: [0, 1] } : { opacity: 0 }}
                  className="text-2xl text-gold"
                >
                  <LuKeyRound />
                </motion.span>
                <Padlock
                  locked={!revealed}
                  className={cn("w-7", revealed ? "text-good" : failed ? "text-bad" : "text-muted")}
                />
                <span className="font-bold">
                  {revealed
                    ? "Decrypted on YOUR phone"
                    : failed
                      ? "Decryption failed"
                      : "Decrypting with your private key…"}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {STEPS.map((s, i) => {
                  const done = t >= T.decrypt && i < stepsDone;
                  const bad = failed && i === (error?.includes("Signature") ? 3 : 0);
                  return (
                    <motion.li
                      key={s}
                      initial={false}
                      animate={{ opacity: done || bad ? 1 : 0.3 }}
                      className={cn("flex items-center gap-2", bad && "font-semibold text-bad")}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full text-[0.7rem]",
                          bad ? "bg-bad text-white" : done ? "bg-good text-white" : "bg-line",
                        )}
                      >
                        {bad ? "✕" : done ? <LuCheck /> : i + 1}
                      </span>
                      {s}
                    </motion.li>
                  );
                })}
              </ul>
              {failed && (
                <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-bad">
                  <LuTriangleAlert className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {revealed && <Confetti />}
    </motion.div>
  );
}

function MessageBody({
  ct,
  plaintext,
  revealed,
  failed,
}: {
  ct: string;
  plaintext: string;
  revealed: boolean;
  failed: boolean;
}) {
  const glitch = useGlitch(ct, !revealed);
  const decoded = useScramble(plaintext, { play: revealed, duration: 1.4, from: ct });

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 p-5 transition-colors duration-700",
        revealed ? "border-good bg-good/10" : failed ? "border-bad bg-bad/10" : "border-iris bg-iris/10",
      )}
    >
      <div
        className={cn(
          "text-xs font-bold tracking-widest uppercase",
          revealed ? "text-good" : failed ? "text-bad" : "text-iris",
        )}
      >
        {revealed ? "Plaintext · only you can see this" : "Ciphertext · what everyone else sees"}
      </div>
      {revealed ? (
        <motion.p
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="mt-3 text-[1.7rem] leading-snug font-bold break-words"
        >
          {decoded}
        </motion.p>
      ) : (
        <p className="mt-3 max-h-40 overflow-hidden font-mono text-base leading-relaxed break-all text-iris">
          {glitch}
        </p>
      )}
    </div>
  );
}

/** Keeps ciphertext visibly "alive" by flickering random characters. */
function useGlitch(text: string, active: boolean) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      const chars = text.split("");
      for (let i = 0; i < Math.ceil(text.length / 12); i++) {
        chars[Math.floor(Math.random() * chars.length)] = CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
      }
      setOut(chars.join(""));
    }, 90);
    return () => clearInterval(id);
  }, [text, active]);
  return out;
}

const CONFETTI_COLORS = ["#22d3ee", "#a78bfa", "#4ade80", "#facc15", "#fb7185"];

/** Deterministic noise in [0, 1) so renders stay pure. */
function noise(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PIECES = Array.from({ length: 36 }, (_, i) => ({
  x: (noise(i, 1) - 0.5) * 360,
  y: -220 - noise(i, 2) * 260,
  r: noise(i, 3) * 720 - 360,
  c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  d: noise(i, 4) * 0.25,
}));

function Confetti() {
  const pieces = PIECES;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-1/2 z-30 flex justify-center">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-3 w-2 rounded-sm"
          style={{ backgroundColor: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 520], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 2.2, delay: p.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
