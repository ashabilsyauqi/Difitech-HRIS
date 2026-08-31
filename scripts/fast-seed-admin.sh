#!/bin/bash
echo "🚀 Running fast database migration & admin registration..."

# 1. Generate Prisma Client
npx prisma generate

# 2. Execute raw SQLite queries directly via node string script
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await prisma.\$executeRawUnsafe(\`ALTER TABLE User ADD COLUMN employmentStatus TEXT DEFAULT 'FULL_TIME';\`);
  } catch(e) {}

  try {
    await prisma.\$executeRawUnsafe(\`
      CREATE TABLE IF NOT EXISTS Department (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        code TEXT,
        description TEXT,
        color TEXT DEFAULT '#dc2626',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    \`);
  } catch(e) {}

  const depts = [
    ['dept_eng', 'Engineering & Teknologi', 'ENG', 'Tim Software Engineering & IT Infrastructure', '#dc2626'],
    ['dept_dsn', 'Kreatif & Desain', 'DSN', 'Tim UI/UX, Multimedia & Creative Graphic', '#8b5cf6'],
    ['dept_ops', 'Operasional & Bisnis', 'OPS', 'Tim Operasional, Finance & Business Admin', '#0ea5e9'],
    ['dept_hrd', 'Manajemen & HR', 'HRD', 'Tim Human Capital, Legal & General Affair', '#10b981'],
    ['dept_mkt', 'Pemasaran & Sales', 'MKT', 'Tim Digital Marketing, Growth & Sales Strategy', '#f59e0b']
  ];

  for (const d of depts) {
    try {
      await prisma.\$executeRawUnsafe(
        \`INSERT OR IGNORE INTO Department (id, name, code, description, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)\`,
        d[0], d[1], d[2], d[3], d[4]
      );
    } catch(e) {}
  }

  const hash = await bcrypt.hash('password123', 10);
  
  await prisma.\$executeRawUnsafe(
    \`INSERT OR REPLACE INTO User (id, email, passwordHash, name, role, department, jobTitle, employmentStatus, avatarUrl, bankName, bankAccountNumber, bankAccountHolder, createdAt, updatedAt)
     VALUES ('user_admin_wijaya', 'wijaya@difitech.co.id', ?, 'Wijaya', 'ADMIN', 'Manajemen & HR', 'Human Capital & Operations Administrator', 'FULL_TIME', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'BCA', '8012349988', 'Wijaya', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)\`,
    hash
  );

  console.log('🎉 AKUN ADMIN & DIVISI SUCCESS! Email: wijaya@difitech.co.id | Pass: password123');
  await prisma.\$disconnect();
  process.exit(0);
}
run();
"
