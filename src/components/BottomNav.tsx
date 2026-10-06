"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, ListChecks, QrCode, Settings } from "lucide-react";

const ITEMS = [
  { href: "/panel", label: "صف", icon: ListChecks },
  { href: "/panel/history", label: "تاریخچه", icon: History },
  { href: "/panel/qr", label: "QR", icon: QrCode },
  { href: "/panel/settings", label: "تنظیمات", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                active ? "text-accent-deep" : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
              {label}
              <span
                className={`h-1 w-1 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
