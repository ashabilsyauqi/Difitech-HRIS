export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        salaryProfile: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ employee });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      department,
      jobTitle,
      employmentStatus,
      password,
      bankName,
      bankAccountNumber,
      npwpNumber,
      basicSalary,
      positionAllowance,
      transportAllowance,
      communicationAllowance,
      latePenaltyRate,
    } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (email) dataToUpdate.email = email.toLowerCase().trim();
    if (role) dataToUpdate.role = role;
    if (department !== undefined) dataToUpdate.department = department;
    if (jobTitle !== undefined) dataToUpdate.jobTitle = jobTitle;
    if (employmentStatus !== undefined) dataToUpdate.employmentStatus = employmentStatus;
    if (bankName !== undefined) dataToUpdate.bankName = bankName;
    if (bankAccountNumber !== undefined) dataToUpdate.bankAccountNumber = bankAccountNumber;
    if (npwpNumber !== undefined) dataToUpdate.npwpNumber = npwpNumber;
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    // Update Salary Profile if provided
    if (
      basicSalary !== undefined ||
      positionAllowance !== undefined ||
      transportAllowance !== undefined ||
      communicationAllowance !== undefined ||
      latePenaltyRate !== undefined
    ) {
      await prisma.salaryProfile.upsert({
        where: { userId: params.id },
        update: {
          basicSalary: basicSalary !== undefined ? Number(basicSalary) : undefined,
          positionAllowance: positionAllowance !== undefined ? Number(positionAllowance) : undefined,
          transportAllowance: transportAllowance !== undefined ? Number(transportAllowance) : undefined,
          communicationAllowance: communicationAllowance !== undefined ? Number(communicationAllowance) : undefined,
          latePenaltyRate: latePenaltyRate !== undefined ? Number(latePenaltyRate) : undefined,
        },
        create: {
          userId: params.id,
          basicSalary: Number(basicSalary) || 8000000,
          positionAllowance: Number(positionAllowance) || 1500000,
          transportAllowance: Number(transportAllowance) || 1000000,
          communicationAllowance: Number(communicationAllowance) || 300000,
          latePenaltyRate: Number(latePenaltyRate) || 50000,
        },
      });
    }

    const result = await prisma.user.findUnique({
      where: { id: params.id },
      include: { salaryProfile: true },
    });

    return NextResponse.json({ success: true, employee: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    if (user.id === params.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Karyawan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
