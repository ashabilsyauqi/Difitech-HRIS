export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDistanceMeters, reverseGeocode, validateTimestampDrift } from "@/lib/geofence";

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
    const clientTimestamp = body.clientTimestamp;
    const notes = body.notes;
    
    // Mode Kunjungan Klien / Kantor
    const attendanceType = body.attendanceType === "CLIENT_VISIT" ? "CLIENT_VISIT" : "OFFICE";
    const clientName = body.clientName?.trim() || null;
    const visitPurpose = body.visitPurpose?.trim() || null;

    if (!photo || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Payload presensi tidak lengkap (foto, koordinat lokasi diperlukan)" },
        { status: 400 }
      );
    }

    if (attendanceType === "CLIENT_VISIT" && !clientName) {
      return NextResponse.json(
        { error: "Nama Klien / Perusahaan yang dikunjungi wajib diisi untuk presensi dinas luar." },
        { status: 400 }
      );
    }

    // 1. Anti-Spoofing: Validate accuracy threshold
    if (accuracy && accuracy > 350) {
      return NextResponse.json(
        { error: `Akurasi GPS terlalu rendah (±${Math.round(accuracy)}m). Sinyal GPS yang lebih presisi diperlukan untuk presensi.` },
        { status: 400 }
      );
    }

    // 2. Anti-Spoofing: Validate Timestamp drift
    if (clientTimestamp) {
      const { isValid, driftSeconds } = validateTimestampDrift(clientTimestamp, 300);
      if (!isValid) {
        return NextResponse.json(
          { error: `Perbedaan jam perangkat terdeteksi (${driftSeconds} detik dari server). Mohon sesuaikan jam perangkat Anda.` },
          { status: 400 }
        );
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Check if already clocked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah melakukan presensi masuk untuk hari ini.", attendance: existing },
        { status: 400 }
      );
    }

    // 4. Fetch Active Office Location
    const office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    let clockInStatus = "ON_TIME";
    let distanceMeters: number | null = null;

    // Check flexible Clock In Window dynamically configured by Admin (e.g. 08:00 - 10:00 WIB with grace period)
    const now = new Date();
    const windowEndStr = office?.flexibleStartWindowEnd || "10:00";
    const [endHours, endMinutes] = windowEndStr.split(":").map((v) => parseInt(v, 10) || 0);
    const graceMinutes = office?.lateGraceMinutes !== undefined ? office.lateGraceMinutes : 5;

    const shiftDeadline = new Date(now);
    shiftDeadline.setHours(endHours, endMinutes + graceMinutes, 0, 0);

    const isLate = now.getTime() > shiftDeadline.getTime();
    const standardWorkMinutes = Math.round((office?.standardWorkDurationHours || 8.0) * 60);

    if (attendanceType === "CLIENT_VISIT") {
      clockInStatus = isLate ? "LATE" : "CLIENT_VISIT";
    } else if (office) {
      distanceMeters = calculateDistanceMeters(
        latitude,
        longitude,
        office.latitude,
        office.longitude
      );

      // Check geofence radius SCBD
      if (distanceMeters > office.radiusMeters) {
        clockInStatus = "OUT_OF_GEOFENCE";
      } else {
        clockInStatus = isLate ? "LATE" : "ON_TIME";
      }
    }

    // Reverse geocode if address not provided
    const address = body.address || (await reverseGeocode(latitude, longitude));
    const userAgent = req.headers.get("user-agent") || "Web Client";

    const attendance = await prisma.attendance.create({
      data: {
        userId: authUser.userId,
        officeId: office?.id,
        date: todayStr,
        attendanceType,
        clientName,
        visitPurpose,
        clockInTime: now,
        clockInPhoto: photo,
        clockInLat: latitude,
        clockInLng: longitude,
        clockInAddress: address,
        clockInAccuracy: accuracy,
        clockInStatus,
        clockInDistance: distanceMeters,
        regularWorkMinutes: standardWorkMinutes,
        deviceInfo: userAgent,
        notes: notes || (attendanceType === "CLIENT_VISIT" ? `Kunjungan Klien: ${clientName} - ${visitPurpose || "Dinas Luar"}` : null),
      },
      include: {
        office: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: attendanceType === "CLIENT_VISIT"
        ? `Presensi Kunjungan Klien (${clientName}) berhasil dicatat.`
        : `Presensi masuk kantor berhasil dicatat [${clockInStatus}].`,
      attendance,
    });
  } catch (error: any) {
    console.error("Clock-in API error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses presensi masuk." },
      { status: 500 }
    );
  }
}
