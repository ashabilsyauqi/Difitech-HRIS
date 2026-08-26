import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, action, trackedSeconds } = body;

    if (!taskId || !action) {
      return NextResponse.json({ error: "taskId dan action diperlukan" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    if (
      task.userId !== authUser.userId &&
      authUser.role !== "ADMIN" &&
      authUser.role !== "MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    let updatedTask: any;

    if (action === "START") {
      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          isTracking: true,
          trackingStartedAt: now,
          status: "IN_PROGRESS",
        },
      });
    } else if (action === "PAUSE") {
      const finalSeconds = trackedSeconds !== undefined ? Number(trackedSeconds) : task.trackedSeconds;
      const actualHours = Number((finalSeconds / 3600).toFixed(2));

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          isTracking: false,
          trackingStartedAt: null,
          trackedSeconds: finalSeconds,
          actualHours,
        },
      });
    } else if (action === "STOP" || action === "COMPLETE") {
      const finalSeconds = trackedSeconds !== undefined ? Number(trackedSeconds) : task.trackedSeconds;
      const actualHours = Math.max(0.1, Number((finalSeconds / 3600).toFixed(2)));

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          isTracking: false,
          trackingStartedAt: null,
          trackedSeconds: finalSeconds,
          actualHours,
          status: "COMPLETED",
        },
      });
    } else if (action === "SYNC_SECONDS") {
      const finalSeconds = Number(trackedSeconds) || 0;
      const actualHours = Number((finalSeconds / 3600).toFixed(2));

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          trackedSeconds: finalSeconds,
          actualHours,
        },
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("Task timer API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
