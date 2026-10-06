import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <Wordmark />
      <p className="num-display mt-8 text-6xl text-faint">۴۰۴</p>
      <h1 className="mt-3 text-xl font-black">این صفحه پیدا نشد.</h1>
      <p className="mt-2 text-sm text-muted">
        ممکنه آدرس صف عوض شده باشه یا اشتباه وارد شده باشه.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-12 items-center rounded-xl border border-line bg-surface px-6 text-sm font-bold text-ink-soft"
      >
        برگرد صفحه اول
      </Link>
    </main>
  );
}
