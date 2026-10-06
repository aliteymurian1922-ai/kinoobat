"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client";
import { TextInput, ErrorText, Field } from "@/components/ui";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
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
      await postJson("/api/auth/register", { name, phone, password });
      router.push("/onboarding");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "مشکلی پیش آمد.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="اسمت">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً رضا" required />
      </Field>
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
      <Field label="رمز عبور" hint="حداقل ۶ کاراکتر">
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
        />
      </Field>
      {err && <ErrorText>{err}</ErrorText>}
      <button
        type="submit"
        disabled={busy}
        className="btn-press min-h-13 w-full rounded-2xl bg-accent py-3 text-base font-black text-white"
      >
        {busy ? "یه لحظه…" : "حساب می‌سازم"}
      </button>
      <p className="pt-1 text-center text-sm text-muted">
        حساب داری؟{" "}
        <Link href="/login" className="font-bold text-accent-deep hover:underline">
          وارد شو
        </Link>
      </p>
    </form>
  );
}
