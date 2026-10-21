import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Menginisialisasi Database Bersih untuk Difitech HRIS...");

  // 1. Lokasi Kantor Utama (Difitech HQ Jakarta SCBD)
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

  const adminPasswordHash = await bcrypt.hash("password123", 10);

  // 2. Akun Super Admin Utama (Untuk mengelola dan menginput data karyawan asli)
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

  // Konfigurasi Gaji Pokok untuk Super Admin
  await prisma.salaryProfile.upsert({
    where: { userId: adminUser.id },
    update: {
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

  // 3. Inisialisasi Default Stages Kanban Content Production (Tim Sosmed)
  const defaultKanbanStages = [
    { key: "CONTENT_BRIEF", label: "Content Brief", order: 1, color: "#3b82f6" },
    { key: "SHOOTING", label: "Shooting", order: 2, color: "#8b5cf6" },
    { key: "DESIGN", label: "Design", order: 3, color: "#ec4899" },
    { key: "VIDEO_EDITING", label: "Video Editing", order: 4, color: "#f59e0b" },
    { key: "REVISION", label: "Revision", order: 5, color: "#ef4444" },
    { key: "APPROVAL", label: "Approval", order: 6, color: "#10b981" },
  ];
  for (const stage of defaultKanbanStages) {
    await prisma.kanbanStageSetting.upsert({
      where: { key: stage.key },
      update: { label: stage.label, order: stage.order, color: stage.color },
      create: stage,
    });
  }

  console.log("✅ Inisialisasi Database Bersih Berhasil!");
  console.log("🔑 Akun Login Super Admin:");
  console.log("   - Email: admin@difitech.id");
  console.log("   - Password: password123");
  console.log("ℹ️  Semua data absensi, tugas, dan karyawan lain kosong siap diisi data nyata.");
}

main()
  .catch((e) => {
    console.error("❌ Gagal menginisialisasi database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
