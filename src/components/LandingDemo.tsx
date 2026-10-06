"use client";

import { useEffect, useState } from "react";
import { faNum } from "@/lib/format";

const BASE = [7, 8, 9, 10, 11, 12];
const CYCLE_START = 8;
const CYCLE_MAX = 11;

export default function LandingDemo() {
  const [current, setCurrent] = useState(CYCLE_START);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c >= CYCLE_MAX ? CYCLE_START : c + 1));
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ticket w-full max-w-sm p-5 shadow-[0_18px_40px_-30px_rgb(23_23_23/0.4)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black">آرایشگاه رضا</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
            صف امروز باز است
          </p>
        </div>
        <span className="rounded-lg border border-line bg-cream px-2 py-1 text-[10px] font-bold text-muted">
          نمونه
        </span>
      </div>

      <div className="mt-5 text-center">
        <p className="text-xs font-bold text-muted">الان نوبت</p>
        <p
          key={current}
          className="num-display num-in mt-1 text-[76px] text-ink"
          aria-live="polite"
        >
          {faNum(current)}
        </p>
      </div>

      <div className="perf-line my-4" />

      <div className="flex items-start justify-center gap-1.5" aria-hidden>
        {BASE.map((n) => {
          const state = n < current ? "done" : n === current ? "now" : "up";
          const isMe = n === 12;
          return (
            <div key={n} className="flex w-11 flex-col items-center gap-1">
              <div
                className={`grid h-10 w-11 place-items-center rounded-xl border text-sm font-bold tabular-nums transition-colors duration-300 ${
                  state === "now"
                    ? "border-ink bg-ink text-cream"
                    : state === "done"
                      ? "border-line-soft bg-cream-deep text-faint"
                      : isMe
                        ? "border-accent-deep bg-accent text-white"
                        : "border-line bg-surface text-ink-soft"
                }`}
              >
                {faNum(n)}
              </div>
              {state === "now" ? (
                <span className="rail-label text-[10px] font-bold text-ink">اکنون</span>
              ) : isMe ? (
                <span className="rail-label text-[10px] font-bold text-accent-deep">شما</span>
              ) : (
                <span className="text-[10px] text-transparent">·</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        نوبت شما <span className="font-black text-ink">{faNum(12)}</span> — حدود{" "}
        <span className="font-black text-ink">{faNum(Math.max(0, 12 - current - 1) * 10)}</span> دقیقه دیگه
      </p>
    </div>
  );
}
