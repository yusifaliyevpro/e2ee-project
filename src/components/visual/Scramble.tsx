"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const CIPHER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=#$%&@";

export function randomChars(length: number, charset = CIPHER_CHARS) {
  let s = "";
  for (let i = 0; i < length; i++) s += charset[Math.floor(Math.random() * charset.length)];
  return s;
}

/** Scrambles `from` (or random noise) into `text`, revealing left to right — a "decryption" effect. */
export function useScramble(text: string, { play = true, duration = 1.2, delay = 0, from }: ScrambleOpts = {}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!play) return undefined;
    let raf = 0;
    let frame = 0;
    const start = performance.now() + delay * 1000;
    const source = from ?? randomChars(text.length);
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
      frame++;
      if (frame % 2 === 0 || t === 1) {
        const revealed = Math.floor(t * text.length);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          if (i < revealed || text[i] === " " || text[i] === "\n") s += text[i];
          else if (t === 0) s += source[i] ?? " ";
          else s += CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
        }
        setOut(s);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, play, duration, delay, from]);

  return out;
}

type ScrambleOpts = { play?: boolean; duration?: number; delay?: number; from?: string };

export function Scramble({
  text,
  className,
  duration,
  delay,
  once = false,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, amount: 0.6 });
  const out = useScramble(text, { play: inView, duration, delay });
  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
