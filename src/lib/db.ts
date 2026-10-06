import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { ensureSeed } from "./seed";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = process.env.KINOOBAT_DB ?? path.join(dataDir, "kinoobat.db");

const g = globalThis as unknown as { __kinoobatDb?: DatabaseSync };

export const db: DatabaseSync = g.__kinoobatDb ?? new DatabaseSync(dbPath);
g.__kinoobatDb = db;

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'سایر',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  average_service_minutes INTEGER NOT NULL DEFAULT 10,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '21:00',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS queues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL REFERENCES businesses(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  current_number INTEGER NOT NULL DEFAULT 0,
  average_service_minutes INTEGER NOT NULL DEFAULT 10,
  created_at INTEGER NOT NULL,
  closed_at INTEGER,
  UNIQUE (business_id, date)
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id INTEGER NOT NULL REFERENCES queues(id),
  queue_number INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting',
  source TEXT NOT NULL DEFAULT 'public',
  token TEXT NOT NULL,
  return_front INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL,
  called_at INTEGER,
  completed_at INTEGER,
  UNIQUE (queue_id, queue_number)
);

CREATE INDEX IF NOT EXISTS idx_entries_queue ON queue_entries(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_queues_business ON queues(business_id, date);
`);

export interface UserRow {
  id: number;
  name: string;
  phone: string;
  password_hash: string;
  created_at: number;
}

export interface BusinessRow {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  category: string;
  phone: string;
  address: string;
  average_service_minutes: number;
  open_time: string;
  close_time: string;
  created_at: number;
}

export interface ServiceRow {
  id: number;
  business_id: number;
  name: string;
  duration_minutes: number;
  is_active: number;
}

export interface QueueRow {
  id: number;
  business_id: number;
  date: string;
  status: string;
  current_number: number;
  average_service_minutes: number;
  created_at: number;
  closed_at: number | null;
}

export interface EntryRow {
  id: number;
  queue_id: number;
  queue_number: number;
  customer_name: string;
  customer_phone: string;
  service_id: number | null;
  status: string;
  source: string;
  token: string;
  return_front: number;
  joined_at: number;
  called_at: number | null;
  completed_at: number | null;
}

ensureSeed();
