const ANIMALS: [string, string][] = [
  ["Otter", "🦦"],
  ["Fox", "🦊"],
  ["Panda", "🐼"],
  ["Owl", "🦉"],
  ["Koala", "🐨"],
  ["Tiger", "🐯"],
  ["Penguin", "🐧"],
  ["Dolphin", "🐬"],
  ["Octopus", "🐙"],
  ["Hedgehog", "🦔"],
  ["Lion", "🦁"],
  ["Frog", "🐸"],
  ["Unicorn", "🦄"],
  ["Whale", "🐳"],
  ["Turtle", "🐢"],
  ["Parrot", "🦜"],
  ["Rabbit", "🐰"],
  ["Bee", "🐝"],
  ["Wolf", "🐺"],
  ["Monkey", "🐵"],
  ["Cat", "🐱"],
  ["Crab", "🦀"],
  ["Butterfly", "🦋"],
  ["Flamingo", "🦩"],
  ["Sloth", "🦥"],
  ["Raccoon", "🦝"],
  ["Llama", "🦙"],
  ["Shark", "🦈"],
  ["Eagle", "🦅"],
  ["Hamster", "🐹"],
];

const ADJECTIVES = [
  "Brave",
  "Clever",
  "Swift",
  "Quiet",
  "Lucky",
  "Sneaky",
  "Cosmic",
  "Mighty",
  "Gentle",
  "Curious",
  "Witty",
  "Fuzzy",
  "Bold",
  "Calm",
  "Nimble",
  "Jolly",
  "Stealthy",
  "Cryptic",
  "Secret",
  "Sparkly",
];

/** Deterministic per device id, so a phone that re-joins keeps the same name and colour. */
export function aliasFor(id: string): { alias: string; emoji: string; hue: number } {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  const [animal, emoji] = ANIMALS[h % ANIMALS.length];
  const adjective = ADJECTIVES[(h >>> 8) % ADJECTIVES.length];
  return { alias: `${adjective} ${animal}`, emoji, hue: (h >>> 16) % 360 };
}
