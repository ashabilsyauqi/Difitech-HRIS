export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only owner or admin/manager can update
    if (
      existingTask.userId !== authUser.userId &&
      authUser.role !== "ADMIN" &&
      authUser.role !== "MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "priority",
      "status",
      "estimatedHours",
      "actualHours",
      "deliverableUrl",
      "completionNote",
      "orderIndex",
      "isTracking",
      "trackedSeconds",
      "trackingStartedAt",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const now = new Date();

    // Auto-stop time tracking if task status changed to COMPLETED or any status other than IN_PROGRESS
    if (updateData.status === "COMPLETED" || (updateData.status && updateData.status !== "IN_PROGRESS")) {
      if (existingTask.isTracking) {
        let finalSeconds = existingTask.trackedSeconds || 0;
        if (existingTask.trackingStartedAt) {
          const elapsed = Math.max(
            0,
            Math.floor((now.getTime() - new Date(existingTask.trackingStartedAt).getTime()) / 1000)
          );
          finalSeconds += elapsed;
        } else if (body.trackedSeconds !== undefined) {
          finalSeconds = Number(body.trackedSeconds);
        }

        updateData.isTracking = false;
        updateData.trackingStartedAt = null;
        updateData.trackedSeconds = finalSeconds;
        if (!updateData.actualHours) {
          updateData.actualHours = Math.max(0.1, Number((finalSeconds / 3600).toFixed(2)));
        }
      } else if (updateData.status === "COMPLETED") {
        updateData.isTracking = false;
        updateData.trackingStartedAt = null;
        if (existingTask.trackedSeconds && !updateData.actualHours) {
          updateData.actualHours = Math.max(0.1, Number((existingTask.trackedSeconds / 3600).toFixed(2)));
        }
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (
      existingTask.userId !== authUser.userId &&
      authUser.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
