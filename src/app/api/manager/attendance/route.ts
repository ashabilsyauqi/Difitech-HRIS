import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const whereClause: Record<string, unknown> = {};

    if (date) {
      whereClause.date = date;
    }

    if (status) {
      whereClause.clockInStatus = status;
    }

    if (department) {
      whereClause.user = {
        department: department,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: [{ date: "desc" }, { clockInTime: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
        office: true,
        tasks: true,
      },
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error("Manager attendance logs error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance logs" }, { status: 500 });
  }
}
