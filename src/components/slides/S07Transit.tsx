"use client";

import { AnimatePresence, motion } from "motion/react";
import { LuEye, LuEyeOff, LuMail, LuServer, LuSmartphone } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { PinnedSlide } from "../deck/Slide";
import { Eyebrow, Hl, TermCard, ease } from "../deck/ui";
import { AppIcon, BRANDS, type BrandKey } from "../visual/Brands";
import { Padlock } from "../visual/Padlock";

const COPY = [
  {
    tag: "Encryption in transit (TLS)",
    title: (
      <>
        Locked on the wire, <Hl tone="bad">open on the server</Hl>.
      </>
    ),
    body: "Your message is encrypted to the company's server — where it is decrypted, read, stored and scanned. Hackers, staff or a court order can reach it there.",
    apps: ["gmail", "telegram", "discord", "sms"] as BrandKey[],
    appsLabel: "Not end-to-end by default",
    term: "honest" as const,
  },
  {
    tag: "End-to-end encryption",
    title: (
      <>
        Locked from <Hl tone="good">your phone</Hl> to <Hl tone="good">theirs</Hl>.
      </>
    ),
    body: "The message is encrypted on your device and decrypted only on the recipient's device. The server just relays a blob it cannot read — it never has the key.",
    apps: ["signal", "whatsapp", "imessage", "protonmail"] as BrandKey[],
    appsLabel: "End-to-end by default",
    term: "endpoint" as const,
  },
];

export function S07Transit() {
  return (
    <PinnedSlide id="transit" title="In transit vs end-to-end" steps={2}>
      {(step) => {
        const c = COPY[step];
        return (
          <div className="grid grid-cols-[1fr_1.25fr] items-center gap-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease }}
              >
                <Eyebrow index="05">{c.tag}</Eyebrow>
                <h2 className="font-display text-[3.2rem] leading-[1.05] font-bold tracking-tight">{c.title}</h2>
                <p className="mt-5 text-[1.4rem] leading-snug text-muted">{c.body}</p>
                <div className="mt-6">
                  <div
                    className={cn(
                      "font-mono text-[0.95rem] tracking-widest uppercase",
                      step ? "text-good" : "text-bad",
                    )}
                  >
                    {c.appsLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {c.apps.map((a) => (
                      <div key={a} className="flex items-center gap-2">
                        <AppIcon brand={a} className="size-11" />
                        <span className="text-[1.1rem] font-semibold">
                          {a === "telegram" ? "Telegram*" : a === "discord" ? "Discord (text)" : BRANDS[a].name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {step === 0 && (
                    <div className="mt-2 text-[0.95rem] text-muted">* only “Secret Chats” are end-to-end encrypted</div>
                  )}
                </div>
                <div className="mt-6 max-w-[34rem]">
                  <TermCard k={c.term} delay={0.15} compact />
                </div>
              </motion.div>
            </AnimatePresence>

            <Diagram e2ee={step === 1} />
          </div>
        );
      }}
    </PinnedSlide>
  );
}

const LOOP = { duration: 4.2, repeat: Infinity, ease: "easeInOut" } as const;
const TIMES = [0, 0.32, 0.62, 1];

function Diagram({ e2ee }: { e2ee: boolean }) {
  return (
    <div className="relative h-[25rem] rounded-3xl border-2 border-line bg-card/60">
      {/* E2EE tunnel behind everything */}
      <motion.div
        className="absolute top-[9.2rem] right-[6%] left-[6%] h-[6.5rem] rounded-full border-2 border-dashed border-good bg-good/10"
        initial={false}
        animate={{ opacity: e2ee ? 1 : 0, scaleX: e2ee ? 1 : 0.6 }}
        transition={{ duration: 0.6, ease }}
      />
      <motion.div
        className="absolute top-[17.9rem] left-1/2 -translate-x-1/2 font-mono text-[1rem] font-bold tracking-widest text-good uppercase"
        initial={false}
        animate={{ opacity: e2ee ? 1 : 0 }}
      >
        end-to-end tunnel
      </motion.div>

      <div className="absolute top-[12.3rem] right-[14%] left-[14%] h-1 bg-line" />

      <Node className="top-[9.5rem] left-[5%]" label="Alice">
        <LuSmartphone />
      </Node>
      <Node className="top-[9.5rem] right-[5%]" label="Bob">
        <LuSmartphone />
      </Node>
      <Node className="top-[9.5rem] left-1/2 -translate-x-1/2" label="Company server" wide>
        <LuServer />
      </Node>

      {/* what the server can see */}
      <div className="absolute top-5 left-1/2 w-[19rem] -translate-x-1/2">
        <AnimatePresence mode="wait">
          <motion.div
            key={String(e2ee)}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-center shadow-xl",
              e2ee ? "border-good bg-card" : "border-bad bg-card",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center gap-2 font-mono text-[0.85rem] font-bold tracking-widest uppercase",
                e2ee ? "text-good" : "text-bad",
              )}
            >
              {e2ee ? <LuEyeOff /> : <LuEye />} server sees
            </div>
            <div className={cn("mt-1 truncate font-mono text-[1.25rem] font-bold", e2ee && "text-muted")}>
              {e2ee ? "q9#Vx2@Lk7!Hf0$Tz" : "“Gate code is 4921”"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* travelling packet */}
      <motion.div
        className="absolute top-[10.3rem] -translate-x-1/2"
        animate={{ left: ["14%", "50%", "50%", "86%"] }}
        transition={{ ...LOOP, times: TIMES }}
      >
        <div className="relative grid size-[3.6rem] place-items-center rounded-xl border-2 border-fg/30 bg-bg text-[1.8rem] shadow-xl">
          <LuMail />
          <span className="absolute -top-3 -right-3 w-7">
            {e2ee ? <Padlock locked className="text-good" /> : <TlsLock />}
          </span>
        </div>
      </motion.div>

      <div className="absolute bottom-5 left-0 grid w-full grid-cols-2 px-[8%] text-center font-mono text-[0.95rem] text-muted">
        <span>🔒 TLS on the wire</span>
        <span>🔒 TLS on the wire</span>
      </div>
    </div>
  );
}

/** Lock that pops open while the packet sits on the server. */
function TlsLock() {
  const open = [0, 0, 1, 1, 0];
  const times = [0, 0.3, 0.34, 0.6, 0.64];
  return (
    <span className="relative block">
      <motion.span className="block" animate={{ opacity: open.map((o) => 1 - o) }} transition={{ ...LOOP, times }}>
        <Padlock locked className="text-good" />
      </motion.span>
      <motion.span className="absolute inset-0 block" animate={{ opacity: open }} transition={{ ...LOOP, times }}>
        <Padlock locked={false} className="text-bad" />
      </motion.span>
    </span>
  );
}

function Node({
  className,
  label,
  wide,
  children,
}: {
  className: string;
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("absolute flex flex-col items-center", className)}>
      <div
        className={cn(
          "grid h-[5.6rem] place-items-center rounded-2xl border-2 border-line bg-card text-[2.6rem]",
          wide ? "w-[7rem]" : "w-[5rem]",
        )}
      >
        {children}
      </div>
      <div className="mt-2 font-display text-[1.2rem] font-bold whitespace-nowrap">{label}</div>
    </div>
  );
}
