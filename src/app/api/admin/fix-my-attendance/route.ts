export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWIBDateString, getWIBTime } from "@/lib/geofence";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "fix"; // "inspect" or "fix"
    const targetEmailParam = searchParams.get("email");
    const requestedTime = searchParams.get("time"); // optional, e.g. "05:50" or "09:55"
    const targetDateParam = searchParams.get("date"); // optional specific date e.g. "2026-09-22"

    // Find target user
    let user = null;
    if (authUser?.email) {
      user = await prisma.user.findUnique({ where: { email: authUser.email } });
    }
    if (!user && targetEmailParam) {
      user = await prisma.user.findUnique({ where: { email: targetEmailParam } });
    }
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: "Ashabil" } },
            { email: { contains: "ashabil" } },
            { email: "ashabil@difitech.co.id" },
            { email: "ashabil@difitech.id" },
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User target (Ashabil) tidak ditemukan di sistem" }, { status: 404 });
    }

    // 1. Fetch recent attendance records for inspection
    const recentAttendances = await prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formatRecord = (att: any) => {
      const clockInWib = att.clockInTime ? getWIBTime(new Date(att.clockInTime)).timeString : null;
      const clockOutWib = att.clockOutTime ? getWIBTime(new Date(att.clockOutTime)).timeString : null;
      return {
        id: att.id,
        date: att.date,
        attendanceType: att.attendanceType,
        clockInTimeUTC: att.clockInTime,
        clockInTimeWIB: clockInWib ? `${clockInWib} WIB` : "-",
        clockInStatus: att.clockInStatus,
        clockOutTimeWIB: clockOutWib ? `${clockOutWib} WIB` : "-",
        clockOutStatus: att.clockOutStatus,
        notes: att.notes,
        createdAt: att.createdAt,
      };
    };

    const initialFormatted = recentAttendances.map(formatRecord);

    // If inspect mode only, return inspected data without mutating
    if (mode === "inspect") {
      return NextResponse.json({
        success: true,
        mode: "inspect",
        user: { id: user.id, name: user.name, email: user.email },
        totalRecords: recentAttendances.length,
        attendances: initialFormatted,
      });
    }

    // 2. Perform Fix
    const modifiedRecords: any[] = [];

    for (const att of recentAttendances) {
      const updateData: any = {};
      let needsUpdate = false;

      // Fix: WFA must always have clockInStatus = "ON_TIME" (no late penalties)
      if (att.attendanceType === "WFA" && att.clockInStatus !== "ON_TIME") {
        updateData.clockInStatus = "ON_TIME";
        needsUpdate = true;
      }

      // Fix: WFA early departure should be ON_TIME
      if (att.attendanceType === "WFA" && att.clockOutStatus === "EARLY_DEPARTURE") {
        updateData.clockOutStatus = "ON_TIME";
        needsUpdate = true;
      }

      // Fix: Specifically for today and yesterday records if marked LATE
      const isTargetDate = targetDateParam
        ? att.date === targetDateParam
        : att.date === "2026-09-21" || att.date === "2026-09-22" || att.id === recentAttendances[0]?.id;

      if (isTargetDate && att.clockInStatus === "LATE") {
        updateData.clockInStatus = "ON_TIME";
        needsUpdate = true;
      }

      // Optional manual override of clockInTime if requested (e.g. ?time=05:50)
      if (requestedTime && isTargetDate) {
        const [hours, minutes] = requestedTime.split(":").map((v) => parseInt(v, 10) || 0);
        const utcH = (hours - 7 + 24) % 24;
        const utcHStr = String(utcH).padStart(2, "0");
        const minStr = String(minutes).padStart(2, "0");
        updateData.clockInTime = new Date(`${att.date}T${utcHStr}:${minStr}:00.000Z`);
        updateData.clockInStatus = "ON_TIME";
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updated = await prisma.attendance.update({
          where: { id: att.id },
          data: updateData,
        });
        modifiedRecords.push({
          id: att.id,
          date: att.date,
          attendanceType: att.attendanceType,
          before: {
            clockInStatus: att.clockInStatus,
            clockOutStatus: att.clockOutStatus,
            clockInTime: att.clockInTime,
          },
          after: {
            clockInStatus: updated.clockInStatus,
            clockOutStatus: updated.clockOutStatus,
            clockInTime: updated.clockInTime,
          },
        });
      }
    }

    // Fetch updated state
    const afterAttendances = await prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      mode: "fix",
      message: `Data presensi ${user.name} berhasil diperiksa & disesuaikan ke ON_TIME (Tepat Waktu)!`,
      user: { id: user.id, name: user.name, email: user.email },
      modifiedCount: modifiedRecords.length,
      modifiedRecords,
      allRecentRecords: afterAttendances.map(formatRecord),
    });
  } catch (error: any) {
    console.error("Fix attendance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
