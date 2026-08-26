import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const profiles = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        bankName: true,
        bankAccountNumber: true,
        npwpNumber: true,
        bpjsKesehatanNumber: true,
        bpjsKetenagakerjaanNumber: true,
        salaryProfile: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ profiles });
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
    const {
      userId,
      basicSalary,
      positionAllowance,
      transportAllowance,
      communicationAllowance,
      otherAllowance,
      latePenaltyRate,
      overtimeRatePerHour,
      bpjsKesehatanActive,
      bpjsKetenagakerjaanActive,
      applyPph21,
      bankName,
      bankAccountNumber,
      npwpNumber,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId diperlukan" }, { status: 400 });
    }

    // Update User Bank & Tax info
    if (bankName || bankAccountNumber || npwpNumber) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          bankName: bankName !== undefined ? bankName : undefined,
          bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
          npwpNumber: npwpNumber !== undefined ? npwpNumber : undefined,
        },
      });
    }

    // Update or create SalaryProfile
    const profile = await prisma.salaryProfile.upsert({
      where: { userId },
      update: {
        basicSalary: basicSalary !== undefined ? Number(basicSalary) : undefined,
        positionAllowance: positionAllowance !== undefined ? Number(positionAllowance) : undefined,
        transportAllowance: transportAllowance !== undefined ? Number(transportAllowance) : undefined,
        communicationAllowance: communicationAllowance !== undefined ? Number(communicationAllowance) : undefined,
        otherAllowance: otherAllowance !== undefined ? Number(otherAllowance) : undefined,
        latePenaltyRate: latePenaltyRate !== undefined ? Number(latePenaltyRate) : undefined,
        overtimeRatePerHour: overtimeRatePerHour !== undefined ? Number(overtimeRatePerHour) : undefined,
        bpjsKesehatanActive: bpjsKesehatanActive !== undefined ? Boolean(bpjsKesehatanActive) : undefined,
        bpjsKetenagakerjaanActive: bpjsKetenagakerjaanActive !== undefined ? Boolean(bpjsKetenagakerjaanActive) : undefined,
        applyPph21: applyPph21 !== undefined ? Boolean(applyPph21) : undefined,
      },
      create: {
        userId,
        basicSalary: Number(basicSalary) || 8000000,
        positionAllowance: Number(positionAllowance) || 1500000,
        transportAllowance: Number(transportAllowance) || 1000000,
        communicationAllowance: Number(communicationAllowance) || 300000,
        otherAllowance: Number(otherAllowance) || 0,
        latePenaltyRate: Number(latePenaltyRate) || 50000,
        overtimeRatePerHour: Number(overtimeRatePerHour) || 75000,
        bpjsKesehatanActive: bpjsKesehatanActive !== undefined ? Boolean(bpjsKesehatanActive) : true,
        bpjsKetenagakerjaanActive: bpjsKetenagakerjaanActive !== undefined ? Boolean(bpjsKetenagakerjaanActive) : true,
        applyPph21: applyPph21 !== undefined ? Boolean(applyPph21) : true,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
