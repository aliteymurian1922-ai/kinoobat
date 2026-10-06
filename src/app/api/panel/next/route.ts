import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { callNext } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function POST() {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    callNext(ctx.business.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
