import { prisma } from "@/lib/prisma";
import { getWIBDateString } from "@/lib/geofence";

/**
 * Automatically finalizes any abandoned / unclosed overtime sessions from previous days.
 * Ensures employees who worked late and forgot to click "Selesaikan Lembur" before sleeping
 * still get their overtime hours recorded and credited.
 */
export async function autoFinalizeUnclosedOvertime(targetUserId?: string) {
  try {
    const todayStr = getWIBDateString();

    const whereClause: any = {
      isOvertime: true,
      clockOutTime: null,
      date: {
        lt: todayStr,
      },
    };

    if (targetUserId) {
      whereClause.userId = targetUserId;
    }

    const unclosedRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            salaryProfile: true,
          },
        },
        tasks: true,
      },
    });

    if (!unclosedRecords || unclosedRecords.length === 0) {
      return { count: 0, finalized: [] };
    }

    const finalizedList = [];

    for (const record of unclosedRecords) {
      const startMs = record.overtimeStartTime
        ? new Date(record.overtimeStartTime).getTime()
        : (record.clockInTime ? new Date(record.clockInTime).getTime() + (record.regularWorkMinutes || 480) * 60 * 1000 : null);

      let durationMinutes = 120; // Default fallback: 2 jam lembur jika tidak ada data aktivitas detail

      if (startMs) {
        // Cari aktivitas task terakhir pada hari tersebut
        let lastTaskMs = startMs;
        if (record.tasks && record.tasks.length > 0) {
          for (const t of record.tasks) {
            const taskUpdatedMs = new Date(t.updatedAt).getTime();
            if (taskUpdatedMs > lastTaskMs) {
              lastTaskMs = taskUpdatedMs;
            }
          }
        }

        const elapsedMs = lastTaskMs - startMs;
        if (elapsedMs > 15 * 60 * 1000) {
          // Ada aktivitas terdeteksi setelah lembur dimulai
          const computedMins = Math.round(elapsedMs / (60 * 1000));
          // Batasi durasi lembur wajar: minimal 60 menit, maksimal 240 menit (4 jam)
          durationMinutes = Math.min(Math.max(computedMins, 60), 240);
        } else {
          // Tetap berikan alokasi standar wajar 2 jam (120 menit)
          durationMinutes = 120;
        }
      }

      const overtimeHours = Number((durationMinutes / 60).toFixed(2));
      const finalEndTime = startMs
        ? new Date(startMs + durationMinutes * 60 * 1000)
        : new Date();

      const totalWorkMinutes = (record.regularWorkMinutes || 480) + durationMinutes;

      // Update Attendance record
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          clockOutTime: finalEndTime,
          overtimeEndTime: finalEndTime,
          overtimeMinutes: durationMinutes,
          clockOutStatus: "OVERTIME_COMPLETED",
          workDurationMinutes: totalWorkMinutes,
          clockOutAddress: record.clockOutAddress || record.clockInAddress,
          clockOutPhoto: record.clockOutPhoto || record.clockInPhoto,
          notes: record.notes
            ? `${record.notes}\n[Selesai Otomatis]: Sesi lembur tuntas dicatat (${overtimeHours} jam).`
            : `[Selesai Otomatis]: Sesi lembur tuntas dicatat (${overtimeHours} jam).`,
        },
      });

      // Update Payslip period for this attendance date
      const recordDate = new Date(record.date);
      const month = recordDate.getMonth() + 1;
      const year = recordDate.getFullYear();

      const period = await prisma.payrollPeriod.findUnique({
        where: { month_year: { month, year } },
      });

      if (period) {
        const hourlyRate = record.user?.salaryProfile?.overtimeRatePerHour || 75000;
        const overtimePayInc = Math.round(overtimeHours * hourlyRate);

        await prisma.payslip.upsert({
          where: {
            payrollPeriodId_userId: {
              payrollPeriodId: period.id,
              userId: record.userId,
            },
          },
          update: {
            overtimeHours: { increment: overtimeHours },
            overtimePay: { increment: overtimePayInc },
            grossSalary: { increment: overtimePayInc },
            netSalary: { increment: overtimePayInc },
          },
          create: {
            payrollPeriodId: period.id,
            userId: record.userId,
            basicSalary: record.user?.salaryProfile?.basicSalary || 8000000,
            overtimeHours: overtimeHours,
            overtimePay: overtimePayInc,
            grossSalary: (record.user?.salaryProfile?.basicSalary || 8000000) + overtimePayInc,
            netSalary: (record.user?.salaryProfile?.basicSalary || 8000000) + overtimePayInc,
          },
        });
      }

      finalizedList.push({
        attendanceId: record.id,
        date: record.date,
        userName: record.user?.name,
        overtimeMinutes: durationMinutes,
        overtimeHours,
      });
    }

    return { count: finalizedList.length, finalized: finalizedList };
  } catch (error) {
    console.error("autoFinalizeUnclosedOvertime error:", error);
    return { count: 0, error };
  }
}
