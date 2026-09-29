"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { LuVote } from "react-icons/lu";
import type { InboxResponse } from "@/lib/room-types";

type OpenPoll = NonNullable<Extract<InboxResponse, { status: "ok" }>["poll"]>;

export function PollSheet({
  poll,
  deviceId,
  onVoted,
}: {
  poll: OpenPoll;
  deviceId: string;
  onVoted: (option: number) => void;
}) {
  const [sending, setSending] = useState<number | null>(null);

  const vote = async (option: number) => {
    setSending(option);
    try {
      const res = await fetch("/api/room/vote", {
        method: "POST",
        body: JSON.stringify({ id: deviceId, pollId: poll.id, option }),
      });
      if (res.ok) onVoted(option);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="w-full rounded-t-3xl border-t-2 border-line bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase">
          <LuVote /> Live poll
        </div>
        <h2 className="mt-2 text-xl font-bold">{poll.question}</h2>
        <div className="mt-4 space-y-2.5">
          {poll.options.map((o, i) => (
            <button
              key={o}
              type="button"
              disabled={sending !== null}
              onClick={() => void vote(i)}
              className="w-full rounded-2xl border-2 border-line bg-bg px-4 py-3.5 text-left text-lg font-semibold transition-colors hover:border-accent active:bg-accent/10 disabled:opacity-60"
            >
              {sending === i ? "Sending…" : o}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
