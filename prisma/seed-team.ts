import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const REAL_TEAM_MEMBERS = [
  {
    email: "admin@difitech.id",
    name: "Super Admin Difitech",
    role: "ADMIN",
    department: "Human Capital & Operations",
    jobTitle: "Head of HR & Administrator",
    basicSalary: 15000000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    targetCard: "HR",
  },
  {
    email: "wijaya@difitech.co.id",
    name: "Wijaya",
    role: "ADMIN",
    department: "CEO",
    jobTitle: "Chief Executive Officer (CEO)",
    basicSalary: 12000000,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    targetCard: "CEO",
  },
  {
    email: "ashabil@difitech.co.id",
    name: "Ashabil Syauqi",
    role: "EMPLOYEE",
    department: "Website",
    jobTitle: "Web Developer",
    basicSalary: 8000000,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    targetCard: "WEB",
  },
  {
    email: "siswandi@difitech.co.id",
    name: "Siswandi",
    role: "EMPLOYEE",
    department: "Ads",
    jobTitle: "Ads Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    targetCard: "ADS",
  },
  {
    email: "fdhlfebriaan@gmail.com",
    name: "Fadhil",
    role: "EMPLOYEE",
    department: "Ads",
    jobTitle: "Ads Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    targetCard: "ADS",
  },
  {
    email: "danar@difitech.co.id",
    name: "Danar",
    role: "EMPLOYEE",
    department: "SEO",
    jobTitle: "SEO Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    targetCard: "SEO",
  },
  {
    email: "muditha@difitech.co.id",
    name: "Muditha",
    role: "EMPLOYEE",
    department: "Sosmed",
    jobTitle: "Social Media Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    targetCard: "SOSMED",
  },
  {
    email: "nida@difitech.co.id",
    name: "Nida",
    role: "EMPLOYEE",
    department: "Sosmed",
    jobTitle: "Social Media Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    targetCard: "SOSMED",
  },
  {
    email: "khalilan@difitech.co.id",
    name: "Khalilan",
    role: "EMPLOYEE",
    department: "Sosmed",
    jobTitle: "Social Media Specialist",
    basicSalary: 3000000,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    targetCard: "SOSMED",
  },
  {
    email: "nadya@difitech.co.id",
    name: "Nadya",
    role: "EMPLOYEE",
    department: "Sosmed",
    jobTitle: "Social Media Specialist",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    targetCard: "SOSMED",
  },
  {
    email: "fajar@difitech.co.id",
    name: "Fajar",
    role: "EMPLOYEE",
    department: "Sosmed",
    jobTitle: "Social Media Specialist & Video Editor",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    targetCard: "SOSMED",
  },
  {
    email: "avila@difitech.co.id",
    name: "Avila",
    role: "EMPLOYEE",
    department: "HRD",
    jobTitle: "Human Resources (HRD)",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    targetCard: "HR",
  },
  {
    email: "rima@difitech.co.id",
    name: "Rima",
    role: "EMPLOYEE",
    department: "DM Executive",
    jobTitle: "Digital Marketing Executive",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    targetCard: "DM_EXECUTIVE",
  },
  {
    email: "dewi@difitech.co.id",
    name: "Dewi",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan Operasional",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    targetCard: "OPS",
  },
];

export const OFFICIAL_DEPARTMENTS = [
  { id: "dept_website", name: "Website", code: "WEB", description: "Divisi Website & Software Engineering", color: "#10b981" },
  { id: "dept_ads", name: "Ads", code: "ADS", description: "Divisi Advertising & Media Buying", color: "#3b82f6" },
  { id: "dept_seo", name: "SEO", code: "SEO", description: "Divisi Search Engine Optimization & Content", color: "#f59e0b" },
  { id: "dept_sosmed", name: "Sosmed", code: "SMD", description: "Divisi Social Media & Content Production", color: "#ec4899" },
  { id: "dept_hrd", name: "HRD", code: "HRD", description: "Divisi Human Resources & People Operations", color: "#64748b" },
  { id: "dept_dm_executive", name: "DM Executive", code: "DME", description: "Digital Marketing Executive", color: "#6366f1" },
  { id: "dept_ceo", name: "CEO", code: "CEO", description: "Chief Executive Officer & Executive Board", color: "#8b5cf6" },
  { id: "dept_marketplace", name: "Marketplace", code: "MKT", description: "Divisi Marketplace & E-Commerce", color: "#a855f7" },
  { id: "dept_operational", name: "Operational", code: "OPS", description: "Divisi Operasional & Bisnis", color: "#0ea5e9" },
];

async function main() {
  console.log("🚀 Mendaftarkan seluruh akun karyawan riil & divisi resmi Difitech...");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Departemen Resmi
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

  // 2. Seed / Update Karyawan Riil
  for (const member of REAL_TEAM_MEMBERS) {
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

    console.log(`👤 Akun Karyawan siap: ${member.name} (${member.email}) -> Divisi: ${member.department} (${member.targetCard})`);
  }

  // 3. Kantor Pusat Default
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

  console.log("🎉 Berhasil menanam data seluruh karyawan riil Difitech!");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("❌ Error seeding team:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

