const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixAttendance() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "ashabil@difitech.co.id" },
    });

    if (!user) {
      console.log("❌ User ashabil@difitech.co.id tidak ditemukan.");
      return;
    }

    const latestAttendance = await prisma.attendance.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestAttendance) {
      console.log("❌ Data presensi hari ini belum ada.");
      return;
    }

    // Set jam masuk ke 09:54:00 WIB (02:54:00 UTC)
    const targetDateStr = latestAttendance.date;
    const newClockIn = new Date(`${targetDateStr}T02:54:00.000Z`);

    const updated = await prisma.attendance.update({
      where: { id: latestAttendance.id },
      data: {
        clockInTime: newClockIn,
        clockInStatus: "ON_TIME",
        clockOutTime: null,
        clockOutStatus: null,
      },
    });

    console.log("✅ Berhasil diperbarui!");
    console.log(`👤 Karyawan : ${user.name}`);
    console.log(`📅 Tanggal  : ${updated.date}`);
    console.log(`⏰ Jam Masuk: 09:54:00 WIB`);
    console.log(`🟢 Status   : ${updated.clockInStatus} (Tepat Waktu & Masih Bekerja)`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAttendance();
