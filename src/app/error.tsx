"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="text-5xl font-black text-accent">اوپس</p>
      <h1 className="mt-3 text-xl font-black">مشکلی پیش آمد.</h1>
      <p className="mt-2 text-sm text-muted">یه بار دیگه تلاش کن؛ اگه تکرار شد بعداً سر بزن.</p>
      <button
        onClick={reset}
        className="btn-press mt-6 min-h-12 rounded-xl bg-accent px-6 text-sm font-black text-white"
      >
        تلاش دوباره
      </button>
    </main>
  );
}
