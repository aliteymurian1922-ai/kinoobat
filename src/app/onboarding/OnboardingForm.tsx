"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";
import { TextInput, SelectInput, ErrorText, Field } from "@/components/ui";
import { CATEGORIES, AVG_MINUTES_OPTIONS } from "@/lib/constants";
import { fa } from "@/lib/format";

export default function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [phone, setPhone] = useState("");
  const [avgMinutes, setAvgMinutes] = useState(10);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("21:00");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postJson("/api/onboarding", {
        name,
        category,
        phone,
        avgMinutes,
        openTime,
        closeTime,
        slug,
      });
      router.push("/panel?welcome=1");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "مشکلی پیش آمد.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="ticket space-y-3 p-5">
        <Field label="نام کسب‌وکار">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً آرایشگاه رضا"
            required
            maxLength={80}
          />
        </Field>
        <Field label="نوع کسب‌وکار">
          <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="شماره تماس">
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="۰۹۱۲ ··· ··· ···"
            inputMode="tel"
            dir="ltr"
            required
          />
        </Field>
      </div>

      <div className="ticket space-y-3 p-5">
        <Field label="هر نوبت حدوداً چقدر طول می‌کشه؟" hint="این عدد برای تخمین انتظار مشتری‌ها استفاده می‌شه.">
          <SelectInput value={avgMinutes} onChange={(e) => setAvgMinutes(Number(e.target.value))}>
            {AVG_MINUTES_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {fa(m)} دقیقه
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ساعت باز شدن">
            <TextInput
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
          <Field label="ساعت بسته شدن">
            <TextInput
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              dir="ltr"
              required
            />
          </Field>
        </div>
      </div>

      <div className="ticket space-y-3 p-5">
        <Field
          label="آدرس صف"
          hint="این آدرس روی کد QR چاپ می‌شه؛ بعداً قابل تغییر نیست."
        >
          <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-line bg-surface focus-within:border-accent">
            <span className="grid place-items-center border-e border-line-soft bg-cream px-3 text-xs font-bold text-faint" dir="ltr">
              /q/
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="barber-reza"
              dir="ltr"
              required
              pattern="[a-z0-9][a-z0-9-]{2,23}"
              maxLength={24}
              className="min-h-12 w-full bg-transparent px-3 text-base text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
        </Field>
      </div>

      {err && <ErrorText>{err}</ErrorText>}
      <button
        type="submit"
        disabled={busy}
        className="btn-press min-h-14 w-full rounded-2xl bg-accent text-lg font-black text-white"
      >
        {busy ? "داریم می‌سازیم…" : "صف می‌سازم"}
      </button>
    </form>
  );
}
