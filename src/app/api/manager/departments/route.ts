export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    // Count employees per department
    const users = await prisma.user.findMany({
      select: { department: true, role: true, employmentStatus: true },
    });

    const counts: Record<string, number> = {};
    users.forEach((u) => {
      if (u.department) {
        counts[u.department] = (counts[u.department] || 0) + 1;
      }
    });

    const enriched = departments.map((d) => ({
      ...d,
      employeeCount: counts[d.name] || 0,
    }));

    return NextResponse.json({ departments: enriched });
  } catch (error: any) {
    console.error("Fetch departments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden: Admin or Manager only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama divisi wajib diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const existing = await prisma.department.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return NextResponse.json({ error: "Divisi dengan nama tersebut sudah ada" }, { status: 400 });
    }

    const created = await prisma.department.create({
      data: {
        name: trimmedName,
        code: code ? code.trim().toUpperCase() : undefined,
        description: description ? description.trim() : undefined,
        color: color || "#dc2626",
      },
    });

    return NextResponse.json({ success: true, department: created }, { status: 201 });
  } catch (error: any) {
    console.error("Create department error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
