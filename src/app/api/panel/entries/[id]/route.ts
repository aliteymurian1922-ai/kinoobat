import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { actOnEntry } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

const ACTIONS = new Set(["call", "skip", "absent", "restore", "cancel"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const action = String(body.action ?? "");
    if (!ACTIONS.has(action)) {
      return NextResponse.json({ error: "عملیات نامعتبر." }, { status: 400 });
    }
    actOnEntry(ctx.business.id, Number(id), action as "call" | "skip" | "absent" | "restore" | "cancel");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
