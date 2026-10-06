import { NextRequest, NextResponse } from "next/server";
import { joinQueue } from "@/lib/queue";
import { fail } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const serviceId =
      body.serviceId != null && Number.isFinite(Number(body.serviceId))
        ? Number(body.serviceId)
        : null;
    const result = joinQueue(slug, String(body.name ?? ""), String(body.phone ?? ""), serviceId);
    return NextResponse.json(result, { status: result.existing ? 200 : 201 });
  } catch (e) {
    return fail(e);
  }
}
