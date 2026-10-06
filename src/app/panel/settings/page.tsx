import { requireBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const ctx = await requireBusiness();
  if (!ctx) redirect("/login");
  return <SettingsClient />;
}
