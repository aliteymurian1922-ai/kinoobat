import { NextRequest, NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { addService, deleteService, setServiceActive } from "@/lib/queue";
import { fail, unauthorized } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const body = await req.json();
    addService(ctx.business.id, String(body.name ?? ""), Number(body.durationMinutes ?? 10));
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const body = await req.json();
    setServiceActive(ctx.business.id, Number(body.id), Boolean(body.isActive));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireBusiness();
    if (!ctx) return unauthorized();
    const id = Number(req.nextUrl.searchParams.get("id") ?? "");
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "شناسه نامعتبر." }, { status: 400 });
    }
    deleteService(ctx.business.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
