"use client";

import { LuVolume2 } from "react-icons/lu";
import { RECAP, TERMS } from "@/lib/vocab";

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

export function Glossary() {
  return (
    <div>
      <h2 className="text-2xl font-bold">New terms</h2>
      <p className="mt-1 text-sm text-muted">
        Technical English vocabulary from today's presentation. Tap 🔊 to hear it.
      </p>
      <ul className="mt-4 space-y-3">
        {RECAP.map((k) => {
          const t = TERMS[k];
          return (
            <li key={k} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">{t.term}</div>
                  <div className="text-sm text-muted">
                    <span className="font-ipa">{t.ipa}</span> · <i>{t.pos}</i>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speak(t.term)}
                  aria-label={`Pronounce ${t.term}`}
                  className="shrink-0 rounded-full bg-accent/10 p-2 text-accent"
                >
                  <LuVolume2 />
                </button>
              </div>
              <p className="mt-2 text-[0.95rem]">{t.definition}</p>
              <p className="mt-1.5 text-sm text-muted italic">“{t.example}”</p>
              {t.note && <p className="mt-1.5 text-sm font-medium text-warn">{t.note}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
