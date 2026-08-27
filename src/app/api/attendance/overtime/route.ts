export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reverseGeocode } from "@/lib/geofence";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, photo, latitude, longitude, notes } = body;
    const todayStr = new Date().toISOString().split("T")[0];

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
      include: {
        user: {
          include: {
            salaryProfile: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Belum ada sesi presensi masuk aktif untuk hari ini." },
        { status: 404 }
      );
    }

    const now = new Date();

    if (action === "START_OVERTIME") {
      // 1. Kunci jam kerja 8 jam reguler dan mulai sesi lembur
      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          isOvertime: true,
          regularWorkMinutes: 480, // 8 jam reguler dikunci
          overtimeStartTime: now,
          notes: notes ? `${attendance.notes ? attendance.notes + "\n" : ""}Mulai Sesi Lembur: ${notes}` : attendance.notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Sesi kerja lembur resmi telah dimulai.",
        attendance: updated,
      });
    }

    if (action === "FINISH_OVERTIME") {
      // 2. Selesaikan sesi lembur dan Clock Out
      const overtimeStart = attendance.overtimeStartTime || now;
      const overtimeDurationMinutes = Math.max(
        15,
        Math.round((now.getTime() - new Date(overtimeStart).getTime()) / (1000 * 60))
      );
      const totalOvertimeHours = Number((overtimeDurationMinutes / 60).toFixed(2));
      const totalDuration = (attendance.regularWorkMinutes || 480) + overtimeDurationMinutes;

      const address =
        latitude && longitude
          ? await reverseGeocode(Number(latitude), Number(longitude))
          : attendance.clockInAddress;

      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOutTime: now,
          clockOutPhoto: photo || attendance.clockInPhoto,
          clockOutLat: latitude ? Number(latitude) : attendance.clockInLat,
          clockOutLng: longitude ? Number(longitude) : attendance.clockInLng,
          clockOutAddress: address,
          clockOutStatus: "OVERTIME_COMPLETED",
          workDurationMinutes: totalDuration,
          overtimeEndTime: now,
          overtimeMinutes: overtimeDurationMinutes,
          notes: notes ? `${attendance.notes ? attendance.notes + "\n" : ""}Selesai Lembur (${totalOvertimeHours} jam): ${notes}` : attendance.notes,
        },
      });

      // Update Payslip Overtime if current month period exists
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const currentPeriod = await prisma.payrollPeriod.findUnique({
        where: { month_year: { month: currentMonth, year: currentYear } },
      });

      if (currentPeriod) {
        const hourlyRate = attendance.user.salaryProfile?.overtimeRatePerHour || 75000;
        const overtimePayInc = Math.round(totalOvertimeHours * hourlyRate);

        await prisma.payslip.upsert({
          where: {
            payrollPeriodId_userId: {
              payrollPeriodId: currentPeriod.id,
              userId: authUser.userId,
            },
          },
          update: {
            overtimeHours: { increment: totalOvertimeHours },
            overtimePay: { increment: overtimePayInc },
            grossSalary: { increment: overtimePayInc },
            netSalary: { increment: overtimePayInc },
          },
          create: {
            payrollPeriodId: currentPeriod.id,
            userId: authUser.userId,
            basicSalary: attendance.user.salaryProfile?.basicSalary || 8000000,
            overtimeHours: totalOvertimeHours,
            overtimePay: overtimePayInc,
            grossSalary: (attendance.user.salaryProfile?.basicSalary || 8000000) + overtimePayInc,
            netSalary: (attendance.user.salaryProfile?.basicSalary || 8000000) + overtimePayInc,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Sesi lembur selesai. Durasi lembur: ${Math.floor(overtimeDurationMinutes / 60)}j ${overtimeDurationMinutes % 60}m.`,
        attendance: updated,
      });
    }

    if (action === "DECLINE_OVERTIME") {
      // 3. Karyawan memilih tidak lembur -> Auto/Confirmed Clock Out shift reguler 8 jam
      const address =
        latitude && longitude
          ? await reverseGeocode(Number(latitude), Number(longitude))
          : attendance.clockInAddress;

      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOutTime: now,
          clockOutPhoto: photo || attendance.clockInPhoto,
          clockOutLat: latitude ? Number(latitude) : attendance.clockInLat,
          clockOutLng: longitude ? Number(longitude) : attendance.clockInLng,
          clockOutAddress: address,
          clockOutStatus: "ON_TIME",
          workDurationMinutes: 480, // Tepat 8 jam
          regularWorkMinutes: 480,
          isOvertime: false,
          notes: attendance.notes ? `${attendance.notes}\nShift reguler 8 jam selesai.` : "Shift reguler 8 jam selesai.",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Shift reguler 8 jam selesai. Presensi pulang berhasil dicatat.",
        attendance: updated,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("Overtime API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
