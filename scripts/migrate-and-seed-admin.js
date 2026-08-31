const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai sinkronisasi database & penambahan admin...");

  // 1. Safe SQLite ALTER TABLE & CREATE TABLE
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN employmentStatus TEXT DEFAULT 'FULL_TIME';`);
    console.log("✅ Kolom 'employmentStatus' berhasil ditambahkan ke tabel User.");
  } catch (e) {
    if (e.message.includes("duplicate column") || e.message.includes("already exists")) {
      console.log("ℹ️ Kolom 'employmentStatus' sudah ada di tabel User.");
    } else {
      console.warn("Notice on alter table User:", e.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Department (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        code TEXT,
        description TEXT,
        color TEXT DEFAULT '#dc2626',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel 'Department' berhasil disiapkan.");
  } catch (e) {
    console.warn("Notice on create table Department:", e.message);
  }

  // 2. Default Departments
  const defaultDepts = [
    { name: "Engineering & Teknologi", code: "ENG", description: "Tim Software Engineering & IT Infrastructure", color: "#dc2626" },
    { name: "Kreatif & Desain", code: "DSN", description: "Tim UI/UX, Multimedia & Creative Graphic", color: "#8b5cf6" },
    { name: "Operasional & Bisnis", code: "OPS", description: "Tim Operasional, Finance & Business Admin", color: "#0ea5e9" },
    { name: "Manajemen & HR", code: "HRD", description: "Tim Human Capital, Legal & General Affair", color: "#10b981" },
    { name: "Pemasaran & Sales", code: "MKT", description: "Tim Digital Marketing, Growth & Sales Strategy", color: "#f59e0b" },
  ];

  for (const dept of defaultDepts) {
    try {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: { code: dept.code, description: dept.description, color: dept.color },
        create: dept,
      });
      console.log(`✅ Divisi '${dept.name}' (${dept.code}) siap.`);
    } catch (e) {
      console.warn(`Notice on department ${dept.name}:`, e.message);
    }
  }

  // 3. Upsert Admin Account: wijaya@difitech.co.id
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "wijaya@difitech.co.id" },
    update: {
      name: "Wijaya",
      role: "ADMIN",
      department: "Manajemen & HR",
      jobTitle: "Human Capital & Operations Administrator",
      employmentStatus: "FULL_TIME",
      passwordHash,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
    create: {
      email: "wijaya@difitech.co.id",
      name: "Wijaya",
      passwordHash,
      role: "ADMIN",
      department: "Manajemen & HR",
      jobTitle: "Human Capital & Operations Administrator",
      employmentStatus: "FULL_TIME",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      bankName: "BCA",
      bankAccountNumber: "8012349988",
      bankAccountHolder: "Wijaya",
    },
  });

  console.log(`\n🎉 AKUN ADMIN BERHASIL DIBUAT / DIPERBARUI:`);
  console.log(`   - Email: ${adminUser.email}`);
  console.log(`   - Nama: ${adminUser.name}`);
  console.log(`   - Role: ${adminUser.role}`);
  console.log(`   - Divisi: ${adminUser.department}`);
  console.log(`   - Status Karyawan: ${adminUser.employmentStatus}`);
  console.log(`   - Password: password123\n`);
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
