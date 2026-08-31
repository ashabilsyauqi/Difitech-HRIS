const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updatePhoto() {
  try {
    const photoPath = path.join(__dirname, "photo_base64.txt");
    if (!fs.existsSync(photoPath)) {
      console.log("❌ File photo_base64.txt tidak ditemukan.");
      return;
    }

    const photoBase64 = fs.readFileSync(photoPath, "utf-8").trim();

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
      console.log("❌ Data presensi belum ditemukan.");
      return;
    }

    await prisma.attendance.update({
      where: { id: latestAttendance.id },
      data: {
        clockInPhoto: photoBase64,
      },
    });

    console.log("✅ Foto CamStamp berhasil di-replace dengan foto editan baru!");
    console.log(`👤 Karyawan : ${user.name}`);
    console.log(`📅 Tanggal  : ${latestAttendance.date}`);
    console.log(`⏰ Jam Masuk: 09:54:07 WIB`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhoto();
