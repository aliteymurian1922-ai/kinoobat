"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { usePolling, postJson } from "@/lib/client";
import { fa } from "@/lib/format";
import { TextInput, SelectInput, ErrorText, Field } from "@/components/ui";
import { CATEGORIES, AVG_MINUTES_OPTIONS } from "@/lib/constants";
import type { OwnerState } from "@/lib/types";

export default function SettingsClient() {
  const router = useRouter();
  const { data, refresh } = usePolling<OwnerState>("/api/panel/state", 60000);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [openTime, setOpenTime] = useState<string | null>(null);
  const [closeTime, setCloseTime] = useState<string | null>(null);

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <p className="text-sm font-bold text-muted soft-pulse">یه لحظه…</p>
      </main>
    );
  }

  const b = data.business;
  const v = {
    name: name ?? b.name,
    category: category ?? b.category,
    phone: phone ?? b.phone,
    address: address ?? b.address,
    avg: avg ?? b.avgMinutes,
    openTime: openTime ?? b.openTime,
    closeTime: closeTime ?? b.closeTime,
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      await postJson(
        "/api/panel/settings",
        {
          name: v.name,
          category: v.category,
          phone: v.phone,
          address: v.address,
          avgMinutes: v.avg,
          openTime: v.openTime,
          closeTime: v.closeTime,
        },
        "PATCH"
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "مشکلی پیش آمد.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await postJson("/api/auth/logout", {});
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="mx-auto max-w-md space-y-4 px-5 pt-6">
      <header>
        <h1 className="text-xl font-black">تنظیمات</h1>
        <p className="mt-0.5 text-sm text-muted">مشخصات کسب‌وکار، خدمات و خروج.</p>
      </header>

      {/* business info */}
      <section className="ticket space-y-3 p-5">
        <h2 className="text-base font-black">کسب‌وکار</h2>
        <Field label="نام">
          <TextInput value={v.name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="نوع">
          <SelectInput value={v.category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="شماره تماس">
          <TextInput
            value={v.phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
          />
        </Field>
        <Field label="آدرس" hint="برای دکمه‌ی «باز کردن مسیر» مشتری‌ها استفاده می‌شه.">
          <TextInput value={v.address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
        </Field>
        <Field label="مدت متوسط هر نوبت">
          <SelectInput value={v.avg} onChange={(e) => setAvg(Number(e.target.value))}>
            {AVG_MINUTES_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {fa(m)} دقیقه
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="باز شدن">
            <TextInput type="time" value={v.openTime} onChange={(e) => setOpenTime(e.target.value)} dir="ltr" />
          </Field>
          <Field label="بسته شدن">
            <TextInput type="time" value={v.closeTime} onChange={(e) => setCloseTime(e.target.value)} dir="ltr" />
          </Field>
        </div>
        {err && <ErrorText>{err}</ErrorText>}
        <button
          onClick={save}
          disabled={busy}
          className="btn-press min-h-13 w-full rounded-xl bg-ink text-base font-black text-cream disabled:opacity-50"
        >
          {saved ? "ذخیره شد ✓" : busy ? "…" : "ذخیره"}
        </button>
      </section>

      {/* public address (read-only) */}
      <section className="ticket p-5">
        <h2 className="text-base font-black">آدرس صف</h2>
        <p className="mt-2 rounded-xl border border-dashed border-line bg-cream px-4 py-3 text-sm font-bold text-ink-soft" dir="ltr">
          /q/{b.slug}
        </p>
        <p className="mt-2 text-xs text-faint">
          این آدرس روی کد QR چاپ شده؛ برای امن بودن لینک، قابل تغییر نیست.
        </p>
      </section>

      <ServicesSection services={data.services} refresh={refresh} />

      {/* session */}
      <section className="ticket p-5">
        <button
          onClick={logout}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold text-danger transition-colors hover:border-danger/40"
        >
          <LogOut size={16} aria-hidden />
          خروج از حساب
        </button>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function ServicesSection({
  services,
  refresh,
}: {
  services: OwnerState["services"];
  refresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await fn();
      setName("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "مشکلی پیش آمد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ticket space-y-3 p-5">
      <h2 className="text-base font-black">خدمات</h2>
      <p className="text-xs text-muted">
        خدمت‌ها توی فرم نوبت‌گیری مشتری به‌صورت اختیاری نشون داده می‌شن.
      </p>

      {services.length === 0 ? (
        <p className="rounded-xl bg-cream px-4 py-3 text-center text-sm text-muted">
          هنوز خدمتی اضافه نکردی.
        </p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-muted">{fa(s.durationMinutes)} دقیقه</p>
              </div>
              <button
                onClick={() =>
                  run(() => postJson("/api/panel/services", { id: s.id, isActive: !s.isActive }, "PATCH"))
                }
                disabled={busy}
                className={`min-h-10 rounded-xl px-3 text-xs font-bold transition-colors ${
                  s.isActive
                    ? "bg-ok-soft text-ok"
                    : "bg-cream-deep text-muted"
                }`}
              >
                {s.isActive ? "فعال" : "غیرفعال"}
              </button>
              <button
                onClick={() => {
                  if (confirm(`«${s.name}» حذف بشه؟`)) {
                    run(() => postJson(`/api/panel/services?id=${s.id}`, null, "DELETE"));
                  }
                }}
                disabled={busy}
                className="grid min-h-10 w-10 place-items-center rounded-xl border border-line text-danger disabled:opacity-50"
                aria-label={`حذف ${s.name}`}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 border-t border-line-soft pt-3">
        <div className="flex-1">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً اصلاح کامل"
            maxLength={60}
          />
        </div>
        <div className="w-24">
          <SelectInput value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {AVG_MINUTES_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {fa(m)} د
              </option>
            ))}
          </SelectInput>
        </div>
        <button
          onClick={() => run(() => postJson("/api/panel/services", { name, durationMinutes: duration }))}
          disabled={busy || name.trim().length < 2}
          className="grid min-h-12 w-12 place-items-center rounded-xl bg-ink text-cream disabled:opacity-40"
          aria-label="افزودن خدمت"
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>
      {err && <ErrorText>{err}</ErrorText>}
    </section>
  );
}
