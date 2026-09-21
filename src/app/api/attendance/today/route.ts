export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFeatureFlags } from "@/lib/feature-flags";
import { getWIBDateString } from "@/lib/geofence";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flags = getFeatureFlags();
    const todayStr = getWIBDateString();
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
      include: {
        office: true,
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Also fetch all user tasks to guarantee 100% synchronization with the Kanban board
    const allUserTasks = await prisma.task.findMany({
      where: {
        userId: authUser.userId,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
    });

    const office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({
      todayAttendance: attendance,
      tasks: allUserTasks,
      office,
      features: {
        allowRetakeClockInPhoto: flags.allowRetakeClockInPhoto,
      },
    });
  } catch (error) {
    console.error("Today attendance fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
