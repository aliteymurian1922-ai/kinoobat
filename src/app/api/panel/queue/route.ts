import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { openQueue, setQueueStatus } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const body = await req.json();
    const action = String(body.action ?? "");
    if (action === "open") {
      openQueue(ctx.business);
    } else if (action === "pause" || action === "close") {
      setQueueStatus(ctx.business.id, action === "pause" ? "paused" : "closed");
    } else {
      return NextResponse.json({ error: "عملیات نامعتبر." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
