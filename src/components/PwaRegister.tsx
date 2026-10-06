"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;
    // در حالت توسعه ثبت نکن: چانک‌های هش‌نشده dev داخل کش SW فریز می‌شوند.
    if (process.env.NODE_ENV !== "production") return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  return null;
}
