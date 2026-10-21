export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const message = body.message || `Tolong di-update segera ya, status tugas ini belum ada perkembangan terbaru.`;

    const followUp = await prisma.taskFollowUp.create({
      data: {
        taskId: task.id,
        senderId: authUser.userId,
        recipientId: task.userId,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            department: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Kirim notifikasi in-app kepada penerima tugas
    if (task.userId !== authUser.userId) {
      await prisma.notification.create({
        data: {
          userId: task.userId,
          title: `⚠️ Follow Up: ${task.title}`,
          message: `${authUser.name} (${authUser.department || "Kolega"}) menekan tombol Follow Up: "${message}"`,
          type: "FOLLOW_UP",
          link: "/dashboard/my-tasks",
          taskId: task.id,
        },
      });
    }

    return NextResponse.json({ success: true, followUp });
  } catch (error) {
    console.error("POST /api/workspace/tasks/[id]/follow-up error:", error);
    return NextResponse.json({ error: "Gagal mengirim follow up" }, { status: 500 });
  }
}
