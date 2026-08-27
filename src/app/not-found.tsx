export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl max-w-md w-full space-y-4">
        <h1 className="text-4xl font-black text-red-600">404</h1>
        <h2 className="text-lg font-bold text-slate-900">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
