import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentOwner();
  if (!ctx) redirect("/login");
  if (!ctx.business) redirect("/onboarding");
  return (
    <div className="min-h-dvh pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
