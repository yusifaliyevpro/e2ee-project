"use client";

import { motion } from "motion/react";
import { LuGraduationCap, LuMessageCircleQuestion, LuMic } from "react-icons/lu";
import { Slide } from "../deck/Slide";
import { Reveal, ease } from "../deck/ui";
import { Padlock } from "../visual/Padlock";
import { Scramble } from "../visual/Scramble";

export function S16Thanks() {
  return (
    <Slide id="thanks" title="Thank you">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          className="grid size-[7rem] place-items-center rounded-full border-4 border-good/60 bg-good/15 text-good"
        >
          <Padlock locked className="w-[3.2rem]" />
        </motion.div>

        <h2 className="mt-8 font-display text-[6.5rem] leading-none font-bold tracking-tight">
          <Scramble
            text="Thank you!"
            duration={1.4}
            className="bg-linear-to-r from-accent to-iris bg-clip-text text-transparent"
          />
        </h2>

        <Reveal delay={0.4}>
          <p className="mt-8 max-w-[60rem] text-[1.8rem] leading-snug text-balance text-muted">
            Your messages should be read by the people you send them to.{" "}
            <span className="font-semibold text-fg">Nobody else.</span>
          </p>
        </Reveal>

        <Reveal delay={0.6} className="mt-10 flex items-center gap-3 text-[2.2rem] font-bold">
          <LuMessageCircleQuestion className="text-accent" /> Questions?
        </Reveal>

        <Reveal delay={0.8} className="mt-10 flex gap-4">
          <Badge icon={<LuMic />} caption="Presented by" name="Yusif Aliyev" />
          <Badge icon={<LuGraduationCap />} caption="Instructor" name="Leyla Dadaşova" />
        </Reveal>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8, ease }}
          className="mt-10 max-w-[80rem] text-[0.85rem] leading-relaxed text-muted"
        >
          Sources: Signal blog — PQXDH (2023) &amp; SPQR / Triple Ratchet (2025) · CISA Mobile Communications Best
          Practice Guidance (Dec 2024) · Apple, Advanced Data Protection · Proton, zero-access encryption · NIST FIPS
          197 (AES) &amp; FIPS 203 (ML-KEM) · Diffie &amp; Hellman, “New Directions in Cryptography” (1976)
        </motion.p>
      </div>
    </Slide>
  );
}

function Badge({ icon, caption, name }: { icon: React.ReactNode; caption: string; name: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-line bg-card/70 px-5 py-3 text-left">
      <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-[1.4rem] text-accent">{icon}</span>
      <div>
        <div className="font-mono text-[0.8rem] tracking-widest text-muted uppercase">{caption}</div>
        <div className="font-display text-[1.4rem] font-bold">{name}</div>
      </div>
    </div>
  );
}
