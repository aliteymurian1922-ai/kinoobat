"use client";

import { useEffect, useState } from "react";
import {
  Armchair,
  BellRing,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { usePolling, postJson } from "@/lib/client";
import { fa, faNum, waitText } from "@/lib/format";
import { StatusChip, TextInput, SelectInput, ErrorText, Field } from "@/components/ui";
import QueueRail from "@/components/QueueRail";
import type { PublicState } from "@/lib/types";

interface TicketRef {
  id: number;
  token: string;
}

export default function QueueClient({ slug, initial }: { slug: string; initial: PublicState }) {
  const [meRef, setMeRef] = useState<TicketRef | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`kn_ticket_${slug}`);
      if (raw) setMeRef(JSON.parse(raw) as TicketRef);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [slug]);

  const url = `/api/public/queue/${encodeURIComponent(slug)}${
    meRef ? `?entry=${meRef.id}&token=${encodeURIComponent(meRef.token)}` : ""
  }`;
  const { data, error, refresh } = usePolling<PublicState>(ready ? url : null, 5000);
  const state = data ?? initial;

  const saveTicket = (t: TicketRef) => {
    localStorage.setItem(`kn_ticket_${slug}`, JSON.stringify(t));
    setMeRef(t);
  };
  const clearTicket = () => {
    localStorage.removeItem(`kn_ticket_${slug}`);
    setMeRef(null);
    refresh();
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-6 pb-10">
      {/* business header */}
      <header className="mb-5 text-center">
        <p className="text-[11px] font-bold text-faint">{state.business.category}</p>
        <h1 className="mt-0.5 text-2xl font-black">{state.business.name}</h1>
        {(state.queueStatus === "open" || state.queueStatus === "paused") && (
          <div className="mt-2">
            <StatusChip status={state.queueStatus} />
          </div>
        )}
      </header>

      {error && (
        <div className="mb-4">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {state.queueStatus === "none" || state.queueStatus === "closed" ? (
        <ClosedView name={state.business.name} />
      ) : !state.me ? (
        <NotJoinedView slug={slug} state={state} onJoined={saveTicket} />
      ) : state.me.status === "waiting" ? (
        <TicketView state={state} meRef={meRef} onCancel={clearTicket} />
      ) : state.me.status === "serving" ? (
        <TurnView number={state.me.number} />
      ) : (
        <DoneView status={state.me.status} phone={state.business.phone} onNew={clearTicket} />
      )}

      <footer className="mt-10 text-center">
        <span className="text-xs font-bold text-faint">کی نوبتمه؟</span>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function ClosedView({ name }: { name: string }) {
  return (
    <section className="ticket-in ticket calm-float px-6 py-12 text-center">
      <Clock size={36} className="mx-auto text-faint" aria-hidden />
      <h2 className="mt-4 text-xl font-black">صف امروز بسته است.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {name} امروز صفش رو بسته. فردا دوباره سر بزن.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function NotJoinedView({
  slug,
  state,
  onJoined,
}: {
  slug: string;
  state: PublicState;
  onJoined: (t: TicketRef) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await postJson<{ entryId: number; token: string; number: number }>(
        `/api/public/queue/${encodeURIComponent(slug)}/join`,
        { name, phone, serviceId: serviceId ? Number(serviceId) : null }
      );
      onJoined({ id: res.entryId, token: res.token });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "مشکلی پیش آمد.");
    } finally {
      setBusy(false);
    }
  };

  const waiting = state.waitingCount;
  const current = state.currentNumber;

  return (
    <div className="space-y-4">
      {/* live queue status */}
      <section className="ticket px-5 pt-5 pb-4">
        <div className="text-center">
          <p className="text-xs font-bold text-muted">الان نوبت</p>
          <p key={current ?? 0} className="num-display num-in mt-1 text-6xl" aria-live="polite">
            {current ? faNum(current) : "—"}
          </p>
        </div>
        <div className="mt-4">
          {state.rail.length ? (
            <QueueRail items={state.rail} />
          ) : (
            <p className="text-center text-sm font-bold text-muted">
              هنوز کسی تو صف نیست. اولین نفر باش!
            </p>
          )}
        </div>
        {waiting > 0 && (
          <div className="perf-line mt-4 pt-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="font-black text-ink">{fa(waiting)} نفر در صف</span>
              <span className="text-faint">·</span>
              <span className="text-muted">{waitText(state.estWaitMin)} انتظار</span>
            </div>
          </div>
        )}
      </section>

      {/* join form */}
      <section className="ticket-in ticket p-5">
        <h2 className="text-lg font-black">نوبتت رو بگیر و به کارت برس.</h2>
        <p className="mt-1 text-sm text-muted">وقتی نوبتت نزدیک بشه، همین‌جا می‌بینی.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Field label="اسمت چیه؟">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً سارا"
              required
              maxLength={60}
              autoComplete="name"
            />
          </Field>
          <Field label="شماره موبایل">
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۹۱۲ ··· ··· ···"
              inputMode="tel"
              dir="ltr"
              required
              autoComplete="tel"
            />
          </Field>
          {state.services.length > 0 && (
            <Field label="چه خدمتی می‌خوای؟ (اختیاری)">
              <SelectInput value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">فرقی نمی‌کنه</option>
                {state.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
          {err && <ErrorText>{err}</ErrorText>}
          <button
            type="submit"
            disabled={busy}
            className="btn-press min-h-14 w-full rounded-2xl bg-accent text-lg font-black text-white"
          >
            {busy ? "یه لحظه…" : "نوبت می‌گیرم"}
          </button>
        </form>
      </section>

      <BusinessInfo state={state} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TicketView({
  state,
  meRef,
  onCancel,
}: {
  state: PublicState;
  meRef: TicketRef | null;
  onCancel: () => void;
}) {
  const me = state.me!;
  const ahead = me.peopleAhead;
  const near = ahead > 0 && ahead <= 2;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cancel = async () => {
    if (!meRef) return;
    setBusy(true);
    setErr(null);
    try {
      await postJson(`/api/public/entries/${meRef.id}/cancel`, { token: meRef.token });
      onCancel();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "مشکلی پیش آمد.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section
        className={`ticket-in ticket overflow-hidden px-5 pt-5 pb-4 ${near ? "border-warn/60 bg-warn-soft/40" : ""}`}
        aria-live="polite"
      >
        <div className="text-center">
          <p
            className={`flex items-center justify-center gap-1.5 text-xs font-bold ${
              near ? "text-accent-deep" : "text-muted"
            }`}
          >
            {near ? (
              <>
                <BellRing size={14} aria-hidden />
                تقریباً نوبتته!
              </>
            ) : (
              "نوبت شما"
            )}
          </p>
          <p key={me.number} className="num-display num-in mt-2 text-[88px]">
            {faNum(me.number)}
          </p>
        </div>

        <div className="ticket-cut mt-5 pt-4">
          <span className="ticket-notch-s -left-3" aria-hidden />
          <span className="ticket-notch-s -right-3" aria-hidden />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              الان نوبت:{" "}
              <span className="font-black text-ink">
                {state.currentNumber ? faNum(state.currentNumber) : "—"}
              </span>
            </span>
            <span className="text-muted">
              {ahead > 0 ? (
                <>
                  <span className="font-black text-ink">{fa(ahead)}</span> نفر قبل از شما
                </>
              ) : (
                <span className="font-black text-ok">نوبت بعدی مال شماست</span>
              )}
            </span>
          </div>

          {/* progress dots: one filled dot per person ahead */}
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
            {ahead === 0 ? (
              <span className="h-2 w-2 rounded-full bg-ok" />
            ) : (
              Array.from({ length: Math.min(ahead, 8) }).map((_, i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-accent" />
              ))
            )}
            {ahead > 8 && <span className="text-xs font-bold text-muted">…</span>}
          </div>

          <p className="mt-3 text-center text-sm text-muted">
            زمان تقریبی: <span className="font-black text-ink">{waitText(me.waitMin)}</span>
          </p>
        </div>

        {state.rail.length > 0 && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <QueueRail items={state.rail} />
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted">
        <Armchair size={16} className="text-faint" aria-hidden />
        نیازی نیست اینجا منتظر بمونی.
      </p>

      {err && <ErrorText>{err}</ErrorText>}

      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3.5 py-2 text-xs font-bold text-faint">
          <BellRing size={13} aria-hidden />
          وقتی دو نفر تا نوبتم مونده خبرم کن
          <span className="rounded-full bg-cream-deep px-1.5 py-0.5 text-[10px]">به‌زودی</span>
        </span>
      </div>

      <BusinessInfo state={state} />

      {confirming ? (
        <div className="ticket p-4 text-center">
          <p className="text-sm font-bold">مطمئنی می‌خوای نوبتت رو لغو کنی؟</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="min-h-12 rounded-xl border border-line bg-surface text-sm font-bold text-ink-soft"
            >
              نه، می‌مونم
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="min-h-12 rounded-xl bg-danger text-sm font-black text-white disabled:opacity-50"
            >
              {busy ? "…" : "آره، لغو کن"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="mx-auto flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger-soft"
        >
          <X size={15} aria-hidden />
          لغو نوبت
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TurnView({ number }: { number: number }) {
  useEffect(() => {
    // کروم بدون تعامل قبلی کاربر، vibrate را بلاک و خطا لاگ می‌کند.
    if (!navigator.userActivation?.hasBeenActive) return;
    try {
      navigator.vibrate?.([140, 90, 140]);
    } catch {
      /* ignore */
    }
  }, []);
  return (
    <section className="ticket-in rounded-[18px] border border-accent-deep/40 bg-accent px-6 py-12 text-center text-white shadow-[0_20px_50px_-24px_rgb(199_71_27/0.7)]">
      <p className="text-lg font-black">نوبت شماست.</p>
      <p key={number} className="num-display num-in mt-3 text-[96px]">
        {faNum(number)}
      </p>
      <p className="mt-3 text-sm font-bold text-white/90">همین حالا برو جلو.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function DoneView({
  status,
  phone,
  onNew,
}: {
  status: string;
  phone: string;
  onNew: () => void;
}) {
  const copy: Record<string, { title: string; sub: string }> = {
    completed: { title: "ممنون که منتظر موندی!", sub: "امیدواریم کارت راه افتاده باشه." },
    cancelled: { title: "نوبتت لغو شد.", sub: "هر وقت خواستی دوباره بگیر." },
    absent: { title: "به نوبتت رسیدیم، ولی نبودی.", sub: "دفعه بعد تا نوبتت همین‌جا باشی." },
    skipped: { title: "الان نوبتت نبود.", sub: "با مجموعه هماهنگ کن یا دوباره نوبت بگیر." },
  };
  const c = copy[status] ?? copy.cancelled;
  return (
    <section className="ticket-in ticket px-6 py-10 text-center">
      <span
        className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ok-soft text-ok"
        aria-hidden
      >
        <Check size={22} strokeWidth={2.5} />
      </span>
      <h2 className="mt-4 text-xl font-black">{c.title}</h2>
      <p className="mt-2 text-sm text-muted">{c.sub}</p>
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={onNew}
          className="btn-press min-h-12 w-full rounded-xl bg-accent font-black text-white"
        >
          نوبت جدید می‌گیرم
        </button>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-ink-soft"
          >
            <Phone size={15} aria-hidden />
            تماس با مجموعه
          </a>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function BusinessInfo({ state }: { state: PublicState }) {
  const [open, setOpen] = useState(false);
  const b = state.business;
  const mapUrl = b.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`
    : null;
  return (
    <section className="ticket px-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center justify-between text-sm font-bold text-ink-soft"
        aria-expanded={open}
      >
        اطلاعات کسب‌وکار
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="space-y-2.5 border-t border-line-soft pt-3 pb-4 text-sm">
          <p className="flex items-center gap-2 text-muted">
            <Clock size={15} className="text-faint" aria-hidden />
            هر روز از {fa(b.openTime)} تا {fa(b.closeTime)}
          </p>
          {b.phone && (
            <p className="flex items-center gap-2">
              <Phone size={15} className="text-faint" aria-hidden />
              <a href={`tel:${b.phone}`} className="font-bold text-ink-soft" dir="ltr">
                {fa(b.phone)}
              </a>
            </p>
          )}
          {b.address && (
            <p className="flex items-start gap-2 text-muted">
              <MapPin size={15} className="mt-0.5 shrink-0 text-faint" aria-hidden />
              <span className="leading-6">{b.address}</span>
            </p>
          )}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 font-bold text-accent-deep"
            >
              <MapPin size={14} aria-hidden />
              باز کردن مسیر
            </a>
          )}
        </div>
      )}
    </section>
  );
}
