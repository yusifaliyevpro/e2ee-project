export type Wrap = { n: string; k: string };

export type Device = {
  id: string;
  alias: string;
  emoji: string;
  hue: number;
  publicKey: string;
  joinedAt: number;
};

export type DeviceView = Device & { online: boolean };

/** What the presenter uploads. The server never sees plaintext or the message key. */
export type Envelope = {
  v: 2;
  /** ephemeral X25519 public key */
  epk: string;
  /** AES-GCM nonce for the ciphertext */
  n: string;
  ct: string;
  /** sender's Ed25519 identity key + signature over (epk, n, ct, rpk) */
  spk: string;
  sig: string;
  /** presenter's X25519 key that phones encrypt reactions to */
  rpk: string;
  /** message key wrapped separately for every device */
  wraps: Record<string, Wrap>;
};

export type StoredMessage = Omit<Envelope, "wraps"> & { id: string; createdAt: number };

export type DeliveredMessage = StoredMessage & { wrap: Wrap };

export type Poll = {
  id: string;
  question: string;
  options: string[];
  open: boolean;
};

export type InboxResponse =
  | { status: "unknown" }
  | {
      status: "ok";
      message: DeliveredMessage | null;
      /** a message was just sent, but not locked for this device (it joined afterwards) */
      missed: string | null;
      /** latest message id the server has settled for this device; sent back as `after` */
      cursor: string | null;
      poll: (Poll & { myVote: number | null }) | null;
    };

/** An encrypted reaction batch; only the presenter's browser can open it. */
export type StoredReaction = { seq: number; device: string; epk: string; n: string; ct: string };

export type PresenterState = {
  devices: DeviceView[];
  latest: { id: string; createdAt: number; recipients: number; acks: string[] } | null;
  serverView: (StoredMessage & { wraps: Record<string, Wrap>; wrapCount: number }) | null;
  poll: (Poll & { counts: number[]; total: number }) | null;
  /** reactions newer than the `rx` cursor the presenter sent */
  reactions: StoredReaction[];
  reactionSeq: number;
  /** whether new phones may join right now */
  joining: boolean;
  backend: "memory" | "redis";
};
