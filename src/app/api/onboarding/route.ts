import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentOwner } from "@/lib/auth";
import { fail, unauthorized } from "@/lib/api";
import { isValidMobile, normalizePhone, QueueError, todayLocal } from "@/lib/queue";

const RESERVED = new Set([
  "api", "q", "panel", "login", "register", "onboarding", "demo", "public", "static", "_next",
]);

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentOwner();
    if (!ctx) return unauthorized();
    if (ctx.business) return NextResponse.json({ error: "کسب‌وکار تو از قبل ثبت شده." }, { status: 409 });

    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 80);
    const category = String(body.category ?? "").trim().slice(0, 40) || "سایر";
    const phone = normalizePhone(String(body.phone ?? ""));
    const avgMinutes = Math.min(120, Math.max(1, Math.round(Number(body.avgMinutes) || 10)));
    const openTime = String(body.openTime ?? "09:00");
    const closeTime = String(body.closeTime ?? "21:00");
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase();

    if (name.length < 2) throw new QueueError("نام کسب‌وکار رو بنویس.");
    if (!isValidMobile(phone)) throw new QueueError("شماره تماس معتبر نیست.");
    if (!/^[a-z0-9][a-z0-9-]{2,23}$/.test(slug))
      throw new QueueError("آدرس صف: حروف انگلیسی کوچک، عدد و خط تیره (۳ تا ۲۴ کاراکتر).");
    if (RESERVED.has(slug)) throw new QueueError("این آدرس رزرو شده. یکی دیگه انتخاب کن.");

    const taken = db.prepare("SELECT id FROM businesses WHERE slug = ?").get(slug);
    if (taken) throw new QueueError("این آدرس قبلاً گرفته شده. یکی دیگه انتخاب کن.");

    const res = db
      .prepare(
        `INSERT INTO businesses
          (owner_id, name, slug, category, phone, address, average_service_minutes, open_time, close_time, created_at)
         VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)`
      )
      .run(ctx.user.id, name, slug, category, phone, avgMinutes, openTime, closeTime, Date.now());

    // Open today's queue right away — the owner should see a working screen.
    const bizId = Number(res.lastInsertRowid);
    db.prepare(
      `INSERT INTO queues (business_id, date, status, current_number, average_service_minutes, created_at)
       VALUES (?, ?, 'open', 0, ?, ?)`
    ).run(bizId, todayLocal(), avgMinutes, Date.now());

    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return fail(e);
  }
}
