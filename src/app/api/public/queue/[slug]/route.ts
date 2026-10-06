import { NextRequest, NextResponse } from "next/server";
import { publicState } from "@/lib/queue";
import { fail } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const entryId = Number(req.nextUrl.searchParams.get("entry") ?? "");
    const token = req.nextUrl.searchParams.get("token") ?? "";
    const meRef =
      Number.isFinite(entryId) && entryId > 0 && token
        ? { id: entryId, token }
        : null;
    const state = publicState(slug, meRef);
    if (!state) return NextResponse.json({ error: "این کسب‌وکار پیدا نشد." }, { status: 404 });
    return NextResponse.json(state);
  } catch (e) {
    return fail(e);
  }
}
