import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const teamMembers = [
  {
    email: "muditha@difitech.co.id",
    name: "Muditha",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "nida@difitech.co.id",
    name: "Nida",
    role: "EMPLOYEE",
    department: "Kreatif & Desain",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "khalilan@difitech.co.id",
    name: "Khalilan",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Intern",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    basicSalary: 3000000,
  },
  {
    email: "dewi@difitech.co.id",
    name: "Dewi",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "fajar@difitech.co.id",
    name: "Fajar",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "rima@difitech.co.id",
    name: "Rima",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "avila@difitech.co.id",
    name: "Avila",
    role: "EMPLOYEE",
    department: "Kreatif & Desain",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "siswandi@difitech.co.id",
    name: "Siswandi",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "danar@difitech.co.id",
    name: "Danar",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    basicSalary: 6000000,
  },
  {
    email: "ashabil@difitech.co.id",
    name: "Ashabil Syauqi",
    role: "EMPLOYEE",
    department: "Engineering & Teknologi",
    jobTitle: "Karyawan",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    basicSalary: 8000000,
  },
  {
    email: "admin@difitech.id",
    name: "Super Admin Difitech",
    role: "ADMIN",
    department: "Human Capital & Operations",
    jobTitle: "Head of HR & Administrator",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    basicSalary: 15000000,
  },
];

async function main() {
  console.log("🚀 Mendaftarkan seluruh akun karyawan Difitech...");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {
        name: member.name,
        role: member.role,
        department: member.department,
        jobTitle: member.jobTitle,
        avatarUrl: member.avatarUrl,
        passwordHash: defaultPasswordHash,
      },
      create: {
        email: member.email,
        name: member.name,
        role: member.role,
        department: member.department,
        jobTitle: member.jobTitle,
        avatarUrl: member.avatarUrl,
        passwordHash: defaultPasswordHash,
      },
    });

    await prisma.salaryProfile.upsert({
      where: { userId: user.id },
      update: {},
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

    console.log(`✅ Akun siap: ${member.email} (${member.name} - ${member.jobTitle})`);
  }

  // 2. Office SCBD
  const office = await prisma.officeLocation.upsert({
    where: { id: "clx-office-scbd-01" },
    update: {
      name: "Difitech HQ (Jakarta)",
      address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
      latitude: -6.224647,
      longitude: 106.809592,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
      flexibleStartWindowStart: "08:00",
      flexibleStartWindowEnd: "10:00",
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
      flexibleStartWindowStart: "08:00",
      flexibleStartWindowEnd: "10:00",
    },
  });

  // 3. Seed Tasks for Ashabil Syauqi
  const ashabil = await prisma.user.findUnique({ where: { email: "ashabil@difitech.co.id" } });
  if (ashabil) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    // Check existing tasks
    const existingTasks = await prisma.task.count({ where: { userId: ashabil.id } });
    if (existingTasks === 0) {
      await prisma.task.createMany({
        data: [
          {
            userId: ashabil.id,
            title: "Development Fitur Presensi WFA & Remote CamStamp",
            description: "Implementasi 3 opsi presensi (Kantor, WFA, Klien) dengan watermark khusus warna cyan dan bypass radius geofence.",
            category: "Engineering",
            priority: "HIGH",
            status: "COMPLETED",
            estimatedHours: 3.0,
            actualHours: 3.0,
            trackedSeconds: 10800,
            orderIndex: 0,
            targetDate: yesterdayStr,
          },
          {
            userId: ashabil.id,
            title: "Perbaikan State Timer Live Task Persistence",
            description: "Memperbaiki kalkulasi delta timestamp agar live timer tidak reset ke 0 saat browser di-refresh.",
            category: "Engineering",
            priority: "HIGH",
            status: "COMPLETED",
            estimatedHours: 2.0,
            actualHours: 2.0,
            trackedSeconds: 7200,
            orderIndex: 1,
            targetDate: yesterdayStr,
          },
          {
            userId: ashabil.id,
            title: "Implementasi Date Range & Multi-Filter Audit Presensi",
            description: "Menambahkan filter instan nama, departemen, preset rentang waktu, dan export Excel.",
            category: "Engineering",
            priority: "MEDIUM",
            status: "COMPLETED",
            estimatedHours: 2.5,
            actualHours: 2.5,
            trackedSeconds: 9000,
            orderIndex: 2,
            targetDate: yesterdayStr,
          },
          {
            userId: ashabil.id,
            title: "Pengujian Geofence SCBD & Live Radar Map",
            description: "Verifikasi visualisasi pin lokasi karyawan WFA, kantor, dan dinas luar pada peta interaktif Leaflet.",
            category: "QA & Testing",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            estimatedHours: 2.0,
            actualHours: 1.0,
            trackedSeconds: 3600,
            isTracking: false,
            orderIndex: 3,
            targetDate: todayStr,
          },
          {
            userId: ashabil.id,
            title: "Dokumentasi API & Deployment PM2 cPanel",
            description: "Penyusunan panduan update 2 detik via pre-built Next.js bundle pada environment production.",
            category: "DevOps",
            priority: "LOW",
            status: "PENDING",
            estimatedHours: 1.5,
            actualHours: 0,
            trackedSeconds: 0,
            orderIndex: 4,
            targetDate: todayStr,
          },
        ],
      });
      console.log("✅ Berhasil membuat 5 riwayat tugas harian untuk Ashabil Syauqi");
    }
  }

  // 4. Seed Tasks for other team members
  const teamUsers = await prisma.user.findMany({
    where: { email: { notIn: ["admin@difitech.id", "ashabil@difitech.co.id"] } },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  for (const u of teamUsers) {
    const c = await prisma.task.count({ where: { userId: u.id } });
    if (c === 0) {
      await prisma.task.createMany({
        data: [
          {
            userId: u.id,
            title: `Pengerjaan Operasional & Project Sprint (${u.department || "Divisi"})`,
            description: `Tugas harian berkala untuk departemen ${u.department || "Operasional"}.`,
            category: u.department?.includes("Kreatif") ? "Design" : u.department?.includes("Engineering") ? "Engineering" : "Operations",
            priority: "MEDIUM",
            status: "COMPLETED",
            estimatedHours: 4.0,
            actualHours: 4.0,
            trackedSeconds: 14400,
            orderIndex: 0,
            targetDate: todayStr,
          },
          {
            userId: u.id,
            title: `Review Laporan & Koordinasi Tim Harian`,
            description: "Sinkronisasi progress tugas harian dan pelaporan kendala sprint.",
            category: "General",
            priority: "HIGH",
            status: "IN_PROGRESS",
            estimatedHours: 2.0,
            actualHours: 1.0,
            trackedSeconds: 3600,
            orderIndex: 1,
            targetDate: todayStr,
          },
        ],
      });
    }
  }

  console.log("🎉 Seluruh akun tim Difitech & riwayat tugas berhasil di-seed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding team:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
