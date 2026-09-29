export const REACTIONS = ["❤️", "🔥", "😂", "😮", "👏", "🔐"] as const;

export type Reaction = (typeof REACTIONS)[number];

/** Taps are batched on the phone, so one request carries counts per emoji. */
export type ReactionBatch = Partial<Record<Reaction, number>>;

export const MAX_PER_EMOJI = 12;

/** Decrypted payloads come from untrusted phones: keep only known emojis and sane counts. */
export function parseBatch(json: string): [Reaction, number][] {
  try {
    const raw: unknown = JSON.parse(json);
    if (!raw || typeof raw !== "object") return [];
    return REACTIONS.flatMap((r) => {
      const n = (raw as Record<string, unknown>)[r];
      return typeof n === "number" && n > 0 ? [[r, Math.min(MAX_PER_EMOJI, Math.floor(n))] as [Reaction, number]] : [];
    });
  } catch {
    return [];
  }
}

export function avatarColor(hue: number) {
  return `hsl(${hue} 70% 56%)`;
}
