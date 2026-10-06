import crypto from "node:crypto";
import { db } from "./db";

/**
 * Seeds a demo business (slug: demo) so the landing page
 * «نمونه صف رو ببین» always has something alive to show.
 * Idempotent: only runs when no demo business exists.
 */
export function ensureSeed(): void {
  const existing = db
    .prepare("SELECT id FROM businesses WHERE slug = ?")
    .get("demo") as { id: number } | undefined;
  if (existing) {
    refreshDemoDay();
    return;
  }

  const now = Date.now();

  const pwHash = crypto.randomBytes(32).toString("hex");
  const userRes = db
    .prepare("INSERT INTO users (name, phone, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run("رضا", "09120000000", pwHash, now);
  const ownerId = Number(userRes.lastInsertRowid);

  const bizRes = db
    .prepare(
      `INSERT INTO businesses
        (owner_id, name, slug, category, phone, address, average_service_minutes, open_time, close_time, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      ownerId,
      "آرایشگاه رضا",
      "demo",
      "آرایشگاه مردانه",
      "09121234567",
      "تهران، خیابان ولیعصر، پلاک ۱۲",
      10,
      "09:00",
      "21:00",
      now
    );
  const bizId = Number(bizRes.lastInsertRowid);

  const queueId = insertDemoQueue(bizId);
  insertDemoPeople(queueId);
}

function demoYmd(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function insertDemoQueue(bizId: number): number {
  const now = Date.now();
  const res = db
    .prepare(
      `INSERT INTO queues (business_id, date, status, current_number, average_service_minutes, created_at)
       VALUES (?, ?, 'open', 6, 10, ?)`
    )
    .run(bizId, demoYmd(), now);
  return Number(res.lastInsertRowid);
}

function insertDemoPeople(queueId: number): void {
  const now = Date.now();
  const min = 60_000;

  const people: { name: string; phone: string; status: string }[] = [
    { name: "فرهاد", phone: "09121110001", status: "completed" },
    { name: "نگین", phone: "09121110002", status: "completed" },
    { name: "امیر", phone: "09121110003", status: "completed" },
    { name: "مریم", phone: "09121110004", status: "completed" },
    { name: "حسین", phone: "09121110005", status: "completed" },
    { name: "رضا", phone: "09121110006", status: "serving" },
    { name: "محمد", phone: "09121110007", status: "waiting" },
    { name: "سارا", phone: "09121110008", status: "waiting" },
    { name: "علی", phone: "09121110009", status: "waiting" },
  ];

  const ins = db.prepare(
    `INSERT INTO queue_entries
      (queue_id, queue_number, customer_name, customer_phone, status, token, return_front, joined_at, called_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  );

  people.forEach((p, i) => {
    const num = i + 1;
    const joined = now - (people.length - i) * 7 * min;
    const called = num <= 6 ? joined + 3 * min : null;
    const completed = p.status === "completed" ? joined + 12 * min : null;
    ins.run(
      queueId,
      num,
      p.name,
      p.phone,
      p.status,
      crypto.randomBytes(24).toString("base64url"),
      joined,
      called,
      completed
    );
  });
}

/**
 * روی هر بوت: اگر برای کسب‌وکار دمو صفِ «امروز» وجود نداشت، یکی بساز
 * تا لندینگ و /q/demo هر روز زنده و قابل نمایش بمانند.
 */
function refreshDemoDay(): void {
  const biz = db
    .prepare("SELECT id FROM businesses WHERE slug = ?")
    .get("demo") as { id: number } | undefined;
  if (!biz) return;
  const hasToday = db
    .prepare("SELECT id FROM queues WHERE business_id = ? AND date = ? LIMIT 1")
    .get(biz.id, demoYmd());
  if (hasToday) return;
  const queueId = insertDemoQueue(biz.id);
  insertDemoPeople(queueId);
}
