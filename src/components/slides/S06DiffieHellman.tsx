"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { LuCheck, LuChevronRight, LuLock, LuRotateCcw, LuX } from "react-icons/lu";
import { PiDetectiveFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import { mix } from "@/lib/color";
import { Slide } from "../deck/Slide";
import { Eyebrow, Hl, Reveal, TermCard } from "../deck/ui";

const PUBLIC = "#facc15";
const ALICE_OPTIONS = ["#e11d48", "#c026d3", "#16a34a"];
const BOB_OPTIONS = ["#2563eb", "#0891b2", "#7c3aed"];

const CAPTIONS = [
  "Alice and Bob agree on a public starting colour. Everyone — even Eve — can see it.",
  "Each one picks a secret colour and never shares it with anyone.",
  "Each one mixes the public colour with their own secret.",
  "They swap the mixtures over the internet. Eve copies both.",
  "Each adds their own secret to the other's mixture → the SAME colour. Eve can't un-mix paint!",
];

export function S06DiffieHellman() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState(ALICE_OPTIONS[0]);
  const [b, setB] = useState(BOB_OPTIONS[0]);

  const mixA = mix(PUBLIC, a);
  const mixB = mix(PUBLIC, b);
  const shared = mix(PUBLIC, a, b);
  // Eve can only combine what she saw on the wire
  const eveGuess = mix(PUBLIC, mixA, mixB);

  return (
    <Slide id="diffie-hellman" title="Diffie–Hellman key agreement">
      <div className="grid grid-cols-[0.85fr_1.5fr] gap-10">
        <div className="flex flex-col">
          <Eyebrow index="04">Key agreement</Eyebrow>
          <Reveal delay={0.05}>
            <h2 className="font-display text-[2.9rem] leading-[1.05] font-bold tracking-tight">
              Agree on a <Hl>secret</Hl> while everyone is <Hl tone="bad">listening</Hl>.
            </h2>
          </Reveal>

          <Reveal delay={0.15} className="mt-6">
            <div className="flex gap-2">
              {CAPTIONS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Step ${i + 1}`}
                  className={cn(
                    "h-2.5 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-accent" : "bg-line hover:bg-muted/50",
                  )}
                />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 min-h-[5.5rem] text-[1.4rem] leading-snug font-medium"
              >
                <span className="font-mono text-accent">{step + 1}/5 </span>
                {CAPTIONS[step]}
              </motion.p>
            </AnimatePresence>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={step === 4}
                className="flex items-center gap-1 rounded-xl bg-accent px-5 py-2.5 text-[1.15rem] font-bold text-bg disabled:opacity-40"
              >
                Next step <LuChevronRight />
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex items-center gap-2 rounded-xl border-2 border-line px-4 py-2.5 text-[1.05rem] text-muted hover:text-fg"
              >
                <LuRotateCcw /> Reset
              </button>
            </div>
          </Reveal>

          <div className="mt-auto grid grid-cols-2 gap-4 pt-6">
            <TermCard k="agreement" delay={0.25} compact />
            <TermCard k="eavesdropper" delay={0.35} compact />
          </div>
        </div>

        <Reveal delay={0.1} className="flex flex-col">
          <div className="grid flex-1 grid-cols-[1fr_1.1fr_1fr] gap-4">
            <Column title="Alice" tone="text-accent border-accent/60">
              <Blob color={PUBLIC} label="public" />
              <Show when={step >= 1}>
                <Blob color={a} label="secret" secret />
                {step === 1 && <Swatches options={ALICE_OPTIONS} value={a} onChange={setA} />}
              </Show>
              <Show when={step >= 2}>
                <Blob color={mixA} label="public + secret" />
              </Show>
              <Show when={step >= 4}>
                <Blob color={shared} label="shared secret" big ok />
              </Show>
            </Column>

            <Column
              title={
                <span className="flex items-center gap-2 text-bad">
                  <PiDetectiveFill /> Public — Eve sees
                </span>
              }
              tone="border-bad/50 border-dashed"
            >
              <Blob color={PUBLIC} label="public colour" />
              <Show when={step >= 3}>
                <div className="relative h-5 w-full">
                  <Travel color={mixA} dir={1} />
                  <Travel color={mixB} dir={-1} />
                </div>
                <div className="flex gap-3">
                  <Blob color={mixA} label="Alice's mix" small />
                  <Blob color={mixB} label="Bob's mix" small />
                </div>
              </Show>
              <Show when={step >= 4}>
                <Blob color={eveGuess} label="Eve mixes all she saw" big bad />
              </Show>
            </Column>

            <Column title="Bob" tone="text-iris border-iris/60">
              <Blob color={PUBLIC} label="public" />
              <Show when={step >= 1}>
                <Blob color={b} label="secret" secret />
                {step === 1 && <Swatches options={BOB_OPTIONS} value={b} onChange={setB} />}
              </Show>
              <Show when={step >= 2}>
                <Blob color={mixB} label="public + secret" />
              </Show>
              <Show when={step >= 4}>
                <Blob color={shared} label="shared secret" big ok />
              </Show>
            </Column>
          </div>
          <p className="mt-4 text-[1.05rem] leading-snug text-muted">
            Real life: colours are huge numbers and “mixing” is elliptic-curve maths (<b className="text-fg">X25519</b>)
            — used by Signal, WhatsApp and every HTTPS site. Diffie &amp; Hellman, 1976 · Turing Award 2015.
          </p>
        </Reveal>
      </div>
    </Slide>
  );
}

function Column({ title, tone, children }: { title: ReactNode; tone: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-3xl border-2 bg-card/70 p-4", tone)}>
      <div className="font-display text-[1.35rem] font-bold">{title}</div>
      {children}
    </div>
  );
}

function Show({ when, children }: { when: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {when && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-3"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Blob({
  color,
  label,
  secret,
  big,
  small,
  ok,
  bad,
}: {
  color: string;
  label: string;
  secret?: boolean;
  big?: boolean;
  small?: boolean;
  ok?: boolean;
  bad?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        layout
        animate={{ backgroundColor: color }}
        className={cn(
          "relative rounded-full border-4 border-fg/15 shadow-lg",
          big ? "size-[4.6rem]" : small ? "size-[2.8rem]" : "size-[3.4rem]",
        )}
      >
        {secret && (
          <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-fg text-[0.8rem] text-bg">
            <LuLock />
          </span>
        )}
        {(ok || bad) && (
          <span
            className={cn(
              "absolute -right-2 -bottom-1 grid size-8 place-items-center rounded-full text-[1.1rem] text-white",
              ok ? "bg-good" : "bg-bad",
            )}
          >
            {ok ? <LuCheck /> : <LuX />}
          </span>
        )}
      </motion.div>
      <span
        className={cn(
          "text-center text-[0.95rem] leading-tight",
          ok ? "font-bold text-good" : bad ? "font-bold text-bad" : "text-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function Swatches({ options, value, onChange }: { options: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Pick colour ${c}`}
          style={{ backgroundColor: c }}
          className={cn("size-7 rounded-full border-2", c === value ? "scale-110 border-fg" : "border-transparent")}
        />
      ))}
    </div>
  );
}

function Travel({ color, dir }: { color: string; dir: 1 | -1 }) {
  return (
    <motion.span
      className="absolute top-0 size-5 rounded-full shadow"
      style={{ backgroundColor: color }}
      animate={{ left: dir > 0 ? ["-30%", "120%"] : ["120%", "-30%"], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: dir > 0 ? 0 : 0.8 }}
    />
  );
}
