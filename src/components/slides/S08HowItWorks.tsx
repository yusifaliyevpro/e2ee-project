"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { LuArrowDown, LuKeyRound, LuServer } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";
import { Padlock } from "../visual/Padlock";

const STEPS = [
  {
    name: "Generate keys",
    text: "Each phone creates a key pair. The private key never leaves the device; the public keys are uploaded to the server.",
  },
  {
    name: "Lock",
    text: "Alice downloads Bob's public key, runs key agreement with a fresh ephemeral key, derives a message key and encrypts.",
  },
  {
    name: "Deliver & unlock",
    text: "The server only relays ciphertext. Bob combines his private key with Alice's ephemeral public key — same secret, message decrypted.",
  },
];

export function S08HowItWorks() {
  return (
    <PinnedSlide id="how-e2ee-works" title="How E2EE works" steps={3}>
      {(step) => (
        <div className="grid grid-cols-[0.9fr_1.35fr] items-center gap-10">
          <div>
            <Eyebrow index="06">Under the hood</Eyebrow>
            <h2 className="font-display text-[3rem] leading-[1.05] font-bold tracking-tight">
              How <Hl>E2EE</Hl> works, in three steps.
            </h2>
            <ol className="mt-7 space-y-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.name}
                  className={cn(
                    "rounded-2xl border-2 p-4 transition-all duration-500",
                    i === step ? "border-accent bg-accent/10" : "border-line opacity-45",
                  )}
                >
                  <div className="flex items-center gap-3 font-display text-[1.45rem] font-bold">
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-full font-mono text-[1.05rem]",
                        i === step ? "bg-accent text-bg" : "bg-line",
                      )}
                    >
                      {i + 1}
                    </span>
                    {s.name}
                  </div>
                  <AnimatePresence initial={false}>
                    {i === step && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-2 text-[1.2rem] leading-snug text-muted"
                      >
                        {s.text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ol>
            <div className="mt-5 max-w-[34rem]">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {step === 0 && <TermCard k="prekey" delay={0} compact />}
                  {step === 1 && <TermCard k="ephemeral" delay={0} compact />}
                  {step === 2 && (
                    <div className="rounded-2xl border-2 border-line bg-card/70 p-5 text-[1.15rem] leading-snug">
                      This is the <Hl>Signal Protocol</Hl> (X3DH / PQXDH + Double Ratchet) — also used by WhatsApp,
                      Messenger and Google Messages.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <Diagram step={step} />
        </div>
      )}
    </PinnedSlide>
  );
}

function Diagram({ step }: { step: number }) {
  return (
    <div className="relative h-[36rem] rounded-3xl border-2 border-line bg-card/50">
      {/* Server */}
      <div className="absolute top-4 left-1/2 w-[17rem] -translate-x-1/2">
        <div className="rounded-2xl border-2 border-line bg-card p-3 shadow-lg">
          <div className="flex items-center justify-center gap-2 font-display text-[1.2rem] font-bold">
            <LuServer className="text-muted" /> Server
          </div>
          <div className="mt-1.5 space-y-1 font-mono text-[0.85rem]">
            <Row show tone="good">
              🔓 Alice's public key
            </Row>
            <Row show tone="good">
              🔓 Bob's prekey bundle
            </Row>
            <Row show={step === 2} tone="muted">
              ▓▒░ ciphertext only ░▒▓
            </Row>
          </div>
        </div>
      </div>

      {/* Upload arrows for step 0 */}
      <Flyer show={step === 0} from={{ left: "16%", top: "18rem" }} to={{ left: "38%", top: "6rem" }}>
        <Chip tone="good">🔓 public</Chip>
      </Flyer>
      <Flyer show={step === 0} from={{ left: "72%", top: "18rem" }} to={{ left: "54%", top: "6rem" }}>
        <Chip tone="good">🔓 public</Chip>
      </Flyer>
      {/* Bob's key down to Alice for step 1 */}
      <Flyer show={step === 1} from={{ left: "48%", top: "6rem" }} to={{ left: "10%", top: "13rem" }}>
        <Chip tone="good">🔓 Bob's key</Chip>
      </Flyer>
      {/* Ciphertext across for step 2 */}
      <Flyer
        show={step === 2}
        from={{ left: "14%", top: "13rem" }}
        via={{ left: "44%", top: "8rem" }}
        to={{ left: "74%", top: "13rem" }}
      >
        <Chip tone="iris">✉ 9fX#k2…</Chip>
      </Flyer>

      <Phone side="left" name="Alice">
        <Vault />
        <Pipeline show={step >= 1}>
          <Stage>🔑 ephemeral key + 🔓 Bob's key</Stage>
          <Arrow />
          <Stage tone="accent">X25519 → shared secret</Stage>
          <Arrow />
          <Stage tone="gold">KDF → message key</Stage>
          <Arrow />
          <Stage>“Hi Bob 👋” → AES-GCM</Stage>
          <Arrow />
          <Stage tone="iris">✉ 9fX#k2Qp…</Stage>
        </Pipeline>
      </Phone>

      <Phone side="right" name="Bob">
        <Vault />
        <Pipeline show={step >= 2}>
          <Stage tone="iris">✉ 9fX#k2Qp…</Stage>
          <Arrow />
          <Stage>🔑 private key + Alice's ephemeral 🔓</Stage>
          <Arrow />
          <Stage tone="accent">X25519 → same secret</Stage>
          <Arrow />
          <Stage tone="gold">KDF → message key</Stage>
          <Arrow />
          <Stage tone="good">“Hi Bob 👋” ✓</Stage>
        </Pipeline>
      </Phone>
    </div>
  );
}

function Phone({ side, name, children }: { side: "left" | "right"; name: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute bottom-5 flex h-[22.5rem] w-[17.5rem] flex-col rounded-[2rem] border-4 border-fg/25 bg-bg p-3",
        side === "left" ? "left-5" : "right-5",
      )}
    >
      <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-fg/25" />
      <div className="text-center font-display text-[1.2rem] font-bold">{name}</div>
      <div className="mt-2 flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function Vault() {
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gold/60 bg-gold/10 px-2 py-1.5 text-[0.95rem] font-semibold text-gold">
      <LuKeyRound className="shrink-0" /> private key
      <Padlock locked className="ml-auto w-4 shrink-0" />
    </div>
  );
}

function Pipeline({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="flex flex-col items-stretch"
          initial="hidden"
          animate="shown"
          exit="hidden"
          variants={{ shown: { transition: { staggerChildren: 0.28, delayChildren: 0.5 } }, hidden: {} }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TONES = {
  plain: "border-line",
  accent: "border-accent/70 text-accent",
  gold: "border-gold/70 text-gold",
  iris: "border-iris/70 text-iris",
  good: "border-good/70 text-good",
  muted: "text-muted",
} as const;

function Stage({ children, tone = "plain" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: -6 }, shown: { opacity: 1, y: 0 } }}
      className={cn(
        "rounded-lg border-2 bg-card px-2 py-1 text-center text-[0.88rem] leading-tight font-semibold",
        TONES[tone],
      )}
    >
      {children}
    </motion.div>
  );
}

function Arrow() {
  return (
    <motion.div variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }} className="flex justify-center text-muted">
      <LuArrowDown className="size-3.5" />
    </motion.div>
  );
}

function Row({ show, tone, children }: { show: boolean; tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn("overflow-hidden rounded-md border-2 bg-bg px-2 py-0.5 text-center", TONES[tone])}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ children, tone }: { children: ReactNode; tone: keyof typeof TONES }) {
  return (
    <span
      className={cn(
        "rounded-full border-2 bg-card px-3 py-1 font-mono text-[0.95rem] font-bold whitespace-nowrap shadow-lg",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

type Pos = { left: string; top: string };

function Flyer({
  show,
  from,
  via,
  to,
  children,
}: {
  show: boolean;
  from: Pos;
  via?: Pos;
  to: Pos;
  children: ReactNode;
}) {
  const pts = via ? [from, via, to] : [from, to];
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute z-10"
          initial={{ ...from, opacity: 0 }}
          animate={{
            left: [...pts.map((p) => p.left), to.left],
            top: [...pts.map((p) => p.top), to.top],
            opacity: [0, 1, 1, 0],
          }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 0.4, ease }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
