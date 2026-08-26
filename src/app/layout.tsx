import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Difitech HRIS - Presensi CamStamp & Manajemen SDM",
  description: "Sistem Manajemen SDM & Presensi Verifikasi CamStamp Difitech HRIS dengan Geofencing GPS Anti-Spoofing.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
