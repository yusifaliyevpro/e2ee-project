import type { NextRequest } from "next/server";
import {
  ack,
  inbox,
  json,
  presenterState,
  react,
  registerDevice,
  requirePresenter,
  sendMessage,
  updatePoll,
  vote,
} from "@/lib/room-service";
import { room } from "@/lib/room-store";

type Ctx = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const { action } = await params;
  if (action === "inbox") return inbox(request);
  if (action === "state") {
    const denied = await requirePresenter(request);
    if (denied) return denied;
    const rx = request.nextUrl.searchParams.get("rx");
    return json(await presenterState(rx !== null && /^\d+$/.test(rx) ? Number(rx) : null));
  }
  return json({ error: "not found" }, 404);
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { action } = await params;
  // Audience endpoints
  if (action === "join") return registerDevice(request);
  if (action === "ack") return ack(request);
  if (action === "vote") return vote(request);
  if (action === "react") return react(request);

  // Presenter-only endpoints
  const denied = await requirePresenter(request);
  if (denied) return denied;
  if (action === "send") return sendMessage(request);
  if (action === "poll") return updatePoll(request);
  if (action === "reset") {
    await room().reset();
    return json({ ok: true });
  }
  return json({ error: "not found" }, 404);
}
