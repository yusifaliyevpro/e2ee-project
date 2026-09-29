"use client";

import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { LuChevronsDown, LuGraduationCap, LuMic, LuSmartphone } from "react-icons/lu";
import { useRoom } from "../deck/RoomProvider";
import { Slide } from "../deck/Slide";
import { Reveal, ease } from "../deck/ui";
import { Padlock } from "../visual/Padlock";
import { Scramble, randomChars } from "../visual/Scramble";

export function S01Title() {
  return (
    <Slide id="title" title="End-to-End Encryption">
      <div className="grid grid-cols-[1.25fr_1fr] items-center gap-12">
        <div>
          <Reveal y={12} className="font-mono text-[1.05rem] font-semibold tracking-[0.25em] text-accent uppercase">
            Technical English · Cybersecurity
          </Reveal>
          <h1 className="mt-6 font-display text-[6.2rem] leading-[0.95] font-bold tracking-tight">
            <Scramble text="End-to-End" duration={1.1} className="block" />
            <span className="block bg-linear-to-r from-accent to-iris bg-clip-text pb-2 text-transparent">
              <Scramble text="Encryption" duration={1.3} delay={0.3} />
            </span>
          </h1>
          <Reveal delay={0.5}>
            <p className="mt-6 max-w-[40rem] text-[1.7rem] leading-snug text-muted">
              How it works, why it exists, and why <span className="font-semibold text-fg">you</span> should use it.
            </p>
          </Reveal>

          <div className="mt-12 flex flex-wrap gap-4">
            <Person delay={0.7} icon={<LuMic />} caption="Presented by" name="Yusif Aliyev" />
            <Person delay={0.85} icon={<LuGraduationCap />} caption="Instructor" name="Leyla Dadaşova" />
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-8">
          <VaultDial />
          <JoinBadge />
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-[4vh] left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-[0.95rem] text-muted"
      >
        <LuChevronsDown className="size-5" /> scroll or press ↓
      </motion.div>
    </Slide>
  );
}

function Person({
  icon,
  caption,
  name,
  delay,
}: {
  icon: React.ReactNode;
  caption: string;
  name: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="flex items-center gap-4 rounded-2xl border-2 border-line bg-card/70 px-5 py-4">
        <span className="grid size-12 place-items-center rounded-xl bg-accent/15 text-[1.5rem] text-accent">
          {icon}
        </span>
        <div>
          <div className="font-mono text-[0.85rem] tracking-widest text-muted uppercase">{caption}</div>
          <div className="font-display text-[1.6rem] font-bold">{name}</div>
        </div>
      </div>
    </Reveal>
  );
}

function useRotatingHex() {
  const [hex, setHex] = useState("7f3a9c0e41d8b25f6a7e09c3d1f4b8a2e5c7091f3d6b8a4c2e0f7a9b1d3c5e7f0a1b");
  useEffect(() => {
    const id = setInterval(() => setHex(randomChars(68, "0123456789abcdef")), 1400);
    return () => clearInterval(id);
  }, []);
  return hex;
}

function VaultDial() {
  const hex = useRotatingHex();
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease }}
      className="relative aspect-square w-[27rem]"
    >
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 text-line"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 72 }, (_, i) => (
          <line
            key={i}
            x1="200"
            y1="8"
            x2="200"
            y2={i % 6 === 0 ? 30 : 20}
            stroke="currentColor"
            strokeWidth={i % 6 === 0 ? 4 : 2}
            transform={`rotate(${i * 5} 200 200)`}
          />
        ))}
      </motion.svg>

      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 text-accent"
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path id="hexRing" d="M200,200 m-140,0 a140,140 0 1,1 280,0 a140,140 0 1,1 -280,0" />
        </defs>
        <text className="font-mono" fontSize="17" fill="currentColor" letterSpacing="2.5" opacity="0.85">
          <textPath href="#hexRing">{hex}</textPath>
        </text>
        <circle cx="200" cy="200" r="118" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 10" />
      </motion.svg>

      <div className="absolute inset-[27%] grid place-items-center rounded-full">
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20 blur-2xl"
          animate={{ opacity: locked ? [0.5, 1, 0.5] : 0.2 }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <div className="relative grid size-full place-items-center rounded-full border-4 border-accent/60 bg-card">
          <Padlock locked={locked} className="w-[42%] text-accent" />
        </div>
      </div>
    </motion.div>
  );
}

function JoinBadge() {
  const { joinUrl, state } = useRoom();
  const online = state?.devices.filter((d) => d.online).length ?? 0;
  return (
    <Reveal delay={1} className="flex items-center gap-5 rounded-2xl border-2 border-line bg-card/80 p-4 pr-6">
      <div className="rounded-xl bg-white p-2">
        {joinUrl ? <QRCodeSVG value={joinUrl} size={112} level="M" /> : <div className="size-[112px]" />}
      </div>
      <div>
        <div className="flex items-center gap-2 font-display text-[1.35rem] font-bold">
          <LuSmartphone className="text-accent" /> Grab your phone
        </div>
        <div className="mt-1 max-w-[16rem] text-[1rem] leading-snug text-muted">
          Scan to join the live E2EE demo later in this talk.
        </div>
        <div className="mt-2 font-mono text-[1rem] font-semibold text-good">
          <motion.span key={online} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block">
            {online}
          </motion.span>{" "}
          device{online === 1 ? "" : "s"} connected
        </div>
      </div>
    </Reveal>
  );
}
