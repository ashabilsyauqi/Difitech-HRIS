import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { REAL_TEAM_MEMBERS, OFFICIAL_DEPARTMENTS } from "./seed-team";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Menjalankan Seeding Master Data Difitech HRIS & WorkBoard...");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Lokasi Kantor Default
  await prisma.officeLocation.upsert({
    where: { id: "clx-office-scbd-01" },
    update: {
      name: "Difitech Office (Bekasi)",
      address: "Ruko Burgundy Summarecon Bekasi, Blok RAL/38, RT.001/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123",
      latitude: -6.221538,
      longitude: 107.013962,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
      flexibleStartWindowStart: "08:00",
      flexibleStartWindowEnd: "10:00",
      cutoffStartDay: 17,
      cutoffEndDay: 16,
    },
    create: {
      id: "clx-office-scbd-01",
      name: "Difitech Office (Bekasi)",
      address: "Ruko Burgundy Summarecon Bekasi, Blok RAL/38, RT.001/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123",
      latitude: -6.221538,
      longitude: 107.013962,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
      flexibleStartWindowStart: "08:00",
      flexibleStartWindowEnd: "10:00",
      cutoffStartDay: 17,
      cutoffEndDay: 16,
    },
  });

  // 2. Seed 9 Departemen Resmi
  for (const dept of OFFICIAL_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {
        code: dept.code,
        description: dept.description,
        color: dept.color,
      },
      create: dept,
    });
    console.log(`🏢 Departemen siap: ${dept.name} (${dept.code})`);
  }

  // 3. Seed Seluruh Karyawan Riil
  for (const member of REAL_TEAM_MEMBERS) {
    const memberPasswordHash =
      member.email === "fadhil@difitech.co.id"
        ? await bcrypt.hash("@Difitech2026", 10)
        : defaultPasswordHash;

    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {
        name: member.name,
        role: member.role,
        department: member.department,
        jobTitle: member.jobTitle,
        avatarUrl: member.avatarUrl,
        passwordHash: memberPasswordHash,
      },
      create: {
        email: member.email,
        name: member.name,
        role: member.role,
        department: member.department,
        jobTitle: member.jobTitle,
        avatarUrl: member.avatarUrl,
        passwordHash: memberPasswordHash,
      },
    });

    // Profile Gaji
    await prisma.salaryProfile.upsert({
      where: { userId: user.id },
      update: {
        basicSalary: member.basicSalary,
      },
      create: {
        userId: user.id,
        basicSalary: member.basicSalary,
        positionAllowance: member.role === "ADMIN" ? 3000000 : 500000,
        transportAllowance: 500000,
        communicationAllowance: 250000,
        otherAllowance: 0,
        latePenaltyRate: 25000,
        overtimeRatePerHour: 50000,
        bpjsKesehatanActive: true,
        bpjsKetenagakerjaanActive: true,
        applyPph21: true,
      },
    });

    // Sinkronkan departmentCard pada task yang ditugaskan ke user
    await prisma.task.updateMany({
      where: { userId: user.id },
      data: { departmentCard: member.targetCard },
    });

    console.log(`👤 Karyawan siap: ${member.name} (${member.email}) -> Divisi: ${member.department} (${member.targetCard})`);
  }

  // 4. Default Stages Kanban Content Production (Tim Sosmed)
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

  console.log("✅ Data karyawan riil & konfigurasi awal berhasil ditanam!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
