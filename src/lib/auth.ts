import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db, type BusinessRow, type UserRow } from "./db";
import { QueueError } from "./queue";

const SECRET = process.env.APP_SECRET || "kinoobat-dev-secret";
const COOKIE = "kn_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pw, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export async function createSession(userId: number): Promise<void> {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `${userId}.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (sign(`${uid}.${exp}`) !== sig) return null;
  if (Number(exp) < Date.now()) return null;
  const id = Number(uid);
  return Number.isFinite(id) ? id : null;
}

export interface OwnerContext {
  user: UserRow;
  business: BusinessRow;
}

export async function getCurrentOwner(): Promise<OwnerContext | null> {
  const uid = await getSessionUserId();
  if (!uid) return null;
  const row = db
    .prepare(
      `SELECT u.*, b.id AS biz_id FROM users u
       LEFT JOIN businesses b ON b.owner_id = u.id
       WHERE u.id = ? LIMIT 1`
    )
    .get(uid) as (UserRow & { biz_id: number | null }) | undefined;
  if (!row) return null;
  const user: UserRow = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    password_hash: row.password_hash,
    created_at: row.created_at,
  };
  if (row.biz_id == null) return { user, business: null as unknown as BusinessRow };
  const biz = db
    .prepare("SELECT * FROM businesses WHERE id = ?")
    .get(row.biz_id) as BusinessRow | undefined;
  return { user, business: biz as BusinessRow };
}

/** Owner with an existing business — for all /panel routes. */
export async function requireBusiness(): Promise<OwnerContext | null> {
  const ctx = await getCurrentOwner();
  if (!ctx) return null;
  if (!ctx.business) {
    throw new QueueError("اول کسب‌وکارت رو ثبت کن.", 403);
  }
  return ctx;
}
