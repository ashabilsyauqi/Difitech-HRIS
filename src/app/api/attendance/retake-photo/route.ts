export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFeatureFlags } from "@/lib/feature-flags";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flags = getFeatureFlags();
    if (!flags.allowRetakeClockInPhoto) {
      return NextResponse.json(
        { error: "Fitur foto ulang masuk sedang dinonaktifkan oleh Administrator." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const photo = body.photo || body.photoDataUrl;
    if (!photo) {
      return NextResponse.json({ error: "Foto tidak boleh kosong" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Data presensi hari ini tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockInPhoto: photo,
      },
      include: {
        office: true,
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Foto presensi masuk berhasil diperbarui dengan stempel jam masuk pagi!",
      attendance: updated,
    });
  } catch (error: any) {
    console.error("Retake photo error:", error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui foto" }, { status: 500 });
  }
}
