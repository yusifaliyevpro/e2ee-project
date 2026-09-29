// Pigment-style mixing: geometric mean of linear RGB behaves like paint (yellow + blue → green).

function toLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toGamma(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function hexToLinear(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)];
}

/** Equal-weight mix. Order doesn't matter — which is exactly why both sides end up with the same colour. */
export function mix(...hexes: string[]): string {
  const rgb = hexes.map(hexToLinear);
  const channel = (i: number) => Math.exp(rgb.reduce((acc, c) => acc + Math.log(Math.max(c[i], 1e-4)), 0) / rgb.length);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(Math.min(1, Math.max(0, toGamma(channel(i)))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
