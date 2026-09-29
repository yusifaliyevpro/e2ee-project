"use client";

import type { IconType } from "react-icons";
import { LuBug, LuCamera, LuCloudUpload, LuNetwork } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { Slide } from "../deck/Slide";
import { Eyebrow, Heading, Hl, Reveal, TermCard } from "../deck/ui";

type Limit = { Icon: IconType; title: string; text: React.ReactNode; fix: string; tone: string };

const LIMITS: Limit[] = [
  {
    Icon: LuNetwork,
    title: "Metadata",
    text: (
      <>
        Who you talk to, when, how often, from where. E2EE hides the <i>letter</i>, not the <i>envelope</i>.
        <span className="mt-2 block border-l-4 border-warn/60 pl-3 italic">
          “We kill people based on metadata.”
          <span className="text-muted not-italic"> — Gen. Michael Hayden, ex-NSA &amp; CIA director, 2014</span>
        </span>
      </>
    ),
    fix: "Signal's “sealed sender” hides even who sent a message.",
    tone: "text-warn border-warn/60",
  },
  {
    Icon: LuBug,
    title: "Your device",
    text: (
      <>
        Spyware reads messages <Hl tone="bad">after</Hl> they are decrypted. Pegasus infected iPhones through iMessage
        without a single tap.
      </>
    ),
    fix: "Update your phone. Enable Lockdown Mode if you're a target.",
    tone: "text-bad border-bad/60",
  },
  {
    Icon: LuCloudUpload,
    title: "Backups",
    text: <>A cloud backup that isn't end-to-end encrypted is a readable copy of all your chats.</>,
    fix: "WhatsApp: turn on E2EE backup · iPhone: Advanced Data Protection.",
    tone: "text-iris border-iris/60",
  },
  {
    Icon: LuCamera,
    title: "The other person",
    text: <>Screenshots, forwarding, a friend who talks. Encryption can't fix trust.</>,
    fix: "Use disappearing messages for sensitive chats.",
    tone: "text-accent border-accent/60",
  },
];

export function S12Limits() {
  return (
    <Slide id="limits" title="What E2EE can't do">
      <div className="grid grid-cols-[1fr_22rem] items-end gap-10">
        <div>
          <Eyebrow index="10">Limits</Eyebrow>
          <Heading>
            E2EE protects the <Hl>words</Hl> — not everything.
          </Heading>
        </div>
        <TermCard k="zeroclick" delay={0.2} compact />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5">
        {LIMITS.map((l, i) => (
          <Reveal
            key={l.title}
            delay={0.15 + i * 0.1}
            className="flex gap-5 rounded-3xl border-2 border-line bg-card/70 p-6"
          >
            <div className={cn("grid size-16 shrink-0 place-items-center rounded-2xl border-2 text-[2rem]", l.tone)}>
              <l.Icon />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[1.7rem] font-bold">{l.title}</div>
              <div className="mt-1 text-[1.2rem] leading-snug text-muted">{l.text}</div>
              <div className="mt-3 text-[1.08rem] font-semibold text-good">→ {l.fix}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Slide>
  );
}
