import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import Wordmark from "@/components/Wordmark";
import LandingDemo from "@/components/LandingDemo";

export const metadata = {
  title: "کی نوبتمه؟ — تو صف نمون",
};

const STORY = [
  { n: 1, text: "مشتری نوبت می‌گیره" },
  { n: 2, text: "زمان تقریبی رو می‌بینه" },
  { n: 3, text: "می‌ره دنبال کارش" },
  { n: 4, text: "نزدیک نوبتش برمی‌گرده" },
];

const TYPES = [
  "آرایشگاه",
  "کارواش",
  "کلینیک",
  "تعمیرگاه",
  "سالن زیبایی",
  "کافه",
  "نانوایی",
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      {/* header */}
      <header className="flex items-center justify-between py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-ink-soft transition-colors hover:bg-cream-deep"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="btn-press rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white"
          >
            شروع کن
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-5xl leading-[1.15] font-black tracking-tight md:text-7xl">
            تو صف
            <br />
            <span className="text-accent">نمون.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-muted">
            نوبتت رو بگیر، برو به کارت برس. وقتی نوبتت نزدیک شد، همین‌جا می‌بینی.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="btn-press flex min-h-14 items-center gap-2 rounded-2xl bg-accent px-7 text-lg font-black text-white"
            >
              رایگان شروع کن
              <ArrowLeft size={20} aria-hidden />
            </Link>
            <Link
              href="/q/demo"
              className="flex min-h-14 items-center rounded-2xl border border-line bg-surface px-6 text-base font-bold text-ink transition-colors hover:border-ink/30"
            >
              نمونه صف رو ببین
            </Link>
          </div>
          <p className="mt-5 text-sm text-faint">راه‌اندازی زیر ۲ دقیقه · بدون کارت بانکی</p>
        </div>

        <div className="flex justify-center md:justify-end">
          <LandingDemo />
        </div>
      </section>

      {/* story */}
      <section className="py-12 md:py-20">
        <h2 className="text-3xl font-black md:text-4xl">صف برای منتظر موندن نیست.</h2>
        <p className="mt-3 max-w-lg text-base leading-7 text-muted">
          مشتری که نوبت گرفته لازم نیست پشت در بمونه؛ کافیه بدون کِی نوبتش می‌شه.
        </p>
        <ol className="mt-10 grid gap-3 sm:grid-cols-4">
          {STORY.map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-line bg-surface p-5">
              <span className="num-display text-3xl text-accent">{String(s.n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}</span>
              <p className="mt-3 text-sm leading-6 font-bold text-ink-soft">{s.text}</p>
              <span
                className="absolute top-1/2 -left-3 hidden text-line sm:block"
                aria-hidden
              >
                <ArrowLeft size={18} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* business types */}
      <section className="py-10">
        <p className="text-sm font-bold text-muted">برای کیه؟</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section className="py-12 md:py-16">
        <h2 className="text-3xl font-black md:text-4xl">قیمت</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="ticket ticket-in p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-black">رایگان</h3>
              <span className="num-display text-3xl text-ink">۰</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-ink-soft">
              {["۱ صف فعال در روز", "مدیریت کامل صف", "کد QR اختصاصی", "تا ۳۰ مشتری در روز"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ok-soft text-ok" aria-hidden>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="btn-press mt-6 flex min-h-12 items-center justify-center rounded-xl bg-accent text-base font-black text-white"
            >
              رایگان شروع کن
            </Link>
          </div>

          <div className="rounded-[18px] border border-dashed border-line p-6 opacity-80">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-black text-ink-soft">حرفه‌ای</h3>
              <span className="rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] font-bold text-muted">
                به‌زودی
              </span>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              {["صف نامحدود", "اعلان برای مشتری‌ها", "خدمات چندگانه", "گزارش صف روزانه", "برند اختصاصی"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border border-line" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-cream-deep px-4 py-3 text-center text-sm font-bold text-muted">
              فعلاً همه‌چیز رایگانه.
            </p>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-8 border-t border-line py-8 pb-24 md:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Wordmark small />
          <p className="text-sm text-faint">ساخته‌شده برای صف‌های واقعی.</p>
          <Link href="/q/demo" className="text-sm font-bold text-accent-deep hover:underline">
            نمونه صف
          </Link>
        </div>
      </footer>
    </main>
  );
}
