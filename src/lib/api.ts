import { NextResponse } from "next/server";
import { QueueError } from "./queue";

/** Map a thrown error to a JSON response with Persian copy. */
export function fail(e: unknown): NextResponse {
  if (e instanceof QueueError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error("[kinoobat]", e);
  return NextResponse.json({ error: "مشکلی پیش آمد. دوباره تلاش کن." }, { status: 500 });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "اول وارد حساب شو." }, { status: 401 });
}
