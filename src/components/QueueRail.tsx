"use client";

import { Check } from "lucide-react";
import { faNum } from "@/lib/format";
import type { RailItem } from "@/lib/types";

function cellClass(s: RailItem["s"], me: boolean): string {
  if (me) return "bg-accent text-white border-accent-deep shadow-[0_2px_0_0_var(--color-accent-deep)]";
  if (s === "now") return "bg-ink text-cream border-ink";
  if (s === "done") return "bg-cream-deep text-faint border-line-soft";
  return "bg-surface text-ink-soft border-line";
}

export default function QueueRail({ items }: { items: RailItem[] }) {
  if (!items.length) return null;
  return (
    <div className="no-scrollbar flex items-start gap-1.5 overflow-x-auto py-1" aria-label="وضعیت صف">
      {items.map((it) => (
        <div key={it.n} className="flex w-12 shrink-0 flex-col items-center gap-1">
          <div
            className={`relative grid h-11 w-12 place-items-center rounded-xl border text-base font-bold ${cellClass(
              it.s,
              it.me
            )}`}
          >
            <span key={it.n} className="num-in tabular-nums">
              {faNum(it.n)}
            </span>
            {it.s === "done" && (
              <Check size={11} strokeWidth={3} className="absolute top-1 left-1 text-ok" aria-hidden />
            )}
          </div>
          {it.s === "now" && (
            <span className="rail-label text-[10px] font-bold text-ink">اکنون</span>
          )}
          {it.me && it.s !== "now" && (
            <span className="rail-label text-[10px] font-bold text-accent-deep">شما</span>
          )}
          {it.me && it.s === "now" && (
            <span className="rail-label text-[10px] font-bold text-accent-deep">نوبتته</span>
          )}
        </div>
      ))}
    </div>
  );
}
