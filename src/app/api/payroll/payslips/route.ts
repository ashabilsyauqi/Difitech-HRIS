export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get("periodId");

    const where: any = {};
    if (periodId) {
      where.payrollPeriodId = periodId;
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
            bankName: true,
            bankAccountNumber: true,
            npwpNumber: true,
          },
        },
        payrollPeriod: true,
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json({ payslips });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { periodId, status } = body;

    if (!periodId || !status) {
      return NextResponse.json({ error: "periodId dan status diperlukan" }, { status: 400 });
    }

    // Update all payslips in period
    await prisma.payslip.updateMany({
      where: { payrollPeriodId: periodId },
      data: {
        status: status === "PAID" ? "PAID" : "UNPAID",
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    // Update period status
    const updatedPeriod = await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status },
    });

    return NextResponse.json({ success: true, period: updatedPeriod });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
