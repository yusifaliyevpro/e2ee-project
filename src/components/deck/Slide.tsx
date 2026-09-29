"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type SlideProps = { id: string; title: string; children: ReactNode; className?: string };

/** One scroll stop: full-viewport section that the page snaps to. */
export function Slide({ id, title, children, className }: SlideProps) {
  return (
    <section
      id={id}
      data-slide-root
      data-title={title}
      data-stop
      className={cn(
        "relative flex min-h-svh w-full snap-start snap-always items-center justify-center px-[5vw] py-[8vh]",
        className,
      )}
    >
      <div className="w-full max-w-[94rem]">{children}</div>
    </section>
  );
}

type PinnedProps = {
  id: string;
  title: string;
  steps: number;
  children: (step: number) => ReactNode;
};

/** A slide that stays pinned while scrolling through `steps` snap stops. */
export function PinnedSlide({ id, title, steps, children }: PinnedProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(steps - 1, Math.max(0, Math.round(p * (steps - 1))));
    setStep((s) => (s === next ? s : next));
  });

  return (
    <section
      id={id}
      ref={ref}
      data-slide-root
      data-title={title}
      data-steps={steps}
      className="relative"
      style={{ height: `${steps * 100}svh` }}
    >
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          data-stop
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-svh snap-start snap-always"
          style={{ top: `${i * 100}svh` }}
        />
      ))}
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden px-[5vw] py-[8vh]">
        <div className="w-full max-w-[94rem]">{children(step)}</div>
        <StepDots steps={steps} step={step} />
      </div>
    </section>
  );
}

function StepDots({ steps, step }: { steps: number; step: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[3vh] flex items-center justify-center gap-2">
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-500",
            i === step ? "w-10 bg-accent" : i < step ? "w-2 bg-accent/50" : "w-2 bg-line",
          )}
        />
      ))}
    </div>
  );
}
