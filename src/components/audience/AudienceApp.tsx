"use client";

import { x25519 } from "@noble/curves/ed25519.js";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LuBookOpen, LuDoorClosed, LuInbox, LuMoon, LuShieldAlert, LuShieldCheck, LuSun, LuVote } from "react-icons/lu";
import { fromB64, fromHex, toB64, toHex } from "@/lib/bytes";
import { cn } from "@/lib/cn";
import { type KeyPair, type OpenResult, open, safetyNumber } from "@/lib/e2ee";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { avatarColor } from "@/lib/reactions";
import type { DeliveredMessage, Device, InboxResponse } from "@/lib/room-types";
import { toggleTheme, useTheme } from "@/lib/theme";
import { Glossary } from "./Glossary";
import { PollSheet } from "./PollSheet";
import { ReactionBar } from "./ReactionBar";
import { Receive } from "./Receive";

type Stored = { id: string | null; sk: string };
type Inbox = Extract<InboxResponse, { status: "ok" }>;

export type Received = {
  msg: DeliveredMessage;
  result: OpenResult | null;
  error: string | null;
  trust: "new" | "same" | "changed";
};

const STORE_KEY = "e2ee:device";
const PIN_KEY = "e2ee:pinned-sender";

type HistoryItem = { id: string; text: string; at: number };

// Kept on the phone so a refresh shows what it already decrypted instead of fetching it again
const historyStore = createLocalStore<HistoryItem[]>("e2ee:history", []);
// Presenter's reaction key, stored only after it arrived in a message whose signature checked out
const replyKeyStore = createLocalStore<string | null>("e2ee:reply-key", null);

function loadKeys(): { keys: KeyPair; id: string | null } {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s: Stored = JSON.parse(raw);
      const secretKey = fromHex(s.sk);
      return { keys: { secretKey, publicKey: x25519.getPublicKey(secretKey) }, id: s.id };
    }
  } catch {}
  const secretKey = x25519.utils.randomSecretKey();
  const keys = { secretKey, publicKey: x25519.getPublicKey(secretKey) };
  saveKeys(keys, null);
  return { keys, id: null };
}

function saveKeys(keys: KeyPair, id: string | null) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ id, sk: toHex(keys.secretKey) } satisfies Stored));
  } catch {}
}

let deviceCache: { keys: KeyPair; id: string | null } | null = null;
let fingerprintCache: string[] | null = null;
const getDevice = () => (deviceCache ??= loadKeys());
const noopSubscribe = () => () => {};

function useFingerprint() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (fingerprintCache ??= safetyNumber(getDevice().keys.publicKey, 4)),
    () => null,
  );
}

function checkTrust(spk: string): Received["trust"] {
  try {
    const pinned = localStorage.getItem(PIN_KEY);
    if (!pinned) {
      localStorage.setItem(PIN_KEY, spk);
      return "new";
    }
    return pinned === spk ? "same" : "changed";
  } catch {
    return "new";
  }
}

export function AudienceApp() {
  const theme = useTheme();
  const [me, setMe] = useState<Device | null>(null);
  const fingerprint = useFingerprint() ?? [];
  const [conn, setConn] = useState<"connecting" | "online" | "offline" | "closed">("connecting");
  const [current, setCurrent] = useState<Received | null>(null);
  const history = useLocalStore(historyStore);
  const replyKey = useLocalStore(replyKeyStore);
  const [missed, setMissed] = useState(false);
  const [poll, setPoll] = useState<Inbox["poll"]>(null);
  const [tab, setTab] = useState<"inbox" | "glossary">("inbox");
  const keysRef = useRef<KeyPair | null>(null);
  const idRef = useRef<string | null>(null);
  const lastMsg = useRef<string | null>(null);
  const registered = useRef(false);

  const joining = useRef<Promise<boolean> | null>(null);

  // Deduplicated: overlapping polls (or StrictMode's double effect) must not register twice.
  // Resolves false while the presenter has joining closed.
  const register = useCallback(() => {
    joining.current ??= (async () => {
      const keys = keysRef.current!;
      const res = await fetch("/api/room/join", {
        method: "POST",
        body: JSON.stringify({ publicKey: toB64(keys.publicKey), id: idRef.current }),
      });
      if (res.status === 403) {
        setConn("closed");
        return false;
      }
      if (!res.ok) throw new Error(`join failed ${res.status}`);
      const device: Device = await res.json();
      idRef.current = device.id;
      registered.current = true;
      saveKeys(keys, device.id);
      setMe(device);
      return true;
    })().finally(() => {
      joining.current = null;
    });
    return joining.current;
  }, []);

  const handleMessage = useCallback((msg: DeliveredMessage) => {
    lastMsg.current = msg.id;
    setMissed(false);
    let result: OpenResult | null = null;
    let error: string | null = null;
    try {
      result = open(msg, keysRef.current!);
      if (!result.signatureValid) error = "Signature invalid — this message may be forged!";
    } catch {
      error = "Could not decrypt: this message was not locked for your key.";
    }
    setCurrent({ msg, result, error, trust: checkTrust(msg.spk) });
    try {
      if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([90, 60, 90]);
    } catch {}
  }, []);

  useEffect(() => {
    const { keys, id } = getDevice();
    keysRef.current = keys;
    idRef.current = id;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const loop = async () => {
      let delay = 1200;
      try {
        if (!registered.current && !(await register())) {
          // Room closed: ask again shortly, and join the moment the presenter opens it
          if (alive) timer = setTimeout(loop, 3000);
          return;
        }
        const params = new URLSearchParams({ id: idRef.current! });
        if (lastMsg.current) params.set("after", lastMsg.current);
        const res = await fetch(`/api/room/inbox?${params}`, { cache: "no-store" });
        const data: InboxResponse = await res.json();
        if (data.status === "unknown") {
          // Room was reset: re-join with the same key pair and id
          registered.current = false;
          await register();
        } else {
          setConn("online");
          setPoll(data.poll);
          if (data.message && data.message.id !== lastMsg.current) handleMessage(data.message);
          else if (data.missed && data.missed !== lastMsg.current) setMissed(true);
          // The server has settled this message for us (delivered, not ours, or too old): stop re-checking it
          if (!data.message && data.cursor) lastMsg.current = data.cursor;
        }
      } catch {
        setConn("offline");
        delay = 3000;
      }
      if (alive) timer = setTimeout(loop, delay);
    };
    void loop();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [register, handleMessage]);

  // Keep the screen awake while waiting for the message
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if (document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen");
      } catch {}
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, []);

  const onRevealed = useCallback((r: Received) => {
    if (!r.result || !idRef.current) return;
    const plaintext = r.result.plaintext;
    if (r.result.signatureValid) replyKeyStore.set(() => r.msg.rpk);
    historyStore.set((h) =>
      h.some((x) => x.id === r.msg.id) ? h : [{ id: r.msg.id, text: plaintext, at: Date.now() }, ...h].slice(0, 20),
    );
    void fetch("/api/room/ack", { method: "POST", body: JSON.stringify({ id: idRef.current, messageId: r.msg.id }) });
  }, []);

  const earlier = history.filter((h) => h.id !== current?.msg.id);

  return (
    <div className="flex min-h-svh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/80 px-4 py-3 backdrop-blur">
        <div
          className="grid size-11 place-items-center rounded-full text-[1.5rem]"
          style={{ backgroundColor: me ? avatarColor(me.hue) : undefined }}
        >
          {me?.emoji ?? "…"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">
            {me?.alias ?? (conn === "closed" ? "Not in the room yet" : "Generating keys…")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className={cn(
                "size-2 rounded-full",
                conn === "online"
                  ? "bg-good"
                  : conn === "offline"
                    ? "bg-bad"
                    : conn === "closed"
                      ? "bg-warn"
                      : "animate-pulse bg-warn",
              )}
            />
            {conn === "online"
              ? "Connected · end-to-end encrypted"
              : conn === "offline"
                ? "Reconnecting…"
                : conn === "closed"
                  ? "Room closed · you'll join automatically"
                  : "Connecting…"}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid size-9 place-items-center rounded-lg border border-line text-muted"
        >
          {theme === "dark" ? <LuSun /> : <LuMoon />}
        </button>
      </header>

      <main className={cn("flex flex-1 flex-col px-4 pt-4", replyKey && tab === "inbox" ? "pb-48" : "pb-24")}>
        {tab === "inbox" ? (
          <>
            <AnimatePresence mode="wait">
              {current ? (
                <Receive key={current.msg.id} received={current} onRevealed={onRevealed} />
              ) : !me && conn === "closed" ? (
                <Closed key="closed" />
              ) : (
                <Waiting key="waiting" fingerprint={fingerprint} again={history.length > 0} />
              )}
            </AnimatePresence>

            {missed && (
              <div className="mt-4 rounded-2xl border-2 border-warn/60 bg-warn/10 p-3 text-sm text-warn">
                A message was sent just before your phone joined. It was locked only for the phones already in the room
                — so you <b>can't</b> read it. That's E2EE working! Wait for the next one.
              </div>
            )}

            {earlier.length > 0 && (
              <section className="mt-6">
                <h3 className="mb-2 text-xs font-bold tracking-widest text-muted uppercase">Earlier messages</h3>
                <ul className="space-y-2">
                  {earlier.map((m) => (
                    <li key={m.id} className="rounded-xl border border-line bg-card px-3 py-2 text-sm">
                      {m.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {current && history.some((h) => h.id === current.msg.id) && <TrustNote received={current} />}
          </>
        ) : (
          <Glossary />
        )}
      </main>

      {replyKey && me && tab === "inbox" && <ReactionBar deviceId={me.id} replyKey={replyKey} />}

      {poll && poll.open && poll.myVote === null && me && (
        <PollSheet poll={poll} deviceId={me.id} onVoted={(option) => setPoll({ ...poll, myVote: option })} />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} icon={<LuInbox />} label="Inbox" />
        <TabButton
          active={tab === "glossary"}
          onClick={() => setTab("glossary")}
          icon={<LuBookOpen />}
          label="New terms"
        />
      </nav>
      {poll?.open && poll.myVote !== null && (
        <div className="fixed right-3 bottom-20 z-20 flex items-center gap-2 rounded-full bg-good px-3 py-1.5 text-sm font-bold text-bg shadow-lg">
          <LuVote /> Vote counted
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold",
        active ? "text-accent" : "text-muted",
      )}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  );
}

function Closed() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <div className="grid size-24 place-items-center rounded-full border-2 border-warn/60 bg-warn/10 text-5xl text-warn">
        <LuDoorClosed />
      </div>
      <h1 className="mt-6 text-2xl font-bold">The room is closed right now</h1>
      <p className="mt-2 max-w-xs text-[0.95rem] text-muted">
        Yusif opens it during the presentation. Keep this page open — you'll join automatically.
      </p>
    </motion.div>
  );
}

function Waiting({ fingerprint, again }: { fingerprint: string[]; again: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-1 flex-col items-center justify-center text-center"
    >
      <div className="relative grid size-52 place-items-center">
        {[0, 1, 2].map((i) => (
          // Rings are born at the badge's edge while invisible, so they never flash over its border
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-accent"
            initial={{ scale: 0.47, opacity: 0 }}
            animate={{ scale: [0.47, 1.1], opacity: [0, 0.6, 0] }}
            transition={{
              scale: { duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" },
              opacity: { duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut", times: [0, 0.2, 1] },
            }}
          />
        ))}
        <div
          className="relative grid size-24 place-items-center rounded-full border-2 border-accent/50 text-5xl text-accent"
          style={{ backgroundColor: "color-mix(in oklab, var(--accent) 15%, var(--bg))" }}
        >
          <LuShieldCheck />
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold">
        {again ? "Waiting for the next message…" : "Waiting for Yusif's message…"}
      </h1>
      <p className="mt-2 max-w-xs text-[0.95rem] text-muted">
        {again ? "Your" : "Your phone just generated its own"} <b className="text-fg">private key</b>{" "}
        {again ? "is still on this phone" : "and it never leaves this device"} — not even the server has it.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-card px-4 py-3">
        <div className="text-[0.7rem] font-bold tracking-widest text-muted uppercase">Your key fingerprint</div>
        <div className="mt-1 font-mono text-lg tracking-wider text-accent">{fingerprint.join(" ") || "…"}</div>
      </div>
    </motion.div>
  );
}

function TrustNote({ received }: { received: Received | null }) {
  if (!received?.result) return null;
  const safety = safetyNumber(fromB64(received.msg.spk));
  const changed = received.trust === "changed";
  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border-2 p-3 text-sm",
        changed ? "border-bad bg-bad/10 text-bad" : "border-line bg-card",
      )}
    >
      <div className="flex items-center gap-2 font-bold">
        {changed ? <LuShieldAlert /> : <LuShieldCheck className="text-good" />}
        {changed ? "Warning: the sender's key has changed!" : "Sender's safety number"}
      </div>
      <div className="mt-1 font-mono text-base tracking-wider">{safety.join(" ")}</div>
      <div className="mt-1 text-xs text-muted">
        {received.trust === "new"
          ? "First time we see this key — trusted on first use (TOFU). Compare it with the number on the projector!"
          : changed
            ? "Someone may be in the middle. Verify out-of-band before trusting."
            : "Same key as before ✓"}
      </div>
    </div>
  );
}
