import { NextRequest, NextResponse } from "next/server";
import { db, type UserRow } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/queue";
import { fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone ?? ""));
    const password = String(body.password ?? "");

    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as
      | UserRow
      | undefined;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "شماره یا رمز عبور درست نیست." }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
