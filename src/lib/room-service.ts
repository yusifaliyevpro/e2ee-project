import type { NextRequest } from "next/server";
import { aliasFor } from "./aliases";
import { SESSION_COOKIE, isValidSession } from "./auth";
import { isB64 } from "./bytes";
import { isRecord } from "./guards";
import { room } from "./room-store";
import type {
  DeliveredMessage,
  Device,
  Envelope,
  InboxResponse,
  Poll,
  PresenterState,
  StoredMessage,
} from "./room-types";

const ONLINE_MS = 15_000;
const MAX_DEVICES = 500;
const MAX_CIPHERTEXT_BYTES = 2048;
/** Phones seen this recently are "in the room" (backgrounded ones included); older ones are rehearsal leftovers */
const ROOM_WINDOW_MS = 60 * 60_000;
const MISSED_NOTICE_MS = 90_000;

export const noStore = { "cache-control": "no-store" };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStore });
}

export async function requirePresenter(request: NextRequest): Promise<Response | null> {
  const ok = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  return ok ? null : json({ error: "unauthorized" }, 401);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

function validId(v: unknown): v is string {
  return typeof v === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(v);
}

export async function registerDevice(request: Request) {
  const body = await readJson(request);
  const publicKey = body?.publicKey;
  if (!isB64(publicKey, 32)) return json({ error: "publicKey must be a 32-byte X25519 key" }, 400);

  const store = room();
  let id: string | null = null;
  if (validId(body?.id)) {
    const existing = await store.getDevice(body.id);
    if (existing && existing.publicKey === publicKey) {
      await store.touch(existing.id, Date.now());
      return json(existing);
    }
    // Re-join after a reset (or a stale replica read): reuse the id so the phone isn't counted twice
    if (!existing) id = body.id;
  }
  // Phones already in the room keep working; only brand-new joins are gated
  if (!(await store.joining())) return json({ error: "closed" }, 403);
  if ((await store.deviceCount()) >= MAX_DEVICES) return json({ error: "room is full" }, 429);

  id ??= crypto.randomUUID();
  const device: Device = { id, publicKey, joinedAt: Date.now(), ...aliasFor(id) };
  await store.putDevice(device);
  return json(device);
}

export async function inbox(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const after = request.nextUrl.searchParams.get("after");
  if (!validId(id)) return json({ error: "bad id" }, 400);

  const store = room();
  const device = await store.getDevice(id);
  if (!device) return json({ status: "unknown" } satisfies InboxResponse);

  const [latest, poll] = await Promise.all([store.latestId(), store.poll(), store.touch(id, Date.now())]);

  let message: DeliveredMessage | null = null;
  let missed: string | null = null;
  if (latest && latest !== after) {
    const [m, wrap, acked] = await Promise.all([
      store.message(latest),
      store.wrapFor(latest, id),
      store.hasAcked(latest, id),
    ]);
    // Deliver once: only to phones it was sealed for (joined before the send), and only until they confirm.
    // A phone that joins later has no wrap, so it can never get an older message.
    if (m && wrap && !acked) message = { ...m, wrap };
    else if (m && !wrap && Date.now() - m.createdAt < MISSED_NOTICE_MS) missed = m.id;
  }

  let pollView: Extract<InboxResponse, { status: "ok" }>["poll"] = null;
  if (poll) {
    const votes = await store.votes(poll.id);
    pollView = { ...poll, myVote: votes[id] ?? null };
  }

  return json({ status: "ok", message, missed, cursor: latest, poll: pollView } satisfies InboxResponse);
}

export async function ack(request: Request) {
  const body = await readJson(request);
  if (!validId(body?.id) || !validId(body?.messageId)) return json({ error: "bad request" }, 400);
  const store = room();
  if (!(await store.getDevice(body.id))) return json({ error: "unknown device" }, 404);
  await store.ack(body.messageId, body.id);
  return json({ ok: true });
}

export async function vote(request: Request) {
  const body = await readJson(request);
  if (!validId(body?.id) || typeof body?.pollId !== "string" || typeof body?.option !== "number") {
    return json({ error: "bad request" }, 400);
  }
  const store = room();
  const [device, poll] = await Promise.all([store.getDevice(body.id), store.poll()]);
  if (!device || !poll || poll.id !== body.pollId || !poll.open) return json({ error: "poll closed" }, 409);
  if (!Number.isInteger(body.option) || body.option < 0 || body.option >= poll.options.length) {
    return json({ error: "bad option" }, 400);
  }
  await store.vote(poll.id, device.id, body.option);
  return json({ ok: true });
}

export async function sendMessage(request: Request) {
  const body = (await readJson(request)) as Partial<Envelope> | null;
  if (
    !body ||
    body.v !== 2 ||
    !isB64(body.epk, 32) ||
    !isB64(body.n, 12) ||
    !isB64(body.ct, undefined, MAX_CIPHERTEXT_BYTES) ||
    !isB64(body.spk, 32) ||
    !isB64(body.rpk, 32) ||
    !isB64(body.sig, 64) ||
    !body.wraps ||
    typeof body.wraps !== "object"
  ) {
    return json({ error: "malformed envelope" }, 400);
  }
  const wraps = Object.entries(body.wraps);
  if (wraps.length === 0 || wraps.length > MAX_DEVICES) return json({ error: "no recipients" }, 400);
  for (const [deviceId, w] of wraps) {
    if (!validId(deviceId) || !isB64(w?.n, 12) || !isB64(w?.k, 48)) return json({ error: "bad wrap" }, 400);
  }

  const message: StoredMessage = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    v: 2,
    epk: body.epk,
    n: body.n,
    ct: body.ct,
    spk: body.spk,
    rpk: body.rpk,
    sig: body.sig,
  };
  await room().putMessage(message, body.wraps);
  return json({ id: message.id });
}

/** Phones batch taps client-side, so one request per ~second per phone is plenty. */
const REACTION_INTERVAL_MS = 600;

export async function react(request: Request) {
  const body = await readJson(request);
  if (!validId(body?.id) || !isB64(body?.epk, 32) || !isB64(body?.n, 12) || !isB64(body?.ct, undefined, 512)) {
    return json({ error: "bad request" }, 400);
  }
  const store = room();
  if (!(await store.getDevice(body.id))) return json({ error: "unknown device" }, 404);
  if (!(await store.allow(body.id, REACTION_INTERVAL_MS))) return json({ error: "slow down" }, 429);
  await store.addReaction({ device: body.id, epk: body.epk, n: body.n, ct: body.ct });
  return json({ ok: true });
}

/** `reactionsAfter` is the presenter's cursor; null means "just tell me where the stream is". */
export async function presenterState(reactionsAfter: number | null): Promise<PresenterState> {
  const store = room();
  const [devices, seen, latestId, poll, reactionSeq, joining] = await Promise.all([
    store.devices(),
    store.lastSeen(),
    store.latestId(),
    store.poll(),
    store.reactionSeq(),
    store.joining(),
  ]);
  const reactions =
    reactionsAfter !== null && reactionSeq > reactionsAfter ? await store.reactionsSince(reactionsAfter) : [];
  const now = Date.now();

  let latest: PresenterState["latest"] = null;
  let serverView: PresenterState["serverView"] = null;
  if (latestId) {
    const [m, wraps, acks] = await Promise.all([store.message(latestId), store.wraps(latestId), store.acks(latestId)]);
    if (m) {
      const wrapCount = Object.keys(wraps).length;
      latest = { id: m.id, createdAt: m.createdAt, recipients: wrapCount, acks };
      // Show only a few wraps; the rest are just more of the same noise
      serverView = { ...m, wraps: Object.fromEntries(Object.entries(wraps).slice(0, 3)), wrapCount };
    }
  }

  let pollView: PresenterState["poll"] = null;
  if (poll) {
    const votes = Object.values(await store.votes(poll.id));
    const counts = poll.options.map((_, i) => votes.filter((v) => v === i).length);
    pollView = { ...poll, counts, total: votes.length };
  }

  return {
    devices: devices
      .filter((d) => now - (seen[d.id] ?? 0) < ROOM_WINDOW_MS)
      .map((d) => ({ ...d, online: now - (seen[d.id] ?? 0) < ONLINE_MS }))
      .toSorted((a, b) => a.joinedAt - b.joinedAt),
    latest,
    serverView,
    poll: pollView,
    reactions,
    reactionSeq,
    joining,
    backend: store.kind,
  };
}

export async function setJoining(request: Request) {
  const body = await readJson(request);
  if (typeof body?.open !== "boolean") return json({ error: "bad request" }, 400);
  await room().setJoining(body.open);
  return json({ joining: body.open });
}

export async function updatePoll(request: Request) {
  const body = await readJson(request);
  const store = room();
  if (body?.action === "clear") {
    await store.setPoll(null);
    return json({ ok: true });
  }
  if (body?.action === "close") {
    const p = await store.poll();
    if (p) await store.setPoll({ ...p, open: false });
    return json({ ok: true });
  }
  const question = body?.question;
  const options = body?.options;
  if (
    typeof question !== "string" ||
    question.length > 200 ||
    !Array.isArray(options) ||
    options.length < 2 ||
    options.length > 4 ||
    !options.every((o): o is string => typeof o === "string" && o.length <= 60)
  ) {
    return json({ error: "bad poll" }, 400);
  }
  const poll: Poll = { id: crypto.randomUUID(), question, options, open: true };
  await store.setPoll(poll);
  return json(poll);
}
