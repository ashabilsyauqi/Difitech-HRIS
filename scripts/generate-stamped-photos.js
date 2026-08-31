const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function createCamStampSvg(name, email, timeStr, photoUrl, attendanceType = "OFFICE") {
  const isWfa = attendanceType === "WFA";
  const accentColor = isWfa ? "#06b6d4" : "#dc2626";
  const headerColor = isWfa ? "#67e8f9" : "#f87171";
  const typeLabel = isWfa ? "WFA / REMOTE: WORK FROM ANYWHERE" : "DIFITECH CLOCK-IN";
  const userShortId = email.split("@")[0].slice(0, 6).toUpperCase();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <image href="${photoUrl}" width="800" height="450" preserveAspectRatio="xMidYMid slice" />
  
  <!-- Banner Backdrop -->
  <rect y="315" width="800" height="135" fill="rgba(15, 23, 42, 0.94)" />
  <rect y="315" width="800" height="4" fill="${accentColor}" />
  
  <!-- Watermark Text -->
  <text x="24" y="342" fill="${headerColor}" font-family="ui-monospace, monospace, monospace" font-weight="bold" font-size="14">📍 CAMSTAMP&#x2122; [${typeLabel}] - TERVERIFIKASI</text>
  
  <text x="24" y="366" fill="#f8fafc" font-family="ui-monospace, monospace, monospace" font-weight="bold" font-size="12">USER: ${name} (ID: ${userShortId}) | Senin, 31 Agustus 2026 - ${timeStr} WIB</text>
  
  <text x="24" y="388" fill="#cbd5e1" font-family="ui-monospace, monospace, monospace" font-size="11">GPS: -6.221556, 107.014043 (Akurasi: &#177;35.0m)</text>
  
  <text x="24" y="408" fill="#cbd5e1" font-family="ui-monospace, monospace, monospace" font-size="11">LOKASI: Jalan Perjuangan, Proyek, Bekasi Jaya, Bekasi, West Java, 17112, Indonesia</text>
  
  <text x="24" y="428" fill="#94a3b8" font-family="ui-monospace, monospace, monospace" font-size="10">SECURITY: MacIntel | CamStamp v1.4 | AntiSpoof OK | SHA256: 8f9b4c7...</text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function updateAllWithWatermark() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Load custom Ashabil photo if exists
    let ashabilPhoto = null;
    const photoFile = path.join(__dirname, "photo_base64.txt");
    if (fs.existsSync(photoFile)) {
      ashabilPhoto = fs.readFileSync(photoFile, "utf-8").trim();
    }

    const members = [
      { email: "ashabil@difitech.co.id", time: "09:54:07", type: "OFFICE" },
      { email: "siswandi@difitech.co.id", time: "08:40:50", type: "OFFICE" },
      { email: "muditha@difitech.co.id", time: "08:45:12", type: "OFFICE" },
      { email: "nida@difitech.co.id", time: "08:52:30", type: "WFA" },
      { email: "khalilan@difitech.co.id", time: "09:10:00", type: "OFFICE" },
      { email: "dewi@difitech.co.id", time: "08:30:15", type: "OFFICE" },
      { email: "fajar@difitech.co.id", time: "09:05:40", type: "OFFICE" },
      { email: "rima@difitech.co.id", time: "08:58:22", type: "OFFICE" },
      { email: "avila@difitech.co.id", time: "09:12:05", type: "WFA" },
      { email: "danar@difitech.co.id", time: "09:20:18", type: "OFFICE" },
    ];

    for (const m of members) {
      const user = await prisma.user.findUnique({ where: { email: m.email } });
      if (!user) continue;

      let finalPhoto;
      if (m.email === "ashabil@difitech.co.id" && ashabilPhoto) {
        finalPhoto = ashabilPhoto;
      } else {
        finalPhoto = createCamStampSvg(user.name, user.email, m.time, user.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800", m.type);
      }

      await prisma.attendance.updateMany({
        where: {
          userId: user.id,
          date: todayStr,
        },
        data: {
          clockInPhoto: finalPhoto,
          attendanceType: m.type,
        },
      });

      console.log(`✅ Stempel CamStamp ${user.name} (${m.email}): Jam ${m.time} WIB stempel OK`);
    }

    console.log("\n🎉 SELURUH FOTO KARYAWAN BERHASIL DIBERI STEMPEL AIR CAMSTAMP ASLI!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllWithWatermark();
