"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  UserRoundX,
  X,
} from "lucide-react";
import { usePolling, postJson } from "@/lib/client";
import { fa, faNum, faTime } from "@/lib/format";
import { StatusChip, TextInput, ErrorText, Field } from "@/components/ui";
import type { OwnerState } from "@/lib/types";

export default function PanelClient({
  today,
  welcome,
  ownerName,
}: {
  today: string;
  welcome: boolean;
  ownerName: string;
}) {
  const { data, error, refresh } = usePolling<OwnerState>("/api/panel/state", 3000);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setActionErr(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "مشکلی پیش آمد.");
    } finally {
      setBusy(false);
    }
  };

  const post = (url: string, body?: unknown) => act(() => postJson(url, body ?? {}));

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-sm font-bold text-muted soft-pulse">یه لحظه…</p>
        {error && <div className="mt-4"><ErrorText>{error}</ErrorText></div>}
      </main>
    );
  }

  const { business, queue, current, next, waiting, skipped, stats } = data;
  const status = queue?.status ?? "closed";
  const hasEntries = !!current || waiting.length > 0 || skipped.length > 0;

  // The one primary action, always meaningful.
  let primary: { label: string; onClick: () => void; disabled?: boolean } | null = null;
  if (status === "closed") {
    primary = { label: "باز کردن صف", onClick: () => post("/api/panel/queue", { action: "open" }) };
  } else if (status === "paused") {
    primary = { label: "ادامه بده", onClick: () => post("/api/panel/queue", { action: "open" }) };
  } else if (current || waiting.length > 0) {
    primary = { label: "نفر بعدی", onClick: () => post("/api/panel/next") };
  } else {
    primary = { label: "افزودن دستی نوبت", onClick: () => setShowAdd(true) };
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-6 lg:max-w-5xl">
      {welcome && (
        <div className="ticket-in ticket mb-5 flex items-center justify-between gap-3 border-ok/30 bg-ok-soft/60 px-4 py-3">
          <p className="text-sm font-bold text-ink-soft">
            صف امروزت بازه! کد QR رو چاپ کن و بذار جلوی مغازه.
          </p>
          <Link
            href="/panel/qr"
            className="shrink-0 rounded-xl bg-ok px-3 py-2 text-xs font-black text-white"
          >
            دیدن QR
          </Link>
        </div>
      )}

      {/* header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">{business.name}</h1>
          <p className="mt-0.5 text-sm text-muted">امروز · {today}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status !== "closed" && (
            <button
              onClick={() => post("/api/panel/queue", { action: status === "paused" ? "open" : "pause" })}
              disabled={busy}
              aria-label={status === "paused" ? "ادامه" : "توقف موقت"}
              title={status === "paused" ? "ادامه" : "توقف موقت"}
              className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
            >
              {status === "paused" ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
            </button>
          )}
          {status !== "closed" && (
            <button
              onClick={() => {
                if (confirm("صف امروز رو می‌بندی؟ مشتری‌های جدید نمی‌تونن نوبت بگیرن.")) {
                  post("/api/panel/queue", { action: "close" });
                }
              }}
              disabled={busy}
              aria-label="بستن صف"
              title="بستن صف"
              className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-danger transition-colors hover:border-danger/40 disabled:opacity-50"
            >
              <Ban size={18} aria-hidden />
            </button>
          )}
        </div>
      </header>
      <div className="mt-3">
        <StatusChip status={status} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
        {/* control column */}
        <section>
          <div className="ticket px-5 pt-6 pb-5 text-center">
            <p className="text-xs font-bold text-muted">الان نوبت</p>
            <p
              key={current?.number ?? 0}
              className="num-display num-in mt-2 text-[96px]"
              aria-live="polite"
            >
              {current ? faNum(current.number) : "—"}
            </p>
            {current && (
              <p className="mt-1 text-sm text-muted">
                <span className="font-black text-ink">{current.name}</span>
                <span className="mx-1 text-faint">·</span>
                از ساعت {faTime(current.calledAt)}
              </p>
            )}
          </div>

          <div className="perf-line my-5" />

          {/* next */}
          <div className="min-h-[64px] text-center">
            {next ? (
              <div className="flex items-center justify-center gap-3">
                <span className="num-display text-4xl text-ink">{faNum(next.number)}</span>
                <span className="text-faint" aria-hidden>
                  ·
                </span>
                <span className="text-lg font-bold text-ink-soft">{next.name}</span>
              </div>
            ) : (
              <p className="pt-2 text-sm font-bold text-muted">
                {current ? "بعدی کسی نیست — این آخریه." : "بعدی کسی نیست."}
              </p>
            )}
          </div>

          {actionErr && (
            <div className="mt-3">
              <ErrorText>{actionErr}</ErrorText>
            </div>
          )}

          {/* the button */}
          <button
            onClick={primary.onClick}
            disabled={busy || !!primary.disabled}
            className="btn-press mt-3 min-h-[76px] w-full rounded-[20px] bg-accent text-2xl font-black text-white"
          >
            {busy ? "…" : primary.label}
          </button>

          {/* secondary actions for the person being served */}
          {current && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => post(`/api/panel/entries/${current.id}`, { action: "skip" })}
                disabled={busy}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-bold text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
              >
                <SkipForward size={16} aria-hidden />
                رد کردن
              </button>
              <button
                onClick={() => post(`/api/panel/entries/${current.id}`, { action: "absent" })}
                disabled={busy}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-bold text-ink-soft transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
              >
                <UserRoundX size={16} aria-hidden />
                غیبت
              </button>
            </div>
          )}

          {/* manual add */}
          {showAdd && status !== "closed" && (
            <ManualAddForm
              onDone={() => {
                setShowAdd(false);
                refresh();
              }}
              onCancel={() => setShowAdd(false)}
            />
          )}

          <p className="mt-4 text-center text-xs text-faint lg:hidden">
            {ownerName ? `${ownerName} جان، ` : ""}این صفحه رو باز نگه دار تا صف زنده بمونه.
          </p>
        </section>

        {/* queue column */}
        <section className="mt-8 lg:mt-0">
          <QueueListSection
            waiting={waiting}
            stats={stats}
            skipped={skipped}
            busy={busy}
            hasEntries={hasEntries}
            status={status}
            onAdd={() => setShowAdd(true)}
            onAction={(id, action) => post(`/api/panel/entries/${id}`, { action })}
          />
        </section>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function QueueListSection({
  waiting,
  stats,
  skipped,
  busy,
  hasEntries,
  status,
  onAdd,
  onAction,
}: {
  waiting: OwnerState["waiting"];
  stats: OwnerState["stats"];
  skipped: OwnerState["skipped"];
  busy: boolean;
  hasEntries: boolean;
  status: string;
  onAdd: () => void;
  onAction: (id: number, action: string) => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (!hasEntries) {
    return (
      <div className="ticket px-6 py-12 text-center">
        <div className="calm-float mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-dashed border-line text-2xl text-faint">
          —
        </div>
        <h2 className="mt-4 text-lg font-black">فعلاً کسی تو صف نیست.</h2>
        <p className="mt-1.5 text-sm text-muted">یه نفس راحت بکش، فعلاً خبری نیست.</p>
        {status !== "closed" && (
          <button
            onClick={onAdd}
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-ink-soft transition-colors hover:border-ink/30"
          >
            <Plus size={16} aria-hidden />
            افزودن دستی نوبت
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-black">صف امروز</h2>
        {stats.waitingCount > 0 && (
          <p className="text-sm text-muted">
            <span className="font-black text-ink">{fa(stats.waitingCount)}</span> نفر ·{" "}
            حدود {fa(stats.estWaitMin)} دقیقه
          </p>
        )}
      </div>

      {waiting.length === 0 ? (
        <p className="ticket mt-3 px-4 py-6 text-center text-sm text-muted">
          کسی تو انتظار نیست.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {waiting.map((e) => (
            <li key={e.id} className="ticket overflow-hidden">
              <button
                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start"
                aria-expanded={openId === e.id}
              >
                <span className="num-display grid h-10 w-11 shrink-0 place-items-center rounded-xl border border-line bg-cream text-lg text-ink-soft">
                  {faNum(e.number)}
                </span>
                <span className="flex-1 text-sm font-bold text-ink">{e.name}</span>
                <span className="text-xs text-faint tabular-nums">{faTime(e.joinedAt)}</span>
                {e.waitMin > 0 && (
                  <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[10px] font-bold text-muted">
                    {fa(e.waitMin)} دقیقه دیگه
                  </span>
                )}
              </button>
              {openId === e.id && (
                <div className="flex gap-2 border-t border-line-soft px-4 py-3">
                  <button
                    onClick={() => onAction(e.id, "call")}
                    disabled={busy}
                    className="flex-1 min-h-11 rounded-xl bg-ink text-sm font-bold text-cream disabled:opacity-50"
                  >
                    فراخوانی همین حالا
                  </button>
                  <button
                    onClick={() => onAction(e.id, "cancel")}
                    disabled={busy}
                    className="grid min-h-11 w-11 place-items-center rounded-xl border border-line text-danger disabled:opacity-50"
                    aria-label="حذف از صف"
                    title="حذف از صف"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {skipped.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-black text-muted">ردشده‌ها</h3>
          <ul className="mt-2 space-y-2">
            {skipped.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface/60 px-4 py-3"
              >
                <span className="num-display text-lg text-faint">{faNum(s.number)}</span>
                <span className="flex-1 text-sm font-bold text-muted">{s.name}</span>
                <button
                  onClick={() => onAction(s.id, "restore")}
                  disabled={busy}
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
                >
                  <RotateCcw size={13} aria-hidden />
                  بازگرداندن
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ManualAddForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postJson("/api/panel/entries", { name, phone });
      onDone();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "مشکلی پیش آمد.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="ticket-in ticket mt-4 space-y-3 p-4 text-start">
      <p className="text-sm font-black">افزودن دستی نوبت</p>
      <Field label="اسم مشتری">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً خانم احمدی"
          required
        />
      </Field>
      <Field label="شماره موبایل (اختیاری)">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲ ··· ··· ···"
          inputMode="tel"
          dir="ltr"
        />
      </Field>
      {err && <ErrorText>{err}</ErrorText>}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-xl border border-line bg-surface text-sm font-bold text-ink-soft"
        >
          بی‌خیال
        </button>
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-xl bg-ink text-sm font-black text-cream disabled:opacity-50"
        >
          {busy ? "…" : "اضافه کن"}
        </button>
      </div>
    </form>
  );
}
