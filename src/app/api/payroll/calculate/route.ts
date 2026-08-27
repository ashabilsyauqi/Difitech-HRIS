export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { periodId } = body;

    if (!periodId) {
      return NextResponse.json({ error: "Parameter periodId diperlukan" }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return NextResponse.json({ error: "Periode payroll tidak ditemukan" }, { status: 404 });
    }

    // Ambil seluruh user dan profile gaji
    const employees = await prisma.user.findMany({
      include: {
        salaryProfile: true,
        attendances: {
          where: {
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
          },
        },
        tasks: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    let totalGrossAll = 0;
    let totalDedAll = 0;
    let totalNetAll = 0;

    const payslipResults: any[] = [];

    for (const emp of employees) {
      // Default / fallback salary profile if not configured
      const salary = emp.salaryProfile || {
        basicSalary: 8000000,
        positionAllowance: 1500000,
        transportAllowance: 1000000,
        communicationAllowance: 300000,
        otherAllowance: 0,
        latePenaltyRate: 50000,
        overtimeRatePerHour: 75000,
        bpjsKesehatanActive: true,
        bpjsKetenagakerjaanActive: true,
        applyPph21: true,
      };

      // Hitung kehadiran dan keterlambatan dari log CamStamp
      const attendanceDaysCount = emp.attendances.length || 22; // default work days
      const lateCount = emp.attendances.filter((a) => a.clockInStatus === "LATE").length;
      const latePenaltyTotal = lateCount * salary.latePenaltyRate;

      // Hitung lembur (jika ada task aktual > estimasi)
      const overtimeHours = emp.tasks.reduce((acc, t) => {
        if (t.actualHours && t.actualHours > t.estimatedHours) {
          return acc + (t.actualHours - t.estimatedHours);
        }
        return acc;
      }, 0);
      const overtimePay = Math.round(overtimeHours * salary.overtimeRatePerHour);

      // Total Penerimaan
      const grossSalary =
        salary.basicSalary +
        salary.positionAllowance +
        salary.transportAllowance +
        salary.communicationAllowance +
        (salary.otherAllowance || 0) +
        overtimePay;

      // BPJS Karyawan: Kesehatan 1%, Ketenagakerjaan 2% JHT + 1% JP
      let bpjsKes = 0;
      let bpjsTk = 0;
      if (salary.bpjsKesehatanActive) {
        const bpjsKesBase = Math.min(salary.basicSalary, 12000000);
        bpjsKes = Math.round(bpjsKesBase * 0.01);
      }
      if (salary.bpjsKetenagakerjaanActive) {
        bpjsTk = Math.round(salary.basicSalary * 0.02 + Math.min(salary.basicSalary, 10042300) * 0.01);
      }

      // PPh 21 TER Estimasi
      let pph21 = 0;
      if (salary.applyPph21) {
        let pph21Rate = 0.05;
        if (grossSalary > 20000000) pph21Rate = 0.15;
        else if (grossSalary > 10000000) pph21Rate = 0.08;
        pph21 = Math.round(grossSalary * pph21Rate);
      }

      const totalDeductions = latePenaltyTotal + bpjsKes + bpjsTk + pph21;
      const netSalary = grossSalary - totalDeductions;

      totalGrossAll += grossSalary;
      totalDedAll += totalDeductions;
      totalNetAll += netSalary;

      const payslip = await prisma.payslip.upsert({
        where: {
          payrollPeriodId_userId: {
            payrollPeriodId: period.id,
            userId: emp.id,
          },
        },
        update: {
          attendanceDaysCount,
          lateCount,
          latePenaltyTotal,
          overtimeHours,
          overtimePay,
          basicSalary: salary.basicSalary,
          positionAllowance: salary.positionAllowance,
          transportAllowance: salary.transportAllowance,
          communicationAllowance: salary.communicationAllowance,
          otherAllowance: salary.otherAllowance || 0,
          grossSalary,
          bpjsKesehatanEmp: bpjsKes,
          bpjsKetenagakerjaanEmp: bpjsTk,
          pph21Amount: pph21,
          totalDeductions,
          netSalary,
          bankName: emp.bankName || "BCA",
          bankAccountNumber: emp.bankAccountNumber || "-",
          notes: lateCount > 0 ? `Potongan keterlambatan ${lateCount}x presensi CamStamp` : "Lengkap & terverifikasi",
        },
        create: {
          payrollPeriodId: period.id,
          userId: emp.id,
          attendanceDaysCount,
          lateCount,
          latePenaltyTotal,
          overtimeHours,
          overtimePay,
          basicSalary: salary.basicSalary,
          positionAllowance: salary.positionAllowance,
          transportAllowance: salary.transportAllowance,
          communicationAllowance: salary.communicationAllowance,
          otherAllowance: salary.otherAllowance || 0,
          grossSalary,
          bpjsKesehatanEmp: bpjsKes,
          bpjsKetenagakerjaanEmp: bpjsTk,
          pph21Amount: pph21,
          totalDeductions,
          netSalary,
          bankName: emp.bankName || "BCA",
          bankAccountNumber: emp.bankAccountNumber || "-",
          status: "UNPAID",
          notes: lateCount > 0 ? `Potongan keterlambatan ${lateCount}x presensi CamStamp` : "Lengkap & terverifikasi",
        },
      });

      payslipResults.push(payslip);
    }

    // Update totals and status to PROCESSED
    await prisma.payrollPeriod.update({
      where: { id: period.id },
      data: {
        totalGrossPayout: totalGrossAll,
        totalDeductions: totalDedAll,
        totalNetPayout: totalNetAll,
        status: period.status === "DRAFT" ? "PROCESSED" : period.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengkalkulasi penggajian untuk ${payslipResults.length} karyawan`,
      totalEmployees: payslipResults.length,
      totalNetPayout: totalNetAll,
    });
  } catch (error: any) {
    console.error("Payroll calculation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
