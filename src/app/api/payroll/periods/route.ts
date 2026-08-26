import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const periods = await prisma.payrollPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: {
          select: { payslips: true },
        },
      },
    });

    return NextResponse.json({ periods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { periodLabel, month, year, startDate, endDate, cutoffDate, paymentDate } = body;

    if (!periodLabel || !month || !year) {
      return NextResponse.json({ error: "Data periode tidak lengkap" }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        periodLabel,
        month: Number(month),
        year: Number(year),
        startDate: startDate || `${year}-${String(month).padStart(2, "0")}-01`,
        endDate: endDate || `${year}-${String(month).padStart(2, "0")}-28`,
        cutoffDate: cutoffDate || `${year}-${String(month).padStart(2, "0")}-25`,
        paymentDate: paymentDate || `${year}-${String(month).padStart(2, "0")}-28`,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ period }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
