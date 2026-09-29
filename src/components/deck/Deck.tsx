"use client";

import { MotionConfig, motion, useScroll, useSpring, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LuMaximize, LuMinimize, LuMoon, LuSun } from "react-icons/lu";
import { cn } from "@/lib/cn";
import { toggleTheme, useTheme } from "@/lib/theme";
import { JoinToggle } from "./JoinToggle";
import { ReactionsOverlay } from "./ReactionsOverlay";
import { RoomProvider } from "./RoomProvider";

type SlideInfo = { el: HTMLElement; title: string };

function stopTops(): number[] {
  const y = window.scrollY;
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-stop]"),
    (el) => el.getBoundingClientRect().top + y,
  ).toSorted((a, b) => a - b);
}

function isTyping(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function Deck({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <RoomProvider>
        <div data-deck className="relative">
          <Backdrop />
          <main>{children}</main>
          <Hud />
          <ReactionsOverlay />
        </div>
      </RoomProvider>
    </MotionConfig>
  );
}

function Backdrop() {
  const { scrollYProgress } = useScroll();
  // Transforms + gradients only: a filter blur here would repaint the whole screen every scroll frame
  const x1 = useTransform(scrollYProgress, [0, 1], ["-25vw", "50vw"]);
  const y1 = useTransform(scrollYProgress, [0, 0.5, 1], ["-30vh", "30vh", "-5vh"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["55vw", "-15vw"]);
  const y2 = useTransform(scrollYProgress, [0, 0.5, 1], ["40vh", "-5vh", "50vh"]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <motion.div
        style={{ x: x1, y: y1, background: "radial-gradient(circle, var(--glow-a), transparent 65%)" }}
        className="absolute top-0 left-0 size-[70vmax] will-change-transform"
      />
      <motion.div
        style={{ x: x2, y: y2, background: "radial-gradient(circle, var(--glow-b), transparent 65%)" }}
        className="absolute top-0 left-0 size-[60vmax] will-change-transform"
      />
    </div>
  );
}

function Hud() {
  const theme = useTheme();
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const pendingTarget = useRef<{ top: number; at: number } | null>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const list = Array.from(document.querySelectorAll<HTMLElement>("[data-slide-root]"), (el) => ({
      el,
      title: el.dataset.title ?? "",
    }));
    const measure = () => {
      const probe = window.innerHeight * 0.45;
      let idx = 0;
      list.forEach((s, i) => {
        if (s.el.getBoundingClientRect().top <= probe) idx = i;
      });
      setCurrent(idx);
    };
    // Slides are only known once the DOM exists
    let frame = requestAnimationFrame(() => {
      setSlides(list);
      measure();
    });
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const scrollToTop = (top: number) => {
      pendingTarget.current = { top, at: performance.now() };
      window.scrollTo({ top, behavior: "smooth" });
    };

    const go = (dir: 1 | -1) => {
      const tops = stopTops();
      // While a smooth scroll is still running, step from where it's heading, not where it is
      const pending = pendingTarget.current;
      const from = pending && performance.now() - pending.at < 900 ? pending.top : window.scrollY;
      const target = dir > 0 ? tops.find((t) => t > from + 4) : tops.findLast((t) => t < from - 4);
      if (target !== undefined) scrollToTop(target);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const onButton = e.target instanceof Element && e.target.closest("button, a, [role='button']");
      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          go(1);
          break;
        case " ":
          if (onButton) return;
          e.preventDefault();
          go(e.shiftKey ? -1 : 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(-1);
          break;
        case "Home":
          e.preventDefault();
          scrollToTop(0);
          break;
        case "End":
          e.preventDefault();
          scrollToTop(stopTops().at(-1) ?? 0);
          break;
        case "t":
        case "T":
          toggleTheme();
          break;
        case "f":
        case "F":
          void toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const jump = (i: number) => {
    const el = slides[i]?.el;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
  };

  return (
    <>
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[0.3rem] origin-left bg-linear-to-r from-accent to-iris"
      />

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <JoinToggle />
        <HudButton label={theme === "dark" ? "Light mode (T)" : "Dark mode (T)"} onClick={toggleTheme}>
          {theme === "dark" ? <LuSun /> : <LuMoon />}
        </HudButton>
        <HudButton label="Fullscreen (F)" onClick={() => void toggleFullscreen()}>
          {fullscreen ? <LuMinimize /> : <LuMaximize />}
        </HudButton>
      </div>

      <nav aria-label="Slides" className="fixed top-1/2 right-4 z-40 flex -translate-y-1/2 flex-col gap-2.5">
        {slides.map((s, i) => (
          <button
            key={s.title + i}
            type="button"
            onClick={() => jump(i)}
            aria-label={`Go to slide ${i + 1}: ${s.title}`}
            className="group relative flex items-center justify-end"
          >
            <span className="pointer-events-none absolute right-6 rounded-md border border-line bg-card px-2 py-1 text-[0.8rem] font-medium whitespace-nowrap text-fg opacity-0 transition-opacity group-hover:opacity-100">
              {s.title}
            </span>
            <span
              className={cn(
                "block rounded-full transition-all duration-300",
                i === current ? "size-3 bg-accent" : "size-2 bg-muted/40 group-hover:bg-muted",
              )}
            />
          </button>
        ))}
      </nav>

      <div className="pointer-events-none fixed right-6 bottom-4 z-40 flex items-baseline gap-3 font-mono text-[0.85rem] text-muted">
        <span className="max-w-[30vw] truncate">{slides[current]?.title}</span>
        <span className="text-[1.1rem] font-bold text-fg tabular-nums">
          {String(current + 1).padStart(2, "0")}
          <span className="font-normal text-muted"> / {String(slides.length).padStart(2, "0")}</span>
        </span>
      </div>
    </>
  );
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {}
}

function HudButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      title={label}
      aria-label={label}
      className="grid size-10 place-items-center rounded-xl border border-line bg-card/70 text-[1.1rem] text-muted backdrop-blur transition-colors hover:text-fg"
    >
      {children}
    </button>
  );
}
