"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, Printer } from "lucide-react";
import { fa } from "@/lib/format";

export default function QrClient({ slug, name }: { slug: string; name: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/q/${slug}` : `/q/${slug}`;

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/q/${slug}`, {
      width: 560,
      margin: 2,
      color: { dark: "#171717", light: "#FFFFFF" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [slug]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `kinoobat-qr-${slug}.png`;
    a.click();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 pt-6">
      <header className="mb-5">
        <h1 className="text-xl font-black">کد QR</h1>
        <p className="mt-0.5 text-sm text-muted">بذارش جلوی مغازه؛ مشتری اسکن کنه و نوبت بگیره.</p>
      </header>

      <section id="qr-print" className="ticket px-6 py-8 text-center">
        <p className="text-lg font-black">{name}</p>
        <p className="mt-1 text-sm text-muted">برای گرفتن نوبت اسکن کنید</p>
        <div className="mx-auto mt-5 w-fit rounded-2xl border border-line bg-white p-4">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`کد QR صف ${name}`} className="h-56 w-56" />
          ) : (
            <div className="grid h-56 w-56 place-items-center text-sm text-faint soft-pulse">
              داره ساخته می‌شه…
            </div>
          )}
        </div>
        <p className="mt-4 text-xs font-bold text-muted" dir="ltr">
          /q/{slug}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={copy}
          className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-bold text-ink-soft transition-colors hover:border-ink/30"
        >
          {copied ? <Check size={16} className="text-ok" aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? "کپی شد" : "کپی لینک"}
        </button>
        <button
          onClick={download}
          disabled={!dataUrl}
          className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-bold text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
        >
          <Download size={16} aria-hidden />
          دانلود
        </button>
        <button
          onClick={() => window.print()}
          className="btn-press flex min-h-13 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-black text-cream"
        >
          <Printer size={16} aria-hidden />
          چاپ
        </button>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-faint">
        نکته: اگه مغازه رو جابه‌جا می‌کنی یا دامنه عوض می‌شه، لینک از آدرس همین صفحه ساخته می‌شه؛ بعد از
        راه‌اندازی روی هاست اصلی، QR رو دوباره دانلود کن.
      </p>
    </main>
  );
}
