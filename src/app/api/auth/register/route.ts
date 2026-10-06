import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { isValidMobile, normalizePhone } from "@/lib/queue";
import { fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 60);
    const phone = normalizePhone(String(body.phone ?? ""));
    const password = String(body.password ?? "");

    if (name.length < 2) return NextResponse.json({ error: "اسمت رو بنویس." }, { status: 400 });
    if (!isValidMobile(phone))
      return NextResponse.json({ error: "شماره موبایل معتبر نیست. مثل ۰۹۱۲۳۴۵۶۷۸۹." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "رمز عبور حداقل ۶ کاراکتر باشه." }, { status: 400 });

    const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existing)
      return NextResponse.json({ error: "این شماره قبلاً ثبت شده. وارد شو." }, { status: 409 });

    const res = db
      .prepare("INSERT INTO users (name, phone, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(name, phone, hashPassword(password), Date.now());
    await createSession(Number(res.lastInsertRowid));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
