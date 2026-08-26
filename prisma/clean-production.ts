import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Membersihkan seluruh data dummy untuk live production...");

  // 1. Hapus semua transaksi dummy
  await prisma.payslip.deleteMany({});
  await prisma.payrollPeriod.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.salaryProfile.deleteMany({});

  // 2. Hapus semua user kecuali admin@difitech.id
  await prisma.user.deleteMany({
    where: {
      email: {
        not: "admin@difitech.id",
      },
    },
  });

  // 3. Pastikan Akun Super Admin Utama bersih & aktif
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@difitech.id" },
    update: {
      passwordHash: adminPasswordHash,
      name: "Super Admin Difitech",
      role: "ADMIN",
      department: "Human Capital & Operations",
      jobTitle: "Head of HR & Administrator",
    },
    create: {
      email: "admin@difitech.id",
      passwordHash: adminPasswordHash,
      name: "Super Admin Difitech",
      role: "ADMIN",
      department: "Human Capital & Operations",
      jobTitle: "Head of HR & Administrator",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Profil gaji super admin
  await prisma.salaryProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      basicSalary: 15000000,
      positionAllowance: 3000000,
      transportAllowance: 1000000,
      communicationAllowance: 500000,
      otherAllowance: 0,
      latePenaltyRate: 50000,
      overtimeRatePerHour: 100000,
      bpjsKesehatanActive: true,
      bpjsKetenagakerjaanActive: true,
      applyPph21: true,
    },
  });

  // 4. Pastikan Lokasi Kantor Default
  await prisma.officeLocation.upsert({
    where: { id: "clx-office-scbd-01" },
    update: {
      name: "Difitech HQ (Jakarta)",
      address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
      latitude: -6.224647,
      longitude: 106.809592,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
    },
    create: {
      id: "clx-office-scbd-01",
      name: "Difitech HQ (Jakarta)",
      address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
      latitude: -6.224647,
      longitude: 106.809592,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
    },
  });

  const remainingUsers = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
  console.log("✅ Database telah bersih 100%!");
  console.log("📊 Daftar user yang tersisa (Hanya Super Admin):", remainingUsers);
}

main()
  .catch((e) => {
    console.error("❌ Gagal membersihkan database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
