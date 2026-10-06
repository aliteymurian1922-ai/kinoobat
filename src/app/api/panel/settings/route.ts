import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { updateSettings } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const body = await req.json();
    updateSettings(ctx.business.id, {
      name: body.name,
      category: body.category,
      phone: body.phone,
      address: body.address,
      avgMinutes: body.avgMinutes,
      openTime: body.openTime,
      closeTime: body.closeTime,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
