import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { addManualEntry } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const body = await req.json();
    addManualEntry(ctx.business.id, String(body.name ?? ""), String(body.phone ?? ""));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
