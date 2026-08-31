const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAttendance() {
  try {
    const list = await prisma.attendance.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Ditemukan total ${list.length} data presensi di database:\n`);
    for (const a of list) {
      const hasPhoto = !!a.clockInPhoto;
      const photoType = a.clockInPhoto ? (a.clockInPhoto.startsWith("data:image") ? "Base64 Foto Kamera" : "URL Foto") : "Tidak Ada";
      const photoLength = a.clockInPhoto ? a.clockInPhoto.length : 0;
      console.log(`- [${a.date}] ${a.user?.name} (${a.user?.email}) | Masuk: ${a.clockInTime ? a.clockInTime.toISOString() : "-"} | Tipe Foto: ${photoType} (${photoLength} bytes)`);
    }
  } catch (e) {
    console.error("Error check attendance:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendance();
