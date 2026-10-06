import { requireBusiness } from "@/lib/auth";
import { redirect } from "next/navigation";
import QrClient from "./QrClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "کد QR" };

export default async function QrPage() {
  const ctx = await requireBusiness();
  if (!ctx) redirect("/login");
  return <QrClient slug={ctx.business.slug} name={ctx.business.name} />;
}
