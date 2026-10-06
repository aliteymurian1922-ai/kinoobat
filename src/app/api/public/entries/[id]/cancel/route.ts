import { NextRequest, NextResponse } from "next/server";
import { customerCancel } from "@/lib/queue";
import { fail } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const token = String(body.token ?? "");
    if (!token) return NextResponse.json({ error: "دسترسی مجاز نیست." }, { status: 403 });
    await Promise.resolve(customerCancel(Number(id), token));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
