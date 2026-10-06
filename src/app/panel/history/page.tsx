import { requireBusiness } from "@/lib/auth";
import { history, todayLocal } from "@/lib/queue";
import { faDateShort, dateFromLocalYmd } from "@/lib/jalali";
import { fa } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "تاریخچه" };

const STATUS_LABEL: Record<string, string> = {
  open: "در جریان",
  paused: "متوقف",
  closed: "بسته",
};

export default async function HistoryPage() {
  const ctx = await requireBusiness();
  if (!ctx) redirect("/login");
  const rows = history(ctx.business.id);
  const today = todayLocal();

  return (
    <main className="mx-auto max-w-md px-5 pt-6">
      <header className="mb-5">
        <h1 className="text-xl font-black">تاریخچه</h1>
        <p className="mt-0.5 text-sm text-muted">صف‌های روزهای گذشته.</p>
      </header>

      {rows.length === 0 ? (
        <div className="ticket px-6 py-12 text-center">
          <h2 className="text-lg font-black">هنوز صفی ثبت نشده.</h2>
          <p className="mt-1.5 text-sm text-muted">
            از امروز شروع کن؛ هر روز که صف باز کنی اینجا ثبت می‌شه.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const isToday = r.date === today;
            return (
              <li
                key={r.date}
                className={`ticket flex items-center gap-3 px-4 py-3.5 ${
                  isToday ? "border-accent/50 bg-accent-soft/30" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-black text-ink">
                    {faDateShort(dateFromLocalYmd(r.date))}
                    {isToday && (
                      <span className="ms-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                        امروز
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {fa(r.total)} نوبت · {fa(r.completed)} نفر انجام شد
                    {r.absent > 0 && <> · {fa(r.absent)} غیبت</>}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    r.status === "open"
                      ? "border-ok/25 bg-ok-soft text-ok"
                      : r.status === "paused"
                        ? "border-warn/30 bg-warn-soft text-ink-soft"
                        : "border-line bg-cream text-muted"
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
