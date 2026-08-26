import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payslip = await prisma.payslip.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        payrollPeriod: true,
      },
    });

    if (!payslip) {
      return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });
    }

    // Authorization: User can only view their own payslip unless ADMIN/MANAGER
    if (user.role === "EMPLOYEE" && payslip.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Akses ditolak" }, { status: 403 });
    }

    return NextResponse.json({ payslip });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const {
      otherAllowance,
      otherDeductions,
      overtimePay,
      status,
      notes,
    } = body;

    const existing = await prisma.payslip.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Slip gaji tidak ditemukan" }, { status: 404 });
    }

    const newOtherAllowance = otherAllowance !== undefined ? Number(otherAllowance) : existing.otherAllowance;
    const newOtherDeductions = otherDeductions !== undefined ? Number(otherDeductions) : existing.otherDeductions;
    const newOvertimePay = overtimePay !== undefined ? Number(overtimePay) : existing.overtimePay;

    // Recalculate Gross, Deductions, Net
    const grossSalary =
      existing.basicSalary +
      existing.positionAllowance +
      existing.transportAllowance +
      existing.communicationAllowance +
      newOtherAllowance +
      newOvertimePay;

    const totalDeductions =
      existing.latePenaltyTotal +
      existing.bpjsKesehatanEmp +
      existing.bpjsKetenagakerjaanEmp +
      existing.pph21Amount +
      newOtherDeductions;

    const netSalary = grossSalary - totalDeductions;

    const updated = await prisma.payslip.update({
      where: { id: params.id },
      data: {
        otherAllowance: newOtherAllowance,
        otherDeductions: newOtherDeductions,
        overtimePay: newOvertimePay,
        grossSalary,
        totalDeductions,
        netSalary,
        status: status || existing.status,
        paidAt: status === "PAID" ? new Date() : existing.paidAt,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        user: true,
        payrollPeriod: true,
      },
    });

    return NextResponse.json({ payslip: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
