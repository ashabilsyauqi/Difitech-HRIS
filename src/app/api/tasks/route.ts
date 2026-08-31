export const dynamic = "force-dynamic";

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
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userIdFilter = searchParams.get("userId");
    const categoryFilter = searchParams.get("category");
    const statusFilter = searchParams.get("status");
    const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";

    const whereClause: Record<string, any> = {};

    if (!isManagerOrAdmin) {
      whereClause.userId = authUser.userId;
    } else if (userIdFilter && userIdFilter !== "ALL") {
      whereClause.userId = userIdFilter;
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      whereClause.category = categoryFilter;
    }

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (startDate && endDate) {
      whereClause.OR = [
        {
          targetDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { targetDate: null },
            {
              createdAt: {
                gte: new Date(startDate + "T00:00:00.000Z"),
                lte: new Date(endDate + "T23:59:59.999Z"),
              },
            },
          ],
        },
      ];
    } else if (date) {
      whereClause.OR = [
        {
          targetDate: date,
        },
        {
          AND: [
            { targetDate: null },
            {
              createdAt: {
                gte: new Date(date + "T00:00:00.000Z"),
                lte: new Date(date + "T23:59:59.999Z"),
              },
            },
          ],
        },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
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
        attendance: {
          select: {
            id: true,
            date: true,
            clockInTime: true,
            clockOutTime: true,
          },
        },
      },
    });

    const sanitizedTasks = tasks.map((t) => {
      if (t.status === "COMPLETED") {
        return {
          ...t,
          isTracking: false,
          trackingStartedAt: null,
          actualHours: t.actualHours || (t.trackedSeconds ? Number((t.trackedSeconds / 3600).toFixed(2)) : t.estimatedHours),
        };
      }
      return t;
    });

    return NextResponse.json({ tasks: sanitizedTasks });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, priority, estimatedHours } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Find today's attendance session to link if available
    const todayAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: authUser.userId,
          date: todayStr,
        },
      },
    });

    // Get current max order index
    const count = await prisma.task.count({
      where: { userId: authUser.userId },
    });

    const task = await prisma.task.create({
      data: {
        userId: authUser.userId,
        attendanceId: todayAttendance?.id || null,
        targetDate: body.targetDate || todayStr,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "General",
        priority: priority || "MEDIUM",
        status: "PENDING",
        estimatedHours: typeof estimatedHours === "number" ? estimatedHours : 1.0,
        orderIndex: count,
      },
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
        attendance: true,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
