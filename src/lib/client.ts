"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST"
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) {
    throw new Error(data?.error ?? "مشکلی پیش آمد. دوباره تلاش کن.");
  }
  return data as T;
}

/**
 * Poll an endpoint on an interval (only while the tab is visible).
 * Returns the parsed data, an error string, and a manual refresh.
 */
export function usePolling<T>(url: string | null, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);
  urlRef.current = url;

  const refresh = useCallback(async () => {
    const u = urlRef.current;
    if (!u) return;
    try {
      const res = await fetch(u, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
      if (!res.ok) throw new Error(json?.error ?? "مشکلی پیش آمد.");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "اتصال برقرار نشد.");
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [url, intervalMs, refresh]);

  return { data, error, refresh, setData };
}
