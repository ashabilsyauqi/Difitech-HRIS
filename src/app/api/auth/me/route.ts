import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        jobTitle: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check today's attendance
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStr,
        },
      },
      include: {
        office: true,
      },
    });

    return NextResponse.json({
      user,
      todayAttendance,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
