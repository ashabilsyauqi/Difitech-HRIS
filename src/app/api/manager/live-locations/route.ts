import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    const attendances = await prisma.attendance.findMany({
      where: { date: todayStr },
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
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return NextResponse.json({
      office,
      attendances,
    });
  } catch (error) {
    console.error("Live locations error:", error);
    return NextResponse.json({ error: "Failed to fetch live locations" }, { status: 500 });
  }
}
