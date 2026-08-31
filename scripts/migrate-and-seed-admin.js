const { execSync } = require("child_process");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("🚀 [1/3] Generating Prisma Client di server...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
  } catch (e) {
    console.warn("Prisma generate warning:", e.message);
  }

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  console.log("\n🚀 [2/3] Sinkronisasi kolom database & tabel divisi...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN employmentStatus TEXT DEFAULT 'FULL_TIME';`);
    console.log("✅ Kolom 'employmentStatus' siap di tabel User.");
  } catch (e) {
    // Column might already exist
    console.log("ℹ️ Kolom 'employmentStatus' sudah ada.");
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
    console.log("✅ Tabel 'Department' siap.");
  } catch (e) {
    console.warn("Notice Department table:", e.message);
  }

  // Insert default departments using raw SQL
  const defaultDepts = [
    { id: "dept_eng", name: "Engineering & Teknologi", code: "ENG", description: "Tim Software Engineering & IT Infrastructure", color: "#dc2626" },
    { id: "dept_dsn", name: "Kreatif & Desain", code: "DSN", description: "Tim UI/UX, Multimedia & Creative Graphic", color: "#8b5cf6" },
    { id: "dept_ops", name: "Operasional & Bisnis", code: "OPS", description: "Tim Operasional, Finance & Business Admin", color: "#0ea5e9" },
    { id: "dept_hrd", name: "Manajemen & HR", code: "HRD", description: "Tim Human Capital, Legal & General Affair", color: "#10b981" },
    { id: "dept_mkt", name: "Pemasaran & Sales", code: "MKT", description: "Tim Digital Marketing, Growth & Sales Strategy", color: "#f59e0b" },
  ];

  for (const d of defaultDepts) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT OR IGNORE INTO Department (id, name, code, description, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        d.id, d.name, d.code, d.description, d.color
      );
      console.log(`✅ Divisi '${d.name}' (${d.code}) siap.`);
    } catch (e) {
      console.warn("Dept insert notice:", e.message);
    }
  }

  console.log("\n🚀 [3/3] Mendaftarkan Akun Admin: wijaya@difitech.co.id...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminId = "user_admin_wijaya";

  // Check if exists
  const existingUser = await prisma.user.findUnique({ where: { email: "wijaya@difitech.co.id" } });
  if (existingUser) {
    await prisma.$executeRawUnsafe(
      `UPDATE User SET name = 'Wijaya', role = 'ADMIN', department = 'Manajemen & HR', jobTitle = 'Human Capital & Operations Administrator', employmentStatus = 'FULL_TIME', passwordHash = ? WHERE email = 'wijaya@difitech.co.id'`,
      passwordHash
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO User (id, email, passwordHash, name, role, department, jobTitle, employmentStatus, avatarUrl, bankName, bankAccountNumber, bankAccountHolder, createdAt, updatedAt) 
       VALUES (?, 'wijaya@difitech.co.id', ?, 'Wijaya', 'ADMIN', 'Manajemen & HR', 'Human Capital & Operations Administrator', 'FULL_TIME', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'BCA', '8012349988', 'Wijaya', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      adminId, passwordHash
    );
  }

  console.log(`\n🎉 AKUN ADMIN BERHASIL DIAKTIFKAN:`);
  console.log(`   - Email: wijaya@difitech.co.id`);
  console.log(`   - Password: password123`);
  console.log(`   - Role: ADMIN`);
  console.log(`   - Divisi: Manajemen & HR`);
  console.log(`   - Status Karyawan: Full Time\n`);
}

main().catch(console.error);
