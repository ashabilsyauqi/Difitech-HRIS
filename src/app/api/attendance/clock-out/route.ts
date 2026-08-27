export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceMeters, reverseGeocode } from "@/lib/geofence";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const photo = body.photo || body.photoDataUrl;
    const latitude = typeof body.latitude === "number" ? body.latitude : parseFloat(body.latitude);
    const longitude = typeof body.longitude === "number" ? body.longitude : parseFloat(body.longitude);
    const accuracy = body.accuracy ? Number(body.accuracy) : null;
    const notes = body.notes;

    if (!photo || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Missing required clock-out payload (photo, coordinates)" },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
      include: {
        office: true,
        tasks: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Belum ada sesi presensi masuk aktif untuk hari ini." },
        { status: 400 }
      );
    }

    if (attendance.clockOutTime) {
      return NextResponse.json(
        { error: "Anda sudah melakukan presensi pulang untuk hari ini.", attendance },
        { status: 400 }
      );
    }

    const now = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((now.getTime() - new Date(attendance.clockInTime).getTime()) / (1000 * 60))
    );

    let clockOutStatus = "ON_TIME";
    let distanceMeters: number | null = null;

    if (attendance.office) {
      distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        attendance.office.latitude,
        attendance.office.longitude
      );

      if (distanceMeters > attendance.office.radiusMeters) {
        clockOutStatus = "OUT_OF_GEOFENCE";
      } else {
        const [endHours, endMinutes] = (attendance.office.workEndTime || "17:00").split(":").map(Number);
        const shiftEnd = new Date(now);
        shiftEnd.setHours(endHours, endMinutes, 0, 0);

        if (now.getTime() < shiftEnd.getTime() - 15 * 60 * 1000) {
          clockOutStatus = "EARLY_DEPARTURE";
        }
      }
    }

    const address = body.address || (await reverseGeocode(latitude, longitude));

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutTime: now,
        clockOutPhoto: photo,
        clockOutLat: latitude,
        clockOutLng: longitude,
        clockOutAddress: address,
        clockOutAccuracy: accuracy,
        clockOutStatus,
        clockOutDistance: distanceMeters,
        workDurationMinutes: durationMinutes,
        notes: notes ? `${attendance.notes ? attendance.notes + "\n" : ""}${notes}` : attendance.notes,
      },
      include: {
        office: true,
        tasks: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Presensi pulang berhasil dicatat. Total durasi kerja: ${Math.floor(durationMinutes / 60)}j ${durationMinutes % 60}m.`,
      attendance: updated,
    });
  } catch (error: any) {
    console.error("Clock-out API error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses presensi pulang." },
      { status: 500 }
    );
  }
}
