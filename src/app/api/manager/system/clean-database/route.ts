import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang berhak melakukan pembersihan database" }, { status: 403 });
    }

    // 1. Hapus semua transaksi
    await prisma.payslip.deleteMany({});
    await prisma.payrollPeriod.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.attendance.deleteMany({});

    // 2. Hapus profil gaji karyawan lain
    await prisma.salaryProfile.deleteMany({
      where: {
        user: {
          email: { not: "admin@difitech.id" },
        },
      },
    });

    // 3. Hapus seluruh karyawan kecuali admin@difitech.id
    await prisma.user.deleteMany({
      where: {
        email: { not: "admin@difitech.id" },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Seluruh data dummy berhasil dihapus bersih dari database!",
    });
  } catch (error: any) {
    console.error("Clean DB Error:", error);
    return NextResponse.json({ error: error.message || "Gagal membersihkan database" }, { status: 500 });
  }
}
