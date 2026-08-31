export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    // 1. Safe Alter Table for employmentStatus
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN employmentStatus TEXT DEFAULT 'FULL_TIME';`);
    } catch (e) {}

    // 2. Safe Create Table for Department
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
    } catch (e) {}

    // 3. Upsert Default Departments
    const depts = [
      { id: "dept_eng", name: "Engineering & Teknologi", code: "ENG", description: "Tim Software Engineering & IT Infrastructure", color: "#dc2626" },
      { id: "dept_dsn", name: "Kreatif & Desain", code: "DSN", description: "Tim UI/UX, Multimedia & Creative Graphic", color: "#8b5cf6" },
      { id: "dept_ops", name: "Operasional & Bisnis", code: "OPS", description: "Tim Operasional, Finance & Business Admin", color: "#0ea5e9" },
      { id: "dept_hrd", name: "Manajemen & HR", code: "HRD", description: "Tim Human Capital, Legal & General Affair", color: "#10b981" },
      { id: "dept_mkt", name: "Pemasaran & Sales", code: "MKT", description: "Tim Digital Marketing, Growth & Sales Strategy", color: "#f59e0b" },
    ];

    for (const d of depts) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO Department (id, name, code, description, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          d.id, d.name, d.code, d.description, d.color
        );
      } catch (e) {}
    }

    // 4. Upsert Admin Account: wijaya@difitech.co.id
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.$executeRawUnsafe(
      `INSERT OR REPLACE INTO User (id, email, passwordHash, name, role, department, jobTitle, employmentStatus, avatarUrl, bankName, bankAccountNumber, bankAccountHolder, createdAt, updatedAt)
       VALUES ('user_admin_wijaya', 'wijaya@difitech.co.id', ?, 'Wijaya', 'ADMIN', 'Manajemen & HR', 'Human Capital & Operations Administrator', 'FULL_TIME', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'BCA', '8012349988', 'Wijaya', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      passwordHash
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aktivasi Admin Wijaya - Difitech HRIS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; max-width: 480px; width: 90%; border: 1px solid #334155; }
            .badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 700; font-size: 0.875rem; margin-bottom: 1.5rem; background: #065f46; color: #34d399; border: 1px solid #059669; }
            h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.75rem; line-height: 1.5; }
            .btn { display: inline-block; font-weight: 700; font-size: 0.875rem; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; transition: background 0.2s; background: #dc2626; color: white; }
            .btn:hover { background: #b91c1c; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">AKTIVASI ADMIN BERHASIL 100% 🟢</span>
            <h1>Akun Admin Wijaya Ready!</h1>
            <p>
              Akun Admin <strong>wijaya@difitech.co.id</strong> (Password: <strong>password123</strong>) dan struktur 5 divisi baru telah sukses diaktifkan di database.
            </p>
            <a href="/login" class="btn">🚀 Buka Halaman Login Sekarang</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
