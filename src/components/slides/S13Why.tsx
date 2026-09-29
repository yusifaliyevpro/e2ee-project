"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuLandmark, LuLockKeyhole, LuPlay, LuSquare, LuTrash2, LuVote } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { useRoom } from "../deck/RoomProvider";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";

const EVENTS = [
  {
    year: "1976",
    title: "Public-key crypto is born",
    text: "Diffie & Hellman publish “New Directions in Cryptography”.",
  },
  {
    year: "1991",
    title: "PGP",
    text: "Phil Zimmermann releases Pretty Good Privacy — strong encryption for everyone.",
  },
  { year: "2013", title: "Snowden", text: "Leaked files reveal mass-surveillance programs such as PRISM." },
  {
    year: "2016",
    title: "WhatsApp flips the switch",
    text: "E2EE by default for over a billion people (Signal Protocol).",
  },
  { year: "2021", title: "Pegasus Project", text: "Zero-click spyware found on journalists' and activists' phones." },
  { year: "2023", title: "Post-quantum begins", text: "Signal ships PQXDH. Messenger turns on default E2EE." },
  {
    year: "2024",
    title: "Salt Typhoon",
    text: "Hackers breach US telecoms — even wiretap systems. FBI & CISA: “use E2EE apps”.",
  },
  {
    year: "2025",
    title: "Backdoor battles",
    text: "Apple pulls iCloud ADP in the UK rather than add a backdoor. Signal adds SPQR.",
  },
];

const POLL = {
  question: "Should governments be able to read end-to-end encrypted messages?",
  options: ["Yes — safety first", "Only with a court warrant", "No — privacy first"],
};

export function S13Why() {
  return (
    <PinnedSlide id="why-e2ee" title="Why E2EE exists" steps={2}>
      {(step) => (
        <AnimatePresence mode="wait">
          {step === 0 ? <Timeline key="timeline" /> : <Debate key="debate" />}
        </AnimatePresence>
      )}
    </PinnedSlide>
  );
}

function Timeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="grid grid-cols-[1fr_24rem] items-end gap-10">
        <div>
          <Eyebrow index="11">Why we have it</Eyebrow>
          <h2 className="font-display text-[3.2rem] leading-[1.05] font-bold tracking-tight">
            50 years of <Hl>breaches</Hl>, <Hl tone="bad">spying</Hl> — and a fight back.
          </h2>
        </div>
        <TermCard k="hndl" delay={0.1} compact />
      </div>

      <div className="relative mt-10">
        <motion.div
          className="absolute top-[14.125rem] right-0 left-0 h-1 origin-left -translate-y-1/2 rounded-full bg-linear-to-r from-accent to-iris"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease }}
        />
        <div className="grid grid-cols-8 gap-3">
          {EVENTS.map((e, i) => {
            const up = i % 2 === 0;
            const card = (
              <div className="rounded-2xl border-2 border-line bg-card/85 p-3">
                <div className="font-mono text-[1.35rem] font-bold text-accent">{e.year}</div>
                <div className="font-display text-[1.1rem] leading-tight font-bold">{e.title}</div>
                <div className="mt-1 text-[0.95rem] leading-snug text-muted">{e.text}</div>
              </div>
            );
            return (
              <motion.div
                key={e.year}
                initial={{ opacity: 0, y: up ? -30 : 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease }}
                className="flex flex-col items-center"
              >
                <div className="flex h-[13.5rem] w-full flex-col justify-end pb-4">{up && card}</div>
                <span className="relative z-10 size-5 rounded-full border-4 border-accent bg-bg" />
                <div className="h-[13.5rem] w-full pt-4">{!up && card}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function Debate() {
  const { state, refresh } = useRoom();
  const poll = state?.poll;

  const act = async (body: object) => {
    await fetch("/api/room/poll", { method: "POST", body: JSON.stringify(body) });
    void refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease }}
    >
      <Eyebrow index="11">The big debate</Eyebrow>
      <h2 className="font-display text-[3.2rem] leading-[1.05] font-bold tracking-tight">
        Should there be a <Hl tone="warn">backdoor</Hl>?
      </h2>

      <div className="mt-8 grid grid-cols-[1fr_1fr_1.1fr] gap-5">
        <Side
          icon={<LuLandmark />}
          title="Governments"
          tone="border-warn/60 text-warn"
          points={[
            "“Going dark”: criminals and terrorists hide behind encryption (FBI Director James Comey, 2014).",
            "Want exceptional access or client-side scanning — e.g. the EU's “Chat Control” proposal and the UK Online Safety Act.",
            "Child-protection and serious-crime investigations need evidence.",
          ]}
          quote="Their ask: “lawful access” to encrypted data, with safeguards."
        />
        <Side
          icon={<LuLockKeyhole />}
          title="Cryptographers"
          tone="border-good/60 text-good"
          points={[
            "Maths can't tell good guys from bad guys.",
            "A backdoor for police is a backdoor for hackers — Salt Typhoon broke into the wiretap systems themselves.",
            "The 1993 “Clipper Chip” (government key escrow) was found to be flawed in 1994.",
          ]}
          quote="“You can't have a backdoor that's only for the good guys.” — Tim Cook, Apple, 2015"
        />
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-3xl border-2 border-accent bg-card/80 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[0.9rem] font-bold tracking-widest text-accent uppercase">
                <LuVote /> Live poll · your phones
              </span>
              <span className="font-mono text-[0.95rem] text-muted">{poll?.total ?? 0} votes</span>
            </div>
            <div className="mt-2 text-[1.2rem] leading-snug font-semibold">{POLL.question}</div>
            <div className="mt-3 space-y-2.5">
              {POLL.options.map((o, i) => {
                const count = poll?.counts[i] ?? 0;
                const pct = poll && poll.total > 0 ? (count / poll.total) * 100 : 0;
                return (
                  <div key={o} className="relative overflow-hidden rounded-xl border-2 border-line">
                    <motion.div
                      className={cn("absolute inset-y-0 left-0", ["bg-warn/30", "bg-accent/30", "bg-good/30"][i])}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                    <div className="relative flex justify-between px-3 py-2 text-[1.05rem] font-semibold">
                      <span>{o}</span>
                      <span className="font-mono tabular-nums">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              {!poll || poll.question !== POLL.question ? (
                <PollButton onClick={() => void act(POLL)} icon={<LuPlay />} label="Start poll" primary />
              ) : poll.open ? (
                <PollButton onClick={() => void act({ action: "close" })} icon={<LuSquare />} label="Close poll" />
              ) : (
                <PollButton onClick={() => void act(POLL)} icon={<LuPlay />} label="Restart" />
              )}
              {poll && <PollButton onClick={() => void act({ action: "clear" })} icon={<LuTrash2 />} label="Clear" />}
            </div>
          </div>
          <TermCard k="exceptional" delay={0.1} compact />
        </div>
      </div>
    </motion.div>
  );
}

function Side({
  icon,
  title,
  tone,
  points,
  quote,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  points: string[];
  quote: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-3xl border-2 bg-card/70 p-6", tone)}>
      <div className="flex items-center gap-3">
        <span className="text-[2rem]">{icon}</span>
        <span className="font-display text-[1.7rem] font-bold text-fg">{title}</span>
      </div>
      <ul className="mt-4 space-y-3.5 text-[1.2rem] leading-snug text-fg">
        {points.map((p) => (
          <li key={p} className="flex gap-3">
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-current" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto border-l-4 border-current pt-4 pl-4 text-[1.15rem] leading-snug font-semibold italic">
        {quote}
      </p>
    </div>
  );
}

function PollButton({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.95rem] font-bold",
        primary ? "bg-accent text-bg" : "border-2 border-line text-muted hover:text-fg",
      )}
    >
      {icon} {label}
    </button>
  );
}
