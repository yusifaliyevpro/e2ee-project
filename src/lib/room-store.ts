import { Redis } from "@upstash/redis";
import type { Device, Poll, StoredMessage, StoredReaction, Wrap } from "./room-types";

// Two backends: in-memory (single `next start` process / tunnel) and Upstash Redis (serverless, e.g. Vercel).

export interface RoomBackend {
  kind: "memory" | "redis";
  putDevice(d: Device): Promise<void>;
  getDevice(id: string): Promise<Device | null>;
  devices(): Promise<Device[]>;
  deviceCount(): Promise<number>;
  touch(id: string, at: number): Promise<void>;
  lastSeen(): Promise<Record<string, number>>;
  putMessage(m: StoredMessage, wraps: Record<string, Wrap>): Promise<void>;
  latestId(): Promise<string | null>;
  message(id: string): Promise<StoredMessage | null>;
  wraps(id: string): Promise<Record<string, Wrap>>;
  wrapFor(id: string, deviceId: string): Promise<Wrap | null>;
  ack(id: string, deviceId: string): Promise<void>;
  acks(id: string): Promise<string[]>;
  hasAcked(id: string, deviceId: string): Promise<boolean>;
  setPoll(p: Poll | null): Promise<void>;
  poll(): Promise<Poll | null>;
  vote(pollId: string, deviceId: string, option: number): Promise<void>;
  votes(pollId: string): Promise<Record<string, number>>;
  /** false if this device already did something within the last `ms` */
  allow(deviceId: string, ms: number): Promise<boolean>;
  addReaction(r: Omit<StoredReaction, "seq">): Promise<void>;
  reactionSeq(): Promise<number>;
  reactionsSince(seq: number): Promise<StoredReaction[]>;
  joining(): Promise<boolean>;
  setJoining(open: boolean): Promise<void>;
  reset(): Promise<void>;
}

type Mem = {
  devices: Map<string, Device>;
  seen: Map<string, number>;
  messages: Map<string, { m: StoredMessage; wraps: Record<string, Wrap> }>;
  latest: string | null;
  acks: Map<string, Set<string>>;
  poll: Poll | null;
  votes: Map<string, Map<string, number>>;
  reactions: StoredReaction[];
  rxSeq: number;
  lastAction: Map<string, number>;
  joiningUntil: number;
};

function freshMem(): Mem {
  return {
    devices: new Map(),
    seen: new Map(),
    messages: new Map(),
    latest: null,
    acks: new Map(),
    poll: null,
    votes: new Map(),
    reactions: [],
    rxSeq: 0,
    lastAction: new Map(),
    joiningUntil: 0,
  };
}

/** An opened room closes itself after this long, in case the presenter forgets (seconds) */
const JOIN_TTL = 4 * 60 * 60;

// Survives dev-server hot reloads
const globalRoom = globalThis as typeof globalThis & { e2eeRoom?: Mem };
const mem = () => (globalRoom.e2eeRoom ??= freshMem());

function memoryBackend(): RoomBackend {
  return {
    kind: "memory",
    async putDevice(d) {
      mem().devices.set(d.id, d);
      mem().seen.set(d.id, Date.now());
    },
    async getDevice(id) {
      return mem().devices.get(id) ?? null;
    },
    async devices() {
      return [...mem().devices.values()];
    },
    async deviceCount() {
      return mem().devices.size;
    },
    async touch(id, at) {
      mem().seen.set(id, at);
    },
    async lastSeen() {
      return Object.fromEntries(mem().seen);
    },
    async putMessage(m, wraps) {
      const s = mem();
      s.messages.set(m.id, { m, wraps });
      s.latest = m.id;
      // keep memory bounded
      const ids = [...s.messages.keys()];
      for (const old of ids.slice(0, Math.max(0, ids.length - 5))) {
        s.messages.delete(old);
        s.acks.delete(old);
      }
    },
    async latestId() {
      return mem().latest;
    },
    async message(id) {
      return mem().messages.get(id)?.m ?? null;
    },
    async wraps(id) {
      return mem().messages.get(id)?.wraps ?? {};
    },
    async wrapFor(id, deviceId) {
      return mem().messages.get(id)?.wraps[deviceId] ?? null;
    },
    async ack(id, deviceId) {
      const s = mem();
      if (!s.acks.has(id)) s.acks.set(id, new Set());
      s.acks.get(id)!.add(deviceId);
    },
    async acks(id) {
      return [...(mem().acks.get(id) ?? [])];
    },
    async hasAcked(id, deviceId) {
      return mem().acks.get(id)?.has(deviceId) ?? false;
    },
    async setPoll(p) {
      mem().poll = p;
    },
    async poll() {
      return mem().poll;
    },
    async vote(pollId, deviceId, option) {
      const s = mem();
      if (!s.votes.has(pollId)) s.votes.set(pollId, new Map());
      s.votes.get(pollId)!.set(deviceId, option);
    },
    async votes(pollId) {
      return Object.fromEntries(mem().votes.get(pollId) ?? []);
    },
    async allow(deviceId, ms) {
      const s = mem();
      const now = Date.now();
      if (now - (s.lastAction.get(deviceId) ?? 0) < ms) return false;
      s.lastAction.set(deviceId, now);
      return true;
    },
    async addReaction(r) {
      const s = mem();
      s.reactions.push({ ...r, seq: ++s.rxSeq });
      if (s.reactions.length > 200) s.reactions.splice(0, s.reactions.length - 200);
    },
    async reactionSeq() {
      return mem().rxSeq;
    },
    async reactionsSince(seq) {
      return mem().reactions.filter((r) => r.seq > seq);
    },
    async joining() {
      return Date.now() < mem().joiningUntil;
    },
    async setJoining(open) {
      mem().joiningUntil = open ? Date.now() + JOIN_TTL * 1000 : 0;
    },
    async reset() {
      // Keep the reaction counter (presenter's cursor) and the join switch as they are
      const { rxSeq, joiningUntil } = mem();
      globalRoom.e2eeRoom = { ...freshMem(), rxSeq, joiningUntil };
    },
  };
}

const P = "e2ee:";
const TTL = 60 * 60 * 24;

/** With automaticDeserialization off, HGETALL comes back as a flat [field, value, ...] array. */
function hashToRecord(raw: unknown): Record<string, string> {
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = String(raw[i + 1]);
    return out;
  }
  return raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
}

function parse<T>(raw: unknown): T | null {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function redisBackend(redis: Redis): RoomBackend {
  return {
    kind: "redis",
    async putDevice(d) {
      // Shared database: room keys expire a day after the last join
      const p = redis.pipeline();
      p.hset(`${P}devices`, { [d.id]: JSON.stringify(d) });
      p.hset(`${P}seen`, { [d.id]: String(Date.now()) });
      p.expire(`${P}devices`, TTL);
      p.expire(`${P}seen`, TTL);
      await p.exec();
    },
    async getDevice(id) {
      return parse<Device>(await redis.hget(`${P}devices`, id));
    },
    async devices() {
      const all = hashToRecord(await redis.hgetall(`${P}devices`));
      return Object.values(all)
        .map((v) => parse<Device>(v))
        .filter((d): d is Device => d !== null);
    },
    async deviceCount() {
      return redis.hlen(`${P}devices`);
    },
    async touch(id, at) {
      await redis.hset(`${P}seen`, { [id]: String(at) });
    },
    async lastSeen() {
      const all = hashToRecord(await redis.hgetall(`${P}seen`));
      return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, Number(v)]));
    },
    async putMessage(m, wraps) {
      const p = redis.pipeline();
      p.set(`${P}msg:${m.id}`, JSON.stringify(m), { ex: TTL });
      const entries = Object.fromEntries(Object.entries(wraps).map(([k, v]) => [k, JSON.stringify(v)]));
      if (Object.keys(entries).length > 0) {
        p.hset(`${P}wraps:${m.id}`, entries);
        p.expire(`${P}wraps:${m.id}`, TTL);
      }
      p.set(`${P}latest`, m.id, { ex: TTL });
      await p.exec();
    },
    async latestId() {
      const v = await redis.get<string>(`${P}latest`);
      return typeof v === "string" ? v : null;
    },
    async message(id) {
      return parse<StoredMessage>(await redis.get(`${P}msg:${id}`));
    },
    async wraps(id) {
      const all = hashToRecord(await redis.hgetall(`${P}wraps:${id}`));
      const out: Record<string, Wrap> = {};
      for (const [k, v] of Object.entries(all)) {
        const w = parse<Wrap>(v);
        if (w) out[k] = w;
      }
      return out;
    },
    async wrapFor(id, deviceId) {
      return parse<Wrap>(await redis.hget(`${P}wraps:${id}`, deviceId));
    },
    async ack(id, deviceId) {
      const p = redis.pipeline();
      p.sadd(`${P}acks:${id}`, deviceId);
      p.expire(`${P}acks:${id}`, TTL);
      await p.exec();
    },
    async acks(id) {
      return (await redis.smembers(`${P}acks:${id}`)) ?? [];
    },
    async hasAcked(id, deviceId) {
      return (await redis.sismember(`${P}acks:${id}`, deviceId)) === 1;
    },
    async setPoll(p) {
      if (p) await redis.set(`${P}poll`, JSON.stringify(p), { ex: TTL });
      else await redis.del(`${P}poll`);
    },
    async poll() {
      return parse<Poll>(await redis.get(`${P}poll`));
    },
    async vote(pollId, deviceId, option) {
      const p = redis.pipeline();
      p.hset(`${P}votes:${pollId}`, { [deviceId]: String(option) });
      p.expire(`${P}votes:${pollId}`, TTL);
      await p.exec();
    },
    async votes(pollId) {
      const all = hashToRecord(await redis.hgetall(`${P}votes:${pollId}`));
      return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, Number(v)]));
    },
    async allow(deviceId, ms) {
      return (await redis.set(`${P}rl:${deviceId}`, "1", { px: ms, nx: true })) === "OK";
    },
    async addReaction(r) {
      const seq = await redis.incr(`${P}rx:seq`);
      const p = redis.pipeline();
      p.lpush(`${P}rx`, JSON.stringify({ ...r, seq }));
      p.ltrim(`${P}rx`, 0, 199);
      p.expire(`${P}rx`, TTL);
      p.expire(`${P}rx:seq`, TTL);
      await p.exec();
    },
    async reactionSeq() {
      return Number(await redis.get(`${P}rx:seq`)) || 0;
    },
    async reactionsSince(seq) {
      const raw = await redis.lrange(`${P}rx`, 0, 99);
      return raw
        .map((v) => parse<StoredReaction>(v))
        .filter((r): r is StoredReaction => r !== null && r.seq > seq)
        .toSorted((a, b) => a.seq - b.seq);
    },
    async joining() {
      return (await redis.get(`${P}joining`)) === "1";
    },
    async setJoining(open) {
      if (open) await redis.set(`${P}joining`, "1", { ex: JOIN_TTL });
      else await redis.del(`${P}joining`);
    },
    async reset() {
      // `rx:seq` survives so the presenter's reaction cursor stays valid
      await redis.del(`${P}devices`, `${P}seen`, `${P}latest`, `${P}poll`, `${P}rx`);
    },
  };
}

let backend: RoomBackend | null = null;

export function room(): RoomBackend {
  if (backend) return backend;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  backend = url && token ? redisBackend(new Redis({ url, token, automaticDeserialization: false })) : memoryBackend();
  return backend;
}
