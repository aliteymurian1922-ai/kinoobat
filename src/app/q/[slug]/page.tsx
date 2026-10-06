import { notFound } from "next/navigation";
import { publicState } from "@/lib/queue";
import QueueClient from "./QueueClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = publicState(slug, null);
  return { title: business ? business.business.name : "صف پیدا نشد" };
}

export default async function PublicQueuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = publicState(slug, null);
  if (!state) notFound();
  return <QueueClient slug={slug} initial={state} />;
}
