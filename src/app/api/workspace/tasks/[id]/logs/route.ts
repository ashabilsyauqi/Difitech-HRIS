export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTaskDiscussionAndLogsTables } from "@/lib/ensure-task-tables";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureTaskDiscussionAndLogsTables();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const logs = await prisma.taskActivityLog.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/workspace/tasks/[id]/logs error:", error);
    return NextResponse.json({ error: "Gagal memuat rekap aktivitas" }, { status: 500 });
  }
}
