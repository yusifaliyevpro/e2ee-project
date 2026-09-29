import { gcm } from "@noble/ciphers/aes.js";
import { bytesToUtf8 } from "@noble/ciphers/utils.js";
import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { concatBytes, randomBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { fromB64, fromHex, toB64, toHex } from "./bytes";
import type { DeliveredMessage, Envelope, Wrap } from "./room-types";

// Audited pure-JS primitives (noble) so the demo also works on plain-http LAN, where WebCrypto is unavailable.

const WRAP_INFO = utf8ToBytes("e2ee-demo/v1/key-wrap");
const SIG_CONTEXT = utf8ToBytes("e2ee-demo/v2/signature");
const REACTION_INFO = utf8ToBytes("e2ee-demo/v2/reaction");
const REPLY_KEY_INFO = utf8ToBytes("e2ee-demo/v2/reply-key");

export type KeyPair = { secretKey: Uint8Array; publicKey: Uint8Array };

export function newX25519(): KeyPair {
  const secretKey = x25519.utils.randomSecretKey();
  return { secretKey, publicKey: x25519.getPublicKey(secretKey) };
}

function deriveWrapKey(shared: Uint8Array, ephemeralPub: Uint8Array, recipientPub: Uint8Array) {
  return hkdf(sha256, shared, concatBytes(ephemeralPub, recipientPub), WRAP_INFO, 32);
}

// The reply key is signed too, so the server can't swap in its own key to read reactions
function signedBytes(epk: Uint8Array, nonce: Uint8Array, ct: Uint8Array, rpk: Uint8Array) {
  return concatBytes(SIG_CONTEXT, epk, nonce, ct, rpk);
}

export type SealResult = {
  envelope: Envelope;
  messageKey: Uint8Array;
  ciphertext: Uint8Array;
};

/** Hybrid encryption: one AES-256-GCM ciphertext, message key wrapped per recipient via X25519 + HKDF. */
export function seal(
  plaintext: string,
  recipients: { id: string; publicKey: string }[],
  identity: PresenterIdentity,
): SealResult {
  const messageKey = randomBytes(32);
  const nonce = randomBytes(12);
  const ciphertext = gcm(messageKey, nonce).encrypt(utf8ToBytes(plaintext));
  const eph = newX25519();

  const wraps: Record<string, Wrap> = {};
  for (const r of recipients) {
    const recipientPub = fromB64(r.publicKey);
    const kek = deriveWrapKey(x25519.getSharedSecret(eph.secretKey, recipientPub), eph.publicKey, recipientPub);
    const wrapNonce = randomBytes(12);
    wraps[r.id] = { n: toB64(wrapNonce), k: toB64(gcm(kek, wrapNonce).encrypt(messageKey)) };
  }

  const sig = ed25519.sign(signedBytes(eph.publicKey, nonce, ciphertext, identity.replyPublic), identity.secretKey);
  return {
    messageKey,
    ciphertext,
    envelope: {
      v: 2,
      epk: toB64(eph.publicKey),
      n: toB64(nonce),
      ct: toB64(ciphertext),
      spk: toB64(identity.publicKey),
      rpk: toB64(identity.replyPublic),
      sig: toB64(sig),
      wraps,
    },
  };
}

export type OpenResult = {
  plaintext: string;
  signatureValid: boolean;
  sharedSecret: Uint8Array;
  messageKey: Uint8Array;
};

export function open(msg: DeliveredMessage, keys: KeyPair): OpenResult {
  const epk = fromB64(msg.epk);
  const nonce = fromB64(msg.n);
  const ct = fromB64(msg.ct);
  const signatureValid = ed25519.verify(
    fromB64(msg.sig),
    signedBytes(epk, nonce, ct, fromB64(msg.rpk)),
    fromB64(msg.spk),
  );
  const sharedSecret = x25519.getSharedSecret(keys.secretKey, epk);
  const kek = deriveWrapKey(sharedSecret, epk, keys.publicKey);
  const messageKey = gcm(kek, fromB64(msg.wrap.n)).decrypt(fromB64(msg.wrap.k));
  const plaintext = bytesToUtf8(gcm(messageKey, nonce).decrypt(ct));
  return { plaintext, signatureValid, sharedSecret, messageKey };
}

/** Signal-style safety number: 5 hash bytes → 5 decimal digits per group. */
export function safetyNumber(publicKey: Uint8Array, groups = 6): string[] {
  const h = sha256(concatBytes(utf8ToBytes("e2ee-demo/v1/fingerprint"), publicKey));
  const out: string[] = [];
  for (let g = 0; g < groups; g++) {
    let n = 0;
    for (let i = 0; i < 5; i++) n = n * 256 + h[g * 5 + i];
    out.push((n % 100000).toString().padStart(5, "0"));
  }
  return out;
}

/** Phone → presenter: an anonymous sealed box (ephemeral X25519 + HKDF + AES-GCM) bound to the device id. */
export function sealReaction(payload: string, replyPublic: Uint8Array, deviceId: string) {
  const eph = newX25519();
  const key = hkdf(
    sha256,
    x25519.getSharedSecret(eph.secretKey, replyPublic),
    concatBytes(eph.publicKey, replyPublic),
    REACTION_INFO,
    32,
  );
  const nonce = randomBytes(12);
  const ct = gcm(key, nonce, utf8ToBytes(deviceId)).encrypt(utf8ToBytes(payload));
  return { epk: toB64(eph.publicKey), n: toB64(nonce), ct: toB64(ct) };
}

export function openReaction(
  r: { device: string; epk: string; n: string; ct: string },
  identity: PresenterIdentity,
): string | null {
  try {
    const epk = fromB64(r.epk);
    const key = hkdf(
      sha256,
      x25519.getSharedSecret(identity.replySecret, epk),
      concatBytes(epk, identity.replyPublic),
      REACTION_INFO,
      32,
    );
    return bytesToUtf8(gcm(key, fromB64(r.n), utf8ToBytes(r.device)).decrypt(fromB64(r.ct)));
  } catch {
    return null;
  }
}

const IDENTITY_KEY = "e2ee:presenter-identity";

export type PresenterIdentity = {
  secretKey: Uint8Array;
  publicKey: Uint8Array;
  /** X25519 key phones encrypt reactions to; derived from the identity so only one secret is stored */
  replySecret: Uint8Array;
  replyPublic: Uint8Array;
};

export function loadPresenterIdentity(): PresenterIdentity {
  let hex: string | null = null;
  try {
    hex = localStorage.getItem(IDENTITY_KEY);
  } catch {}
  let secretKey = hex && hex.length === 64 ? fromHex(hex) : null;
  if (!secretKey) {
    secretKey = ed25519.utils.randomSecretKey();
    try {
      localStorage.setItem(IDENTITY_KEY, toHex(secretKey));
    } catch {}
  }
  const replySecret = hkdf(sha256, secretKey, undefined, REPLY_KEY_INFO, 32);
  return {
    secretKey,
    publicKey: ed25519.getPublicKey(secretKey),
    replySecret,
    replyPublic: x25519.getPublicKey(replySecret),
  };
}
