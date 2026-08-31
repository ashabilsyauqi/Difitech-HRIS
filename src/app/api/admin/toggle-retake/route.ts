export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlags, setFeatureFlags } from "@/lib/feature-flags";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const enableParam = searchParams.get("enable");

    let flags = getFeatureFlags();

    if (enableParam !== null) {
      const isEnabled = enableParam === "true" || enableParam === "1" || enableParam === "on";
      flags = setFeatureFlags({ allowRetakeClockInPhoto: isEnabled });
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pengaturan Fitur Foto Ulang - Difitech HRIS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; margin-bottom: 1.5rem; }
            .badge-on { background: #065f46; color: #34d399; border: 1px solid #059669; }
            .badge-off { background: #7f1d1d; color: #f87171; border: 1px solid #dc2626; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.75rem; line-height: 1.5; }
            .btn { display: inline-block; font-weight: 700; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; margin: 0.25rem; }
            .btn-off { background: #dc2626; color: white; }
            .btn-off:hover { background: #b91c1c; }
            .btn-on { background: #059669; color: white; }
            .btn-on:hover { background: #047857; }
            .btn-back { background: #334155; color: #cbd5e1; }
            .btn-back:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge ${flags.allowRetakeClockInPhoto ? 'badge-on' : 'badge-off'}">
              STATUS FITUR: ${flags.allowRetakeClockInPhoto ? 'AKTIF / ON 🟢' : 'NONAKTIF / OFF 🔴'}
            </span>
            <h1>Fitur Foto Ulang Presensi (Re-CamStamp)</h1>
            <p>
              ${flags.allowRetakeClockInPhoto 
                ? 'Fitur saat ini <strong>AKTIF</strong>. Karyawan dapat mengambil foto ulang dengan stempel jam masuk pagi.' 
                : 'Fitur saat ini <strong>NONAKTIF</strong>. Tombol Foto Ulang Masuk disembunyikan dari dashboard karyawan.'}
            </p>
            <div>
              ${flags.allowRetakeClockInPhoto
                ? '<a href="/api/admin/toggle-retake?enable=false" class="btn btn-off">🔒 Matikan Fitur Sekarang (Untuk Besok)</a>'
                : '<a href="/api/admin/toggle-retake?enable=true" class="btn btn-on">🔓 Aktifkan Kembali Fitur</a>'
              }
              <br/><br/>
              <a href="/dashboard" class="btn btn-back">Kembali ke Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
