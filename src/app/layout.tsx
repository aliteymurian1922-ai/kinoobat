import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: {
    default: "کی نوبتمه؟ — تو صف نمون",
    template: "%s · کی نوبتمه؟",
  },
  description: "نوبت بگیر، بدون اینکه توی صف بمونی. صف مدیریت‌شده برای کسب‌وکارهای کوچک.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "کی نوبتمه؟",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F1EA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
