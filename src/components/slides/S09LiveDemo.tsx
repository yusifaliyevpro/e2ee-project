"use client";

import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { LuCheck, LuKeyRound, LuRotateCcw, LuSend, LuServer, LuSmartphone } from "react-icons/lu";
import { toHex } from "@/lib/bytes";
import { cn } from "@/lib/cn";
import { seal } from "@/lib/e2ee";
import { avatarColor } from "@/lib/reactions";
import type { DeviceView, PresenterState } from "@/lib/room-types";
import { ClosedOverlay } from "../deck/ClosedOverlay";
import { useRoom } from "../deck/RoomProvider";
import { Slide } from "../deck/Slide";
import { Eyebrow, Hl, Reveal, ease } from "../deck/ui";
import { usePresenterIdentity } from "../deck/usePresenterIdentity";
import { Envelope } from "../visual/Envelope";
import { Padlock } from "../visual/Padlock";
import { useScramble } from "../visual/Scramble";

const ORDER = ["plain", "key", "encrypt", "wrap", "seal", "fly", "sent"] as const;
type Phase = (typeof ORDER)[number] | "idle" | "error";

const TIMELINE: [Phase, number][] = [
  ["key", 1100],
  ["encrypt", 2400],
  ["wrap", 3900],
  ["seal", 5500],
  ["fly", 7000],
  ["sent", 8000],
];

const STEP_LABELS = ["Plaintext", "Message key", "Encrypt", "Lock per phone", "Seal & send"];

const PRESETS = [
  "Hello from Technical English! 👋",
  "Only YOU can read this 🔐",
  "The server saw nothing 😎",
  "Thank you for listening! 💙",
];

type Run = { text: string; keyHex: string; ct: string; recipients: DeviceView[]; sentId: string | null };

export function S09LiveDemo() {
  const { state, joinUrl, refresh } = useRoom();
  const identity = usePresenterIdentity();
  const [text, setText] = useState(PRESETS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const devices = state?.devices ?? [];
  // Everyone in the room gets a key, even if their browser is in the background right now.
  // Phones that join after the send get nothing: the message was never locked for them.
  const online = devices.filter((d) => d.online);
  const busy = phase !== "idle" && phase !== "sent" && phase !== "error";

  const send = () => {
    const msg = text.trim();
    if (!identity || devices.length === 0 || !msg || busy) return;
    timers.current.forEach(clearTimeout);
    setError(null);

    const { envelope, messageKey } = seal(msg, devices, identity);
    setRun({ text: msg, keyHex: toHex(messageKey), ct: envelope.ct, recipients: devices, sentId: null });
    setPhase("plain");

    timers.current = TIMELINE.map(([p, at]) =>
      setTimeout(() => {
        setPhase(p);
        if (p === "fly") void upload();
      }, at),
    );

    async function upload() {
      try {
        const res = await fetch("/api/room/send", { method: "POST", body: JSON.stringify(envelope) });
        if (!res.ok) throw new Error(`Server said ${res.status}`);
        const { id } = (await res.json()) as { id: string };
        setRun((r) => (r ? { ...r, sentId: id } : r));
        void refresh();
      } catch (e) {
        timers.current.forEach(clearTimeout);
        setError(e instanceof Error ? e.message : "Upload failed");
        setPhase("error");
      }
    }
  };

  const reset = async () => {
    if (!confirm("Reset the room? All phones will re-join with new keys.")) return;
    await fetch("/api/room/reset", { method: "POST" });
    setRun(null);
    setPhase("idle");
    void refresh();
  };

  const acks = run?.sentId && state?.latest?.id === run.sentId ? state.latest.acks : [];

  return (
    <Slide id="live-demo" title="Live demo">
      <div className="grid grid-cols-[0.78fr_1.4fr] gap-8">
        <div className="flex flex-col">
          <Eyebrow index="07">Live demo</Eyebrow>
          <Reveal delay={0.05}>
            <h2 className="font-display text-[2.8rem] leading-[1.02] font-bold tracking-tight">
              Real E2EE, <Hl>on your phones</Hl>.
            </h2>
          </Reveal>

          <Reveal delay={0.12} className="mt-5 flex items-center gap-5 rounded-3xl border-2 border-line bg-card/80 p-4">
            <div className="relative shrink-0 rounded-2xl bg-white p-2.5 text-[1.4rem]">
              {joinUrl ? (
                <QRCodeSVG value={joinUrl} size={230} level="M" className="size-[13rem]" />
              ) : (
                <div className="size-[13rem]" />
              )}
              <ClosedOverlay />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-display text-[1.3rem] font-bold">
                <LuSmartphone className="text-accent" /> Scan to join
              </div>
              <div className="mt-1 font-mono text-[1rem] break-all text-accent">
                {joinUrl.replace(/^https?:\/\//, "")}
              </div>
              <div className="mt-3 text-[1rem] leading-snug text-muted">
                Your phone makes its own key pair. The private key never leaves it.
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2} className="mt-5 flex min-h-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-[1.25rem] font-bold">
                {devices.length} phone{devices.length === 1 ? "" : "s"} in the room
                {devices.length > online.length && (
                  <span className="ml-2 text-[1rem] font-normal text-muted">· {online.length} online now</span>
                )}
              </span>
              {run?.sentId && (
                <span className="font-mono text-[1.05rem] font-bold text-good">
                  decrypted {acks.length}/{run.recipients.length}
                </span>
              )}
            </div>
            <DeviceGrid devices={devices} acks={acks} />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-2xl border-2 border-line bg-card/80 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              maxLength={140}
              aria-label="Message to send"
              className="min-w-0 flex-1 rounded-xl border-2 border-line bg-bg px-4 py-2.5 text-[1.3rem] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || devices.length === 0 || !identity}
              className="flex items-center gap-2 rounded-xl bg-accent px-6 text-[1.25rem] font-bold text-bg transition-transform active:scale-95 disabled:opacity-40"
            >
              <LuSend /> Encrypt &amp; send
            </button>
          </div>
          <div className="-mt-1 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText(p)}
                className="rounded-full border border-line px-3 py-1 text-[0.95rem] text-muted transition-colors hover:border-accent hover:text-fg"
              >
                {p}
              </button>
            ))}
          </div>

          <Stage phase={phase} run={run} error={error} waiting={devices.length === 0} />

          <ServerView state={state} onReset={() => void reset()} />
        </Reveal>
      </div>
    </Slide>
  );
}

function DeviceGrid({ devices, acks }: { devices: DeviceView[]; acks: string[] }) {
  const shown = devices.slice(0, 40);
  return (
    <div className="mt-2 flex min-h-[7rem] flex-1 flex-wrap content-start gap-2 overflow-hidden rounded-2xl border-2 border-line bg-card/50 p-3">
      {devices.length === 0 && (
        <div className="m-auto text-center text-[1.05rem] text-muted">Waiting for the first phone…</div>
      )}
      <AnimatePresence>
        {shown.map((d) => {
          const done = acks.includes(d.id);
          return (
            <motion.div
              key={d.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              title={`${d.alias}${d.online ? "" : " (away)"}`}
              className={cn(
                "relative grid size-[3rem] place-items-center rounded-full border-[3px] text-[1.55rem] shadow-md transition-colors",
                done ? "border-good" : "border-card",
              )}
              style={{ backgroundColor: avatarColor(d.hue) }}
            >
              {/* Status dot instead of fading: backgrounded phones pause polling but are still in the room */}
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                  d.online ? "bg-good" : "bg-muted",
                )}
              />
              {d.emoji}
              <AnimatePresence>
                {done && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-good text-[0.75rem] text-white"
                  >
                    <LuCheck />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {devices.length > shown.length && (
        <div className="grid h-[2.9rem] place-items-center px-2 font-mono text-[1rem] text-muted">
          +{devices.length - shown.length}
        </div>
      )}
    </div>
  );
}

function Stage({
  phase,
  run,
  error,
  waiting,
}: {
  phase: Phase;
  run: Run | null;
  error: string | null;
  waiting: boolean;
}) {
  const pi = ORDER.findIndex((p) => p === phase);
  const stepIndex = Math.min(4, pi);
  // The last step only counts as done once the envelope has actually been sent
  const isDone = (i: number) => (i < 4 ? pi > i : phase === "sent");

  return (
    <div className="relative h-[21rem] overflow-hidden rounded-3xl border-2 border-line bg-card/60">
      <div className="flex border-b-2 border-line">
        {STEP_LABELS.map((l, i) => (
          <div
            key={l}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2 text-[0.95rem] font-semibold transition-colors duration-300",
              isDone(i) ? "text-good" : pi >= 0 && i === stepIndex ? "bg-accent/15 text-accent" : "text-muted",
            )}
          >
            <span className="font-mono">{isDone(i) ? "✓" : i + 1}</span> {l}
          </div>
        ))}
      </div>

      <div className="relative h-[calc(100%-2.6rem)]">
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              key="idle"
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center p-6 text-center text-[1.3rem] text-muted"
            >
              {waiting
                ? "Scan the QR code — then I'll send everyone a secret message."
                : "Type a message and press Encrypt & send."}
            </motion.div>
          )}

          {run && pi >= 0 && pi <= 3 && (
            <MessageCard key={`msg-${run.ct}`} run={run} encrypted={pi >= 2} compact={pi >= 3} />
          )}
          {run && pi >= 1 && pi <= 3 && <KeyCard key={`key-${run.ct}`} hex={run.keyHex} compact={pi >= 3} />}
          {run && pi === 3 && <Locks key={`locks-${run.ct}`} devices={run.recipients} />}
          {run && (phase === "seal" || phase === "fly") && (
            <SealingEnvelope key={`env-${run.ct}`} ct={run.ct} flying={phase === "fly"} />
          )}
          {run && phase === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 14 }}
                className="grid size-24 place-items-center rounded-full bg-good text-[3.2rem] text-bg"
              >
                <LuCheck />
              </motion.div>
              <div className="font-display text-[2rem] font-bold">
                Sent to {run.recipients.length} phone{run.recipients.length === 1 ? "" : "s"}
              </div>
              <div className="text-[1.25rem] text-muted">Look at your phones now 📱</div>
            </motion.div>
          )}
          {phase === "error" && (
            <motion.div
              key="error"
              className="absolute inset-0 grid place-items-center text-[1.3rem] font-semibold text-bad"
            >
              Upload failed: {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MessageCard({ run, encrypted, compact }: { run: Run; encrypted: boolean; compact: boolean }) {
  const ctText = run.ct.slice(0, Math.max(run.text.length, 24));
  const shown = useScramble(encrypted ? ctText : run.text, { play: encrypted, duration: 1.1, from: run.text });
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, x: 120, y: 40 }}
      transition={{ duration: 0.5, ease }}
      className={cn(
        "absolute left-6 max-w-[55%] rounded-2xl border-2 bg-card p-4 shadow-xl",
        compact ? "top-4" : "top-10",
        encrypted ? "border-iris" : "border-accent",
      )}
    >
      <div
        className={cn(
          "font-mono text-[0.85rem] font-bold tracking-widest uppercase",
          encrypted ? "text-iris" : "text-accent",
        )}
      >
        {encrypted ? "Ciphertext · AES-256-GCM" : "Plaintext"}
      </div>
      <div
        className={cn("mt-1 text-[1.45rem] leading-snug font-semibold break-all", encrypted && "font-mono text-iris")}
      >
        {encrypted ? shown : run.text}
      </div>
    </motion.div>
  );
}

function KeyCard({ hex, compact }: { hex: string; compact: boolean }) {
  const shown = useScramble(hex, { duration: 0.9, from: "0".repeat(64) });
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotate: 8 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.5, ease }}
      className={cn(
        "absolute right-6 w-[17rem] rounded-2xl border-2 border-gold bg-card p-4 shadow-xl",
        compact ? "top-4" : "top-10",
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[0.85rem] font-bold tracking-widest text-gold uppercase">
        <LuKeyRound /> Message key · 256 bit
      </div>
      <div className="mt-1 font-mono text-[0.95rem] leading-snug break-all text-gold">{shown}</div>
      <div className="mt-1 text-[0.85rem] text-muted">random, used once, never uploaded</div>
    </motion.div>
  );
}

function Locks({ devices }: { devices: DeviceView[] }) {
  const shown = devices.slice(0, 16);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="absolute inset-x-6 bottom-4"
    >
      <div className="mb-2 text-[1.05rem] text-muted">
        The message key is locked <Hl tone="good">separately for each phone</Hl> with its public key (X25519):
      </div>
      <div className="flex flex-wrap gap-2">
        {shown.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 400, damping: 18 }}
            className="flex items-center gap-1 rounded-full border-2 border-good/60 bg-good/10 py-0.5 pr-2 pl-1"
          >
            <span className="text-[1.2rem]">{d.emoji}</span>
            <Padlock locked className="w-3.5 text-good" />
          </motion.div>
        ))}
        {devices.length > shown.length && (
          <span className="self-center font-mono text-muted">+{devices.length - shown.length} more</span>
        )}
      </div>
    </motion.div>
  );
}

function SealingEnvelope({ ct, flying }: { ct: string; flying: boolean }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1000),
      setTimeout(() => setStage(3), 1500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  const lines = [ct.slice(0, 22), ct.slice(22, 44), ct.slice(44, 66), "…"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={
        flying
          ? { opacity: [1, 1, 0], x: [0, 60, 620], y: [0, 20, -420], rotate: [0, -6, 18], scale: [1, 1.05, 0.35] }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0 }}
      transition={flying ? { duration: 1, ease: "easeIn", times: [0, 0.25, 1] } : { duration: 0.5, ease }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Envelope closed={stage >= 2} sealed={stage >= 3} letterOut={stage < 1} lines={lines} className="w-[13.5rem]" />
      {flying && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 size-2 rounded-full bg-accent"
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{ opacity: 0, x: -80 - ((i * 37) % 120), y: 40 + ((i * 53) % 80) }}
              transition={{ duration: 0.9, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function short(v: string, n = 26) {
  return v.length > n ? `${v.slice(0, n)}…` : v;
}

function ServerView({ state, onReset }: { state: PresenterState | null; onReset: () => void }) {
  const sv = state?.serverView;
  return (
    <div className="relative rounded-2xl border-2 border-line bg-bg/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[0.9rem] font-bold tracking-widest text-muted uppercase">
          <LuServer /> What the server stored
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[0.8rem] text-muted">store: {state?.backend ?? "…"}</span>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[0.85rem] text-muted hover:text-bad"
            title="Reset room"
          >
            <LuRotateCcw /> reset
          </button>
        </div>
      </div>
      <pre className="mt-2 h-[6.4rem] overflow-hidden font-mono text-[0.95rem] leading-snug">
        {sv ? (
          <>
            {"{ "}
            <K>ct</K>: <V>{short(sv.ct, 40)}</V>, <K>nonce</K>: <V>{sv.n}</V>,{"\n  "}
            <K>ephemeralKey</K>: <V>{short(sv.epk, 30)}</V>, <K>sig</K>: <V>{short(sv.sig, 18)}</V>,{"\n  "}
            <K>wraps</K>: {"{ "}
            {Object.entries(sv.wraps)
              .slice(0, 2)
              .map(([id, w]) => (
                <span key={id}>
                  <V>{id.slice(0, 6)}</V>: <V>{short(w.k, 14)}</V>,{" "}
                </span>
              ))}
            <span className="text-muted">…{Math.max(0, sv.wrapCount - 2)} more</span>
            {" } }"}
            {"\n"}
            <span className="font-sans font-semibold text-good">→ No plaintext. No message key. Nothing readable.</span>
          </>
        ) : (
          <span className="text-muted">Nothing yet.</span>
        )}
      </pre>
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="text-accent">{children}</span>;
}

function V({ children }: { children: React.ReactNode }) {
  return <span className="text-iris">&quot;{children}&quot;</span>;
}
