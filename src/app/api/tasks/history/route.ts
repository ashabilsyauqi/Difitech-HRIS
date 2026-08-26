import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userIdFilter = searchParams.get("userId");
    const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";

    const whereClause: any = {};
    if (!isManagerOrAdmin) {
      whereClause.userId = authUser.userId;
    } else if (userIdFilter && userIdFilter !== "ALL") {
      whereClause.userId = userIdFilter;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Group tasks by date
    const dateGroups: Record<string, any> = {};

    for (const t of tasks) {
      const dateKey = t.targetDate || t.createdAt.toISOString().split("T")[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: dateKey,
          tasks: [],
          totalEstimatedHours: 0,
          totalActualHours: 0,
          completedCount: 0,
          pendingCount: 0,
        };
      }

      dateGroups[dateKey].tasks.push(t);
      dateGroups[dateKey].totalEstimatedHours += t.estimatedHours || 0;
      dateGroups[dateKey].totalActualHours += t.actualHours || (t.trackedSeconds ? Number((t.trackedSeconds / 3600).toFixed(1)) : 0);
      if (t.status === "COMPLETED") {
        dateGroups[dateKey].completedCount += 1;
      } else {
        dateGroups[dateKey].pendingCount += 1;
      }
    }

    const history = Object.values(dateGroups).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Task history API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
