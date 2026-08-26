import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payslips = await prisma.payslip.findMany({
      where: { userId: user.id },
      include: {
        payrollPeriod: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
            bankName: true,
            bankAccountNumber: true,
            npwpNumber: true,
          },
        },
      },
      orderBy: {
        payrollPeriod: {
          startDate: "desc",
        },
      },
    });

    return NextResponse.json({ payslips });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
