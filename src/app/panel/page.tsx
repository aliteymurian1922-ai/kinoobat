import { getCurrentOwner } from "@/lib/auth";
import { faDate } from "@/lib/jalali";
import PanelClient from "./PanelClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "صف امروز" };

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const ctx = await getCurrentOwner();
  return (
    <PanelClient
      today={faDate(new Date())}
      welcome={welcome === "1"}
      ownerName={ctx?.user.name ?? ""}
    />
  );
}
