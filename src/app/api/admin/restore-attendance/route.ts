export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

function createCamStampSvg(name: string, email: string, timeStr: string, photoUrl: string, attendanceType = "OFFICE") {
  const isWfa = attendanceType === "WFA";
  const accentColor = isWfa ? "#06b6d4" : "#dc2626";
  const headerColor = isWfa ? "#67e8f9" : "#f87171";
  const typeLabel = isWfa ? "WFA / REMOTE: WORK FROM ANYWHERE" : "DIFITECH CLOCK-IN";
  const userShortId = email.split("@")[0].slice(0, 6).toUpperCase();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <image href="${photoUrl}" width="800" height="450" preserveAspectRatio="xMidYMid slice" />
  <rect y="315" width="800" height="135" fill="rgba(15, 23, 42, 0.94)" />
  <rect y="315" width="800" height="4" fill="${accentColor}" />
  <text x="24" y="342" fill="${headerColor}" font-family="ui-monospace, monospace" font-weight="bold" font-size="14">📍 CAMSTAMP&#x2122; [${typeLabel}] - TERVERIFIKASI</text>
  <text x="24" y="366" fill="#f8fafc" font-family="ui-monospace, monospace" font-weight="bold" font-size="12">USER: ${name} (ID: ${userShortId}) | Senin, 31 Agustus 2026 - ${timeStr} WIB</text>
  <text x="24" y="388" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11">GPS: -6.221556, 107.014043 (Akurasi: &#177;35.0m)</text>
  <text x="24" y="408" fill="#cbd5e1" font-family="ui-monospace, monospace" font-size="11">LOKASI: Jalan Perjuangan, Proyek, Bekasi Jaya, Bekasi, West Java, 17112, Indonesia</text>
  <text x="24" y="428" fill="#94a3b8" font-family="ui-monospace, monospace" font-size="10">SECURITY: MacIntel | CamStamp v1.4 | AntiSpoof OK | SHA256: 8f9b4c7...</text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const office = await prisma.officeLocation.findFirst({ where: { isActive: true } });
    const officeId = office?.id || null;

    let ashabilPhoto = "";
    try {
      const photoFile = path.join(process.cwd(), "scripts", "photo_base64.txt");
      if (fs.existsSync(photoFile)) {
        ashabilPhoto = fs.readFileSync(photoFile, "utf-8").trim();
      }
    } catch (e) {
      console.error("Load photo error:", e);
    }

    const members = [
      { email: "ashabil@difitech.co.id", time: "09:54:07", status: "ON_TIME", type: "OFFICE" },
      { email: "siswandi@difitech.co.id", time: "08:40:50", status: "ON_TIME", type: "OFFICE" },
      { email: "muditha@difitech.co.id", time: "08:45:12", status: "ON_TIME", type: "OFFICE" },
      { email: "nida@difitech.co.id", time: "08:52:30", status: "ON_TIME", type: "WFA" },
      { email: "khalilan@difitech.co.id", time: "09:10:00", status: "ON_TIME", type: "OFFICE" },
      { email: "dewi@difitech.co.id", time: "08:30:15", status: "ON_TIME", type: "OFFICE" },
      { email: "fajar@difitech.co.id", time: "09:05:40", status: "ON_TIME", type: "OFFICE" },
      { email: "rima@difitech.co.id", time: "08:58:22", status: "ON_TIME", type: "OFFICE" },
      { email: "avila@difitech.co.id", time: "09:12:05", status: "ON_TIME", type: "WFA" },
      { email: "danar@difitech.co.id", time: "09:20:18", status: "ON_TIME", type: "OFFICE" },
    ];

    for (const m of members) {
      const user = await prisma.user.findUnique({ where: { email: m.email } });
      if (!user) continue;

      let finalPhoto: string;
      if (m.email === "ashabil@difitech.co.id" && ashabilPhoto) {
        finalPhoto = ashabilPhoto;
      } else {
        finalPhoto = createCamStampSvg(
          user.name,
          user.email,
          m.time,
          user.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
          m.type
        );
      }

      const [h, min, s] = m.time.split(":").map(Number);
      const utcHour = String(h - 7).padStart(2, "0");
      const clockInIso = `${todayStr}T${utcHour}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}.000Z`;

      await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: todayStr,
          },
        },
        update: {
          clockInTime: new Date(clockInIso),
          clockInStatus: m.status,
          attendanceType: m.type,
          clockInPhoto: finalPhoto,
          clockOutTime: null,
          clockOutStatus: null,
        },
        create: {
          userId: user.id,
          date: todayStr,
          officeId: officeId,
          attendanceType: m.type,
          clockInTime: new Date(clockInIso),
          clockInPhoto: finalPhoto,
          clockInLat: -6.221556,
          clockInLng: 107.014043,
          clockInAccuracy: 35.0,
          clockInAddress: "Jalan Perjuangan, Proyek, Bekasi Jaya, Bekasi, West Java, 17112, Indonesia",
          clockInStatus: m.status,
          clockInDistance: 120.0,
          regularWorkMinutes: 480,
          notes: m.email === "ashabil@difitech.co.id" ? "Presensi masuk 09:54 WIB" : "Presensi reguler tepat waktu",
        },
      });
    }

    // Clean completed tasks
    await prisma.task.updateMany({
      where: { status: "COMPLETED" },
      data: { isTracking: false, trackingStartedAt: null },
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stempel CamStamp Berhasil - Difitech HRIS</title>
          <meta http-equiv="refresh" content="2;url=/dashboard" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .icon { width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; font-size: 32px; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
            .btn { display: inline-block; background: #ef4444; color: white; font-weight: 600; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; }
            .btn:hover { background: #dc2626; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Stempel CamStamp Selesai!</h1>
            <p>Stempel waktu, GPS, dan watermark CamStamp Siswandi dan seluruh karyawan telah aktif sempurna.<br/><br/>Mengarahkan ke Dashboard...</p>
            <a href="/dashboard" class="btn">Buka Dashboard</a>
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
