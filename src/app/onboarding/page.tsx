import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export const metadata = { title: "مغازه‌ت رو معرفی کن" };

export default async function OnboardingPage() {
  const ctx = await getCurrentOwner();
  if (!ctx) redirect("/login");
  if (ctx.business) redirect("/panel");
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <p className="text-2xl font-black">
        کی نوبتمه<span className="text-accent">؟</span>
      </p>
      <h1 className="mt-6 text-2xl font-black">مغازه‌ت رو معرفی کن.</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        زیر ۲ دقیقه تمومه. بعدش آدرس صف و کد QR آماده‌ست.
      </p>
      <OnboardingForm />
    </main>
  );
}
