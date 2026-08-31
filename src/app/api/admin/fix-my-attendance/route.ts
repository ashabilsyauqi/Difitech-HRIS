export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    // Target user (either authenticated user or ashabil)
    const targetEmail = authUser.email || "ashabil@difitech.co.id";
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const latestAttendance = await prisma.attendance.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestAttendance) {
      return NextResponse.json({ error: "Data presensi belum ditemukan" }, { status: 404 });
    }

    // Set clock-in to 09:54:00 WIB (02:54:00 UTC)
    const targetDateStr = latestAttendance.date;
    const newClockIn = new Date(`${targetDateStr}T02:54:00.000Z`);

    const updated = await prisma.attendance.update({
      where: { id: latestAttendance.id },
      data: {
        clockInTime: newClockIn,
        clockInStatus: "ON_TIME",
        clockOutTime: null,
        clockOutStatus: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil disesuaikan ke 09:54 WIB (Tepat Waktu & Aktif Bekerja)!",
      karyawan: user.name,
      tanggal: updated.date,
      jamMasuk: "09:54:00 WIB",
      status: updated.clockInStatus,
      redirect: "/dashboard",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
