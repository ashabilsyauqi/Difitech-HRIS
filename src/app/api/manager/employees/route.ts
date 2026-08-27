export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        avatarUrl: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        npwpNumber: true,
        bpjsKesehatanNumber: true,
        bpjsKetenagakerjaanNumber: true,
        createdAt: true,
        salaryProfile: true,
        _count: {
          select: {
            attendances: true,
            tasks: true,
            payslips: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
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
    const {
      name,
      email,
      password,
      role,
      department,
      jobTitle,
      avatarUrl,
      bankName,
      bankAccountNumber,
      npwpNumber,
      basicSalary,
      positionAllowance,
      transportAllowance,
      communicationAllowance,
      latePenaltyRate,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nama dan email wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password || "password123", 10);

    const newEmployee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || "EMPLOYEE",
        department: department || "Engineering & Teknologi",
        jobTitle: jobTitle || "Karyawan",
        avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dc2626&color=fff`,
        bankName: bankName || "BCA",
        bankAccountNumber: bankAccountNumber || "-",
        bankAccountHolder: name.trim(),
        npwpNumber: npwpNumber || "-",
        bpjsKesehatanNumber: `00012${Math.floor(100000 + Math.random() * 900000)}`,
        bpjsKetenagakerjaanNumber: `98765${Math.floor(100000 + Math.random() * 900000)}`,
        salaryProfile: {
          create: {
            basicSalary: Number(basicSalary) || 8000000,
            positionAllowance: Number(positionAllowance) || 1500000,
            transportAllowance: Number(transportAllowance) || 1000000,
            communicationAllowance: Number(communicationAllowance) || 300000,
            latePenaltyRate: Number(latePenaltyRate) || 50000,
          },
        },
      },
      include: {
        salaryProfile: true,
      },
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
