"use client";

import { motion, useAnimationControls } from "motion/react";
import { useActionState, useEffect } from "react";
import { LuArrowRight, LuKeyRound, LuLock } from "react-icons/lu";
import { type LoginState, login } from "./actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  const shake = useAnimationControls();

  useEffect(() => {
    if (state.error) void shake.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.45 } });
  }, [state, shake]);

  return (
    <motion.form
      action={action}
      animate={shake}
      className="relative w-full max-w-md rounded-3xl border-2 border-line bg-card/80 p-8 shadow-2xl backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="mx-auto mb-6 grid size-20 place-items-center rounded-2xl bg-accent/15 text-accent"
      >
        <LuLock className="size-10" />
      </motion.div>
      <h1 className="text-center font-display text-3xl font-bold">Presenter access</h1>
      <p className="mt-2 text-center text-muted">This presentation is end-to-end locked. Only Yusif has the key.</p>

      <label className="mt-8 flex items-center gap-3 rounded-2xl border-2 border-line bg-bg px-4 py-3 transition-colors focus-within:border-accent">
        <LuKeyRound className="size-5 shrink-0 text-muted" />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          className="w-full bg-transparent text-lg outline-none"
        />
      </label>

      <div aria-live="polite" className="min-h-7 pt-2 text-center text-sm font-medium text-bad">
        {state.error}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-lg font-bold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Unlock"}
        <LuArrowRight className="size-5" />
      </button>
    </motion.form>
  );
}
