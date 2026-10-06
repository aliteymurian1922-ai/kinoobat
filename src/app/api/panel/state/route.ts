import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { ownerState } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    return NextResponse.json(ownerState(ctx.business));
  } catch (e) {
    return fail(e);
  }
}
