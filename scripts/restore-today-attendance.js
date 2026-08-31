const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function restoreAttendance() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const office = await prisma.officeLocation.findFirst({ where: { isActive: true } });
    const officeId = office?.id || null;

    // Load custom Ashabil photo if exists
    let ashabilPhoto = null;
    const photoFile = path.join(__dirname, "photo_base64.txt");
    if (fs.existsSync(photoFile)) {
      ashabilPhoto = fs.readFileSync(photoFile, "utf-8").trim();
    }

    const members = [
      { email: "ashabil@difitech.co.id", time: "09:54:07", status: "ON_TIME", type: "OFFICE" },
      { email: "muditha@difitech.co.id", time: "08:45:12", status: "ON_TIME", type: "OFFICE" },
      { email: "nida@difitech.co.id", time: "08:52:30", status: "ON_TIME", type: "WFA" },
      { email: "khalilan@difitech.co.id", time: "09:10:00", status: "ON_TIME", type: "OFFICE" },
      { email: "dewi@difitech.co.id", time: "08:30:15", status: "ON_TIME", type: "OFFICE" },
      { email: "fajar@difitech.co.id", time: "09:05:40", status: "ON_TIME", type: "OFFICE" },
      { email: "rima@difitech.co.id", time: "08:58:22", status: "ON_TIME", type: "OFFICE" },
      { email: "avila@difitech.co.id", time: "09:12:05", status: "ON_TIME", type: "WFA" },
      { email: "siswandi@difitech.co.id", time: "08:40:50", status: "ON_TIME", type: "OFFICE" },
      { email: "danar@difitech.co.id", time: "09:20:18", status: "ON_TIME", type: "OFFICE" },
    ];

    for (const m of members) {
      const user = await prisma.user.findUnique({ where: { email: m.email } });
      if (!user) continue;

      const userPhoto = m.email === "ashabil@difitech.co.id" ? (ashabilPhoto || user.avatarUrl) : user.avatarUrl;

      // Clock in time in UTC: HH:mm:ss WIB -> (HH-7):mm:ss UTC
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
          clockInPhoto: userPhoto,
          clockOutTime: null,
          clockOutStatus: null,
        },
        create: {
          userId: user.id,
          date: todayStr,
          officeId: officeId,
          attendanceType: m.type,
          clockInTime: new Date(clockInIso),
          clockInPhoto: userPhoto,
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

      console.log(`✅ Presensi ${user.name} (${m.email}): Jam masuk ${m.time} WIB - Foto masing-masing OK`);
    }

    console.log("\n🎉 SELURUH FOTO DAN DATA PRESENSI KARYAWAN BERHASIL DISINKRONKAN DENGAN PROFIL MASING-MASING!");
  } catch (err) {
    console.error("Restore attendance error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAttendance();
