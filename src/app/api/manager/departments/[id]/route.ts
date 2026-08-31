export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentDept = await prisma.department.findUnique({
      where: { id: params.id },
    });

    if (!currentDept) {
      return NextResponse.json({ error: "Divisi tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { name, code, description, color } = body;

    const dataToUpdate: any = {};
    if (name && name.trim()) dataToUpdate.name = name.trim();
    if (code !== undefined) dataToUpdate.code = code ? code.trim().toUpperCase() : null;
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (color !== undefined) dataToUpdate.color = color;

    // If name changed, check uniqueness and cascade update users in this department
    if (dataToUpdate.name && dataToUpdate.name !== currentDept.name) {
      const existing = await prisma.department.findUnique({
        where: { name: dataToUpdate.name },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json({ error: "Nama divisi sudah digunakan" }, { status: 400 });
      }

      await prisma.user.updateMany({
        where: { department: currentDept.name },
        data: { department: dataToUpdate.name },
      });
    }

    const updated = await prisma.department.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, department: updated });
  } catch (error: any) {
    console.error("Update department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const currentDept = await prisma.department.findUnique({
      where: { id: params.id },
    });

    if (!currentDept) {
      return NextResponse.json({ error: "Divisi tidak ditemukan" }, { status: 404 });
    }

    // Unassign users in this department
    await prisma.user.updateMany({
      where: { department: currentDept.name },
      data: { department: "Umum / General" },
    });

    await prisma.department.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Divisi berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
