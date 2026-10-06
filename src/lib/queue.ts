import crypto from "node:crypto";
import { db, type BusinessRow, type EntryRow, type QueueRow, type ServiceRow } from "./db";
import type {
  EntryDTO,
  HistoryRow,
  OwnerState,
  PublicState,
  RailItem,
} from "./types";

export class QueueError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const MIN = 60_000;

export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const FA_DIGIT_MAP: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** Normalize an Iranian mobile number typed with latin or Persian digits. */
export function normalizePhone(raw: string): string {
  let s = String(raw ?? "").trim();
  s = s.replace(/[۰-۹]/g, (d) => FA_DIGIT_MAP[d] ?? d);
  s = s.replace(/[^\d+]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  return s;
}

export function isValidMobile(p: string): boolean {
  return /^09\d{9}$/.test(p);
}

/* ------------------------------------------------------------------ */
/* Queue core                                                          */
/* ------------------------------------------------------------------ */

export function getTodayQueue(businessId: number): QueueRow | null {
  const row = db
    .prepare("SELECT * FROM queues WHERE business_id = ? AND date = ? LIMIT 1")
    .get(businessId, todayLocal()) as QueueRow | undefined;
  return row ?? null;
}

export function ensureQueue(business: BusinessRow): QueueRow {
  const existing = getTodayQueue(business.id);
  if (existing) return existing;
  db.prepare(
    `INSERT INTO queues (business_id, date, status, current_number, average_service_minutes, created_at)
     VALUES (?, ?, 'open', 0, ?, ?)`
  ).run(business.id, todayLocal(), business.average_service_minutes, Date.now());
  return getTodayQueue(business.id) as QueueRow;
}

export function openQueue(business: BusinessRow): QueueRow {
  const q = getTodayQueue(business.id);
  if (!q) return ensureQueue(business);
  if (q.status !== "open") {
    // «ادامه بده» after pause and «باز کردن صف» after close both land here.
    db.prepare("UPDATE queues SET status = 'open', closed_at = NULL WHERE id = ?").run(q.id);
  }
  return getTodayQueue(business.id) as QueueRow;
}

export function setQueueStatus(businessId: number, status: "open" | "paused" | "closed"): QueueRow {
  const q = getTodayQueue(businessId);
  if (!q) throw new QueueError("امروز صفی باز نشده.");
  if (status === "closed") {
    db.prepare("UPDATE queues SET status = ?, closed_at = ? WHERE id = ?").run(status, Date.now(), q.id);
  } else {
    db.prepare("UPDATE queues SET status = ?, closed_at = NULL WHERE id = ?").run(status, q.id);
  }
  return getTodayQueue(businessId) as QueueRow;
}

function getServing(queueId: number): EntryRow | null {
  const row = db
    .prepare("SELECT * FROM queue_entries WHERE queue_id = ? AND status = 'serving' LIMIT 1")
    .get(queueId) as EntryRow | undefined;
  return row ?? null;
}

function nextWaiting(queueId: number): EntryRow | null {
  const row = db
    .prepare(
      `SELECT * FROM queue_entries WHERE queue_id = ? AND status = 'waiting'
       ORDER BY return_front DESC, queue_number ASC LIMIT 1`
    )
    .get(queueId) as EntryRow | undefined;
  return row ?? null;
}

/** Advance the queue: optionally complete the current person, then call the next one. */
function advance(queueId: number, completeCurrent: boolean): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    const q = db.prepare("SELECT * FROM queues WHERE id = ?").get(queueId) as QueueRow | undefined;
    if (!q) throw new QueueError("صف پیدا نشد.");
    const cur = completeCurrent ? getServing(queueId) : null;
    if (cur) {
      db.prepare("UPDATE queue_entries SET status = 'completed', completed_at = ? WHERE id = ?").run(
        Date.now(),
        cur.id
      );
    }
    const nx = nextWaiting(queueId);
    let currentNumber = q.current_number;
    if (nx) {
      db.prepare("UPDATE queue_entries SET status = 'serving', called_at = ?, return_front = 0 WHERE id = ?").run(
        Date.now(),
        nx.id
      );
      currentNumber = nx.queue_number;
    } else if (cur) {
      currentNumber = cur.queue_number;
    }
    db.prepare("UPDATE queues SET current_number = ? WHERE id = ?").run(currentNumber, queueId);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function callNext(businessId: number): void {
  const q = getTodayQueue(businessId);
  if (!q) throw new QueueError("امروز صفی باز نشده.");
  if (q.status === "closed") throw new QueueError("صف امروز بسته است.");
  if (q.status === "paused") throw new QueueError("صف موقتاً متوقفه. اول ادامه بده.");
  if (!getServing(q.id) && !nextWaiting(q.id)) {
    throw new QueueError("فعلاً کسی تو صف نیست.");
  }
  advance(q.id, true);
}

export function actOnEntry(
  businessId: number,
  entryId: number,
  action: "call" | "skip" | "absent" | "restore" | "cancel"
): void {
  const q = getTodayQueue(businessId);
  if (!q) throw new QueueError("امروز صفی باز نشده.");
  const entry = db
    .prepare("SELECT * FROM queue_entries WHERE id = ? AND queue_id = ?")
    .get(entryId, q.id) as EntryRow | undefined;
  if (!entry) throw new QueueError("این نوبت توی صف امروز نیست.");

  switch (action) {
    case "call": {
      if (q.status === "closed") throw new QueueError("صف امروز بسته است.");
      if (entry.status !== "waiting") throw new QueueError("این نوبت دیگه توی صف انتظار نیست.");
      if (getServing(q.id)) throw new QueueError("اول نفر فعلی رو کامل کن.");
      db.prepare("UPDATE queue_entries SET status = 'serving', called_at = ? WHERE id = ?").run(
        Date.now(),
        entry.id
      );
      db.prepare("UPDATE queues SET current_number = ? WHERE id = ?").run(entry.queue_number, q.id);
      return;
    }
    case "skip": {
      if (entry.status !== "serving") throw new QueueError("فقط نوبتِ در حال سرویس رو می‌شه رد کرد.");
      db.prepare("UPDATE queue_entries SET status = 'skipped' WHERE id = ?").run(entry.id);
      advance(q.id, false);
      return;
    }
    case "absent": {
      if (entry.status !== "serving") throw new QueueError("فقط نوبتِ در حال سرویس رو می‌شه غیبت داد.");
      db.prepare("UPDATE queue_entries SET status = 'absent', completed_at = ? WHERE id = ?").run(
        Date.now(),
        entry.id
      );
      advance(q.id, false);
      return;
    }
    case "restore": {
      if (entry.status !== "skipped") throw new QueueError("فقط نوبت‌های ردشده برمی‌گردن.");
      db.prepare("UPDATE queue_entries SET status = 'waiting', return_front = 1 WHERE id = ?").run(entry.id);
      return;
    }
    case "cancel": {
      if (!["waiting", "skipped"].includes(entry.status)) {
        throw new QueueError("این نوبت قابل حذف نیست.");
      }
      db.prepare("UPDATE queue_entries SET status = 'cancelled', completed_at = ? WHERE id = ?").run(
        Date.now(),
        entry.id
      );
      return;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Joining (public)                                                    */
/* ------------------------------------------------------------------ */

export interface JoinResult {
  entryId: number;
  token: string;
  number: number;
  existing: boolean;
}

export function joinQueue(
  slug: string,
  name: string,
  phoneRaw: string,
  serviceId: number | null
): JoinResult {
  const business = getBusinessBySlug(slug);
  if (!business) throw new QueueError("این کسب‌وکار پیدا نشد.", 404);
  const q = getTodayQueue(business.id);
  if (!q) throw new QueueError("صف امروز هنوز باز نشده.");
  if (q.status === "closed") throw new QueueError("صف امروز بسته است.");

  const cleanName = String(name ?? "").trim().slice(0, 60);
  if (cleanName.length < 2) throw new QueueError("اسم رو کامل بنویس.");
  const phone = normalizePhone(phoneRaw);
  if (!isValidMobile(phone)) throw new QueueError("شماره موبایل معتبر نیست. مثل ۰۹۱۲۳۴۵۶۷۸۹ بنویس.");

  const existing = db
    .prepare(
      `SELECT * FROM queue_entries WHERE queue_id = ? AND customer_phone = ? AND status IN ('waiting','serving') LIMIT 1`
    )
    .get(q.id, phone) as EntryRow | undefined;
  if (existing) {
    return { entryId: existing.id, token: existing.token, number: existing.queue_number, existing: true };
  }

  if (serviceId != null) {
    const svc = db
      .prepare("SELECT id FROM services WHERE id = ? AND business_id = ? AND is_active = 1")
      .get(serviceId, business.id);
    if (!svc) serviceId = null;
  }

  const maxRow = db
    .prepare("SELECT COALESCE(MAX(queue_number), 0) AS m FROM queue_entries WHERE queue_id = ?")
    .get(q.id) as { m: number };
  const number = maxRow.m + 1;
  const token = crypto.randomBytes(24).toString("base64url");

  const res = db
    .prepare(
      `INSERT INTO queue_entries
        (queue_id, queue_number, customer_name, customer_phone, service_id, status, source, token, return_front, joined_at)
       VALUES (?, ?, ?, ?, ?, 'waiting', 'public', ?, 0, ?)`
    )
    .run(q.id, number, cleanName, phone, serviceId, token, Date.now());

  return { entryId: Number(res.lastInsertRowid), token, number, existing: false };
}

export function addManualEntry(businessId: number, name: string, phoneRaw: string): void {
  const q = getTodayQueue(businessId);
  if (!q) throw new QueueError("اول صف امروز رو باز کن.");
  if (q.status === "closed") throw new QueueError("صف امروز بسته است.");
  const cleanName = String(name ?? "").trim().slice(0, 60);
  if (cleanName.length < 2) throw new QueueError("اسم مشتری رو بنویس.");
  const phone = normalizePhone(phoneRaw);
  if (phone !== "" && !isValidMobile(phone)) throw new QueueError("شماره موبایل معتبر نیست.");

  const maxRow = db
    .prepare("SELECT COALESCE(MAX(queue_number), 0) AS m FROM queue_entries WHERE queue_id = ?")
    .get(q.id) as { m: number };
  db.prepare(
    `INSERT INTO queue_entries
      (queue_id, queue_number, customer_name, customer_phone, status, source, token, return_front, joined_at)
     VALUES (?, ?, ?, ?, 'waiting', 'manual', ?, 0, ?)`
  ).run(q.id, maxRow.m + 1, cleanName, phone, crypto.randomBytes(24).toString("base64url"), Date.now());
}

export function customerCancel(entryId: number, token: string): void {
  const entry = db
    .prepare("SELECT * FROM queue_entries WHERE id = ? AND token = ?")
    .get(entryId, token) as EntryRow | undefined;
  if (!entry) throw new QueueError("نوبت پیدا نشد.", 404);
  if (entry.status !== "waiting" && entry.status !== "skipped") {
    throw new QueueError("این نوبت دیگه قابل لغو نیست.");
  }
  db.prepare("UPDATE queue_entries SET status = 'cancelled', completed_at = ? WHERE id = ?").run(
    Date.now(),
    entry.id
  );
}

/* ------------------------------------------------------------------ */
/* State builders                                                      */
/* ------------------------------------------------------------------ */

export function getBusinessBySlug(slug: string): BusinessRow | null {
  const row = db.prepare("SELECT * FROM businesses WHERE slug = ?").get(slug) as
    | BusinessRow
    | undefined;
  return row ?? null;
}

function entryDTO(e: EntryRow, avg: number, all: EntryRow[]): EntryDTO {
  let waitMin = 0;
  if (e.status === "waiting") {
    const ahead = all.filter(
      (o) =>
        o.status === "waiting" &&
        (o.return_front > e.return_front ||
          (o.return_front === e.return_front && o.queue_number < e.queue_number))
    ).length;
    waitMin = ahead * avg;
  }
  return {
    id: e.id,
    number: e.queue_number,
    name: e.customer_name,
    status: e.status as EntryDTO["status"],
    joinedAt: e.joined_at,
    calledAt: e.called_at,
    completedAt: e.completed_at,
    waitMin,
  };
}

function activeServices(businessId: number) {
  return (
    db
      .prepare("SELECT id, name FROM services WHERE business_id = ? AND is_active = 1 ORDER BY id")
      .all(businessId) as unknown as { id: number; name: string }[]
  );
}

export function publicState(
  slug: string,
  meRef?: { id: number; token: string } | null
): PublicState | null {
  const business = getBusinessBySlug(slug);
  if (!business) return null;
  const q = getTodayQueue(business.id);
  const avg = q?.average_service_minutes ?? business.average_service_minutes;

  let entries: EntryRow[] = [];
  if (q) {
    entries = db
      .prepare("SELECT * FROM queue_entries WHERE queue_id = ? ORDER BY queue_number ASC")
      .all(q.id) as unknown as EntryRow[];
  }

  const waiting = entries.filter((e) => e.status === "waiting");
  const serving = entries.find((e) => e.status === "serving") ?? null;
  const done = entries.filter((e) => e.status === "completed");

  // Validating "me"
  let me: PublicState["me"] = null;
  if (meRef) {
    const mine = entries.find((e) => e.id === meRef.id && e.token === meRef.token);
    if (mine) {
      const dto = entryDTO(mine, avg, entries);
      me = {
        id: mine.id,
        number: mine.queue_number,
        status: dto.status,
        name: mine.customer_name,
        peopleAhead: dto.waitMin / Math.max(avg, 1),
        waitMin: dto.waitMin,
      };
    }
  }

  const rail: RailItem[] = [];
  for (const e of done.slice(-2)) rail.push({ n: e.queue_number, s: "done", me: false });
  if (serving) rail.push({ n: serving.queue_number, s: "now", me: false });
  for (const e of waiting.slice(0, 4)) {
    rail.push({ n: e.queue_number, s: "up", me: me ? e.id === me.id : false });
  }
  if (me) {
    for (const r of rail) if (r.n === me.number) r.me = true;
  }

  return {
    business: {
      name: business.name,
      category: business.category,
      phone: business.phone,
      address: business.address,
      openTime: business.open_time,
      closeTime: business.close_time,
    },
    queueStatus: q ? (q.status as PublicState["queueStatus"]) : "none",
    currentNumber: serving?.queue_number ?? q?.current_number ?? null,
    waitingCount: waiting.length,
    estWaitMin: waiting.length * avg,
    rail,
    services: activeServices(business.id),
    me,
  };
}

export function ownerState(business: BusinessRow): OwnerState {
  const q = getTodayQueue(business.id);
  const avg = q?.average_service_minutes ?? business.average_service_minutes;

  let entries: EntryRow[] = [];
  if (q) {
    entries = db
      .prepare("SELECT * FROM queue_entries WHERE queue_id = ? ORDER BY queue_number ASC")
      .all(q.id) as unknown as EntryRow[];
  }
  const waiting = entries.filter((e) => e.status === "waiting");
  const serving = entries.find((e) => e.status === "serving") ?? null;
  const next = waiting[0] ?? null;
  const doneToday = entries.filter((e) => ["completed", "absent"].includes(e.status)).length;

  const services = (
    db
      .prepare("SELECT * FROM services WHERE business_id = ? ORDER BY id")
      .all(business.id) as unknown as ServiceRow[]
  ).map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.duration_minutes,
    isActive: s.is_active === 1,
  }));

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      category: business.category,
      phone: business.phone,
      address: business.address,
      avgMinutes: business.average_service_minutes,
      openTime: business.open_time,
      closeTime: business.close_time,
    },
    queue: q
      ? {
          id: q.id,
          date: q.date,
          status: q.status as "open" | "paused" | "closed",
          currentNumber: q.current_number,
          avgMinutes: avg,
        }
      : null,
    current: serving
      ? { id: serving.id, number: serving.queue_number, name: serving.customer_name, calledAt: serving.called_at }
      : null,
    next: next
      ? {
          id: next.id,
          number: next.queue_number,
          name: next.customer_name,
          waitMin: 0,
        }
      : null,
    waiting: waiting.map((e) => entryDTO(e, avg, entries)),
    skipped: entries
      .filter((e) => e.status === "skipped")
      .map((e) => ({ id: e.id, number: e.queue_number, name: e.customer_name })),
    stats: {
      waitingCount: waiting.length,
      estWaitMin: waiting.length * avg,
      doneToday,
    },
    services,
  };
}

export function history(businessId: number): HistoryRow[] {
  return db
    .prepare(
      `SELECT q.date, q.status,
        (SELECT COUNT(*) FROM queue_entries e WHERE e.queue_id = q.id) AS total,
        (SELECT COUNT(*) FROM queue_entries e WHERE e.queue_id = q.id AND e.status = 'completed') AS completed,
        (SELECT COUNT(*) FROM queue_entries e WHERE e.queue_id = q.id AND e.status = 'absent') AS absent,
        (SELECT COUNT(*) FROM queue_entries e WHERE e.queue_id = q.id AND e.status = 'cancelled') AS cancelled
       FROM queues q WHERE q.business_id = ? ORDER BY q.date DESC LIMIT 60`
    )
    .all(businessId) as unknown as HistoryRow[];
}

/* ------------------------------------------------------------------ */
/* Settings & services                                                 */
/* ------------------------------------------------------------------ */

export interface BusinessSettings {
  name?: string;
  category?: string;
  phone?: string;
  address?: string;
  avgMinutes?: number;
  openTime?: string;
  closeTime?: string;
}

export function updateSettings(businessId: number, s: BusinessSettings): void {
  const b = db.prepare("SELECT * FROM businesses WHERE id = ?").get(businessId) as
    | BusinessRow
    | undefined;
  if (!b) throw new QueueError("کسب‌وکار پیدا نشد.", 404);

  const name = s.name !== undefined ? String(s.name).trim().slice(0, 80) : b.name;
  if (name.length < 2) throw new QueueError("نام کسب‌وکار رو کامل بنویس.");
  const category = s.category !== undefined ? String(s.category).trim().slice(0, 40) : b.category;
  const phone = s.phone !== undefined ? normalizePhone(s.phone) : b.phone;
  const address = s.address !== undefined ? String(s.address).trim().slice(0, 200) : b.address;
  const avgMinutes =
    s.avgMinutes !== undefined
      ? Math.min(120, Math.max(1, Math.round(Number(s.avgMinutes) || 10)))
      : b.average_service_minutes;
  const timeRe = /^\d{1,2}:\d{2}$/;
  const openTime = s.openTime !== undefined && timeRe.test(s.openTime) ? s.openTime : b.open_time;
  const closeTime = s.closeTime !== undefined && timeRe.test(s.closeTime) ? s.closeTime : b.close_time;

  db.prepare(
    `UPDATE businesses SET name = ?, category = ?, phone = ?, address = ?,
      average_service_minutes = ?, open_time = ?, close_time = ? WHERE id = ?`
  ).run(name, category, phone, address, avgMinutes, openTime, closeTime, businessId);

  const q = getTodayQueue(businessId);
  if (q && q.status !== "closed") {
    db.prepare("UPDATE queues SET average_service_minutes = ? WHERE id = ?").run(avgMinutes, q.id);
  }
}

export function addService(businessId: number, name: string, durationMinutes: number): void {
  const clean = String(name ?? "").trim().slice(0, 60);
  if (clean.length < 2) throw new QueueError("نام خدمت رو بنویس.");
  const dur = Math.min(240, Math.max(1, Math.round(Number(durationMinutes) || 10)));
  db.prepare("INSERT INTO services (business_id, name, duration_minutes, is_active) VALUES (?, ?, ?, 1)").run(
    businessId,
    clean,
    dur
  );
}

export function setServiceActive(businessId: number, serviceId: number, isActive: boolean): void {
  db.prepare("UPDATE services SET is_active = ? WHERE id = ? AND business_id = ?").run(
    isActive ? 1 : 0,
    serviceId,
    businessId
  );
}

export function deleteService(businessId: number, serviceId: number): void {
  db.prepare("DELETE FROM services WHERE id = ? AND business_id = ?").run(serviceId, businessId);
}
