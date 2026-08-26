import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Total Employees
    const totalEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE" },
    });

    // 2. Today's Attendances
    const todayAttendances = await prisma.attendance.findMany({
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
        tasks: true,
      },
    });

    const activeClockedIn = todayAttendances.filter((a) => !a.clockOutTime).length;
    const totalClockedIn = todayAttendances.length;
    const onTimeCount = todayAttendances.filter((a) => a.clockInStatus === "ON_TIME").length;
    const lateCount = todayAttendances.filter((a) => a.clockInStatus === "LATE").length;
    const geofenceViolations = todayAttendances.filter((a) => a.clockInStatus === "OUT_OF_GEOFENCE").length;

    // 3. Task Metrics for Today
    const todayTasks = await prisma.task.findMany({
      where: {
        OR: [
          { attendance: { date: todayStr } },
          { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        ],
      },
    });

    const taskStats = {
      total: todayTasks.length,
      pending: todayTasks.filter((t) => t.status === "PENDING").length,
      inProgress: todayTasks.filter((t) => t.status === "IN_PROGRESS").length,
      completed: todayTasks.filter((t) => t.status === "COMPLETED").length,
      blocked: todayTasks.filter((t) => t.status === "BLOCKED").length,
    };

    // 4. Identify Idle Employees (clocked in > 2 hours ago with 0 IN_PROGRESS or COMPLETED tasks)
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const idleEmployees = todayAttendances
      .filter((a) => {
        if (a.clockOutTime) return false;
        const clockInAge = now - new Date(a.clockInTime).getTime();
        const activeTasks = a.tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "COMPLETED");
        return clockInAge > twoHoursMs && activeTasks.length === 0;
      })
      .map((a) => ({
        id: a.user.id,
        name: a.user.name,
        department: a.user.department,
        clockInTime: a.clockInTime,
      }));

    return NextResponse.json({
      totalEmployees,
      totalClockedIn,
      activeClockedIn,
      onTimeCount,
      lateCount,
      geofenceViolations,
      taskStats,
      idleEmployees,
      todayAttendances,
    });
  } catch (error) {
    console.error("Manager stats error:", error);
    return NextResponse.json({ error: "Failed to fetch manager stats" }, { status: 500 });
  }
}
