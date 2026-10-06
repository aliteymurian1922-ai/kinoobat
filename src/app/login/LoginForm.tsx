"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";
import { TextInput, ErrorText, Field } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postJson("/api/auth/login", { phone, password });
      router.push("/panel");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "مشکلی پیش آمد.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="شماره موبایل">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="۰۹۱۲ ··· ··· ···"
          inputMode="tel"
          dir="ltr"
          required
          autoComplete="tel"
        />
      </Field>
      <Field label="رمز عبور">
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          dir="ltr"
        />
      </Field>
      {err && <ErrorText>{err}</ErrorText>}
      <button
        type="submit"
        disabled={busy}
        className="btn-press min-h-13 w-full rounded-2xl bg-accent py-3 text-base font-black text-white"
      >
        {busy ? "یه لحظه…" : "وارد می‌شم"}
      </button>
      <p className="pt-1 text-center text-sm text-muted">
        حساب نداری؟{" "}
        <Link href="/register" className="font-bold text-accent-deep hover:underline">
          رایگان بساز
        </Link>
      </p>
    </form>
  );
}
