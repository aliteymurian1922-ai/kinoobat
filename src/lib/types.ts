export type QueueStatus = "open" | "paused" | "closed";
export type EntryStatus =
  | "waiting"
  | "serving"
  | "completed"
  | "skipped"
  | "cancelled"
  | "absent";

export interface BusinessDTO {
  id: number;
  name: string;
  slug: string;
  category: string;
  phone: string;
  address: string;
  avgMinutes: number;
  openTime: string;
  closeTime: string;
}

export interface EntryDTO {
  id: number;
  number: number;
  name: string;
  status: EntryStatus;
  joinedAt: number;
  calledAt: number | null;
  completedAt: number | null;
  waitMin: number;
  serviceName?: string | null;
}

export interface RailItem {
  n: number;
  s: "done" | "now" | "up";
  me: boolean;
}

export interface PublicState {
  business: {
    name: string;
    category: string;
    phone: string;
    address: string;
    openTime: string;
    closeTime: string;
  };
  queueStatus: QueueStatus | "none";
  currentNumber: number | null;
  waitingCount: number;
  estWaitMin: number;
  rail: RailItem[];
  services: { id: number; name: string }[];
  me: null | {
    id: number;
    number: number;
    status: EntryStatus;
    name: string;
    peopleAhead: number;
    waitMin: number;
  };
}

export interface OwnerState {
  business: BusinessDTO;
  queue: {
    id: number;
    date: string;
    status: QueueStatus;
    currentNumber: number;
    avgMinutes: number;
  } | null;
  current: { id: number; number: number; name: string; calledAt: number | null } | null;
  next: { id: number; number: number; name: string; waitMin: number } | null;
  waiting: EntryDTO[];
  skipped: { id: number; number: number; name: string }[];
  stats: { waitingCount: number; estWaitMin: number; doneToday: number };
  services: { id: number; name: string; durationMinutes: number; isActive: boolean }[];
}

export interface HistoryRow {
  date: string;
  status: QueueStatus;
  total: number;
  completed: number;
  absent: number;
  cancelled: number;
}
