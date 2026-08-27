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

  console.log("🎉 Seluruh akun tim Difitech berhasil didaftarkan dengan kata sandi: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding team:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
