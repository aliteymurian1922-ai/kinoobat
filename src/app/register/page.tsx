import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "ثبت‌نام" };

export default async function RegisterPage() {
  const ctx = await getCurrentOwner();
  if (ctx) redirect(ctx.business ? "/panel" : "/onboarding");
  return (
    <AuthShell title="شروع کن" sub="حساب بساز و صف امروزت رو باز کن.">
      <RegisterForm />
    </AuthShell>
  );
}
