import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import LoginForm from "./LoginForm";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  const ctx = await getCurrentOwner();
  if (ctx) redirect(ctx.business ? "/panel" : "/onboarding");
  return (
    <AuthShell title="خوش برگشتی" sub="وارد شو و صف امروز رو مدیریت کن.">
      <LoginForm />
    </AuthShell>
  );
}
