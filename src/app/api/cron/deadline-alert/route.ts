export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTaskDiscussionAndLogsTables } from "@/lib/ensure-task-tables";
import { buildMorningDeadlineMessage, sendWhatsAppNotification } from "@/lib/whatsapp";

const CRON_SECRET = process.env.CRON_SECRET || "difitech_cron_secret_2026";

async function handleDeadlineAlert(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const secretQuery = searchParams.get("secret");

    const isAuthorized =
      authHeader === `Bearer ${CRON_SECRET}` ||
      secretQuery === CRON_SECRET ||
      process.env.NODE_ENV !== "production";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    await ensureTaskDiscussionAndLogsTables();

    const now = new Date();
    // Rentang H-2: Dari awal hari ini sampai 48 jam ke depan (2 hari penuh)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfH2 = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000);

    // Cari seluruh tugas yang belum selesai dan deadline-nya masuk rentang H-2
    const upcomingTasks = await prisma.task.findMany({
      where: {
        status: {
          notIn: ["COMPLETED"],
        },
        expectedDeadline: {
          gte: startOfToday,
          lte: endOfH2,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            whatsappNumber: true,
            department: true,
          },
        },
      },
      orderBy: {
        expectedDeadline: "asc",
      },
    });

    if (upcomingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada tugas aktif yang mendekati deadline (H-2) saat ini.",
        count: 0,
        remindersSent: 0,
      });
    }

    // Kelompokkan tugas per penerima (userId) agar tidak spam chat per tugas
    const tasksByUser: Record<string, { user: any; tasks: any[] }> = {};
    for (const task of upcomingTasks) {
      if (!task.userId || !task.user) continue;
      if (!tasksByUser[task.userId]) {
        tasksByUser[task.userId] = {
          user: task.user,
          tasks: [],
        };
      }
      tasksByUser[task.userId].tasks.push(task);
    }

    const results: any[] = [];

    for (const [userId, group] of Object.entries(tasksByUser)) {
      const { user, tasks } = group;

      const formattedTasks = tasks.map((t) => {
        const deadline = new Date(t.expectedDeadline);
        const deadlineStr = deadline.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
        let urgencyText = "H-2";
        if (diffHours <= 0) {
          urgencyText = "⚠️ Lewat batas waktu!";
        } else if (diffHours <= 12) {
          urgencyText = "Hari ini!";
        } else if (diffHours <= 24) {
          urgencyText = "Besok (H-1)";
        } else {
          urgencyText = "Lusa (H-2)";
        }

        return {
          title: t.title,
          department: t.departmentCard,
          brand: t.brandName,
          deadlineStr,
          urgencyText,
        };
      });

      const message = buildMorningDeadlineMessage({
        userName: user.name,
        tasks: formattedTasks,
      });

      const waResult = await sendWhatsAppNotification({
        to: user.whatsappNumber,
        message,
        recipientName: user.name,
        actionType: "DEADLINE_REMINDER",
      });

      // Catat log reminder pada setiap task yang masuk rekap
      for (const t of tasks) {
        await prisma.taskActivityLog.create({
          data: {
            taskId: t.id,
            userId: user.id,
            actionType: "DEADLINE_REMINDER",
            title: `Pengingat Deadline Pagi (H-2)`,
            description: `Rangkuman deadline dikirim ke WhatsApp ${user.name} (${waResult.recipientPhone || user.whatsappNumber || "Tanpa nomor"}): Status ${waResult.status}`,
            metadata: JSON.stringify({ waResult }),
          },
        }).catch(() => {});
      }

      results.push({
        userId,
        name: user.name,
        whatsappNumber: user.whatsappNumber,
        taskCount: tasks.length,
        waResult,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalTasksCount: upcomingTasks.length,
      usersNotifiedCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Cron /api/cron/deadline-alert error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses pengingat deadline" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleDeadlineAlert(req);
}

export async function POST(req: NextRequest) {
  return handleDeadlineAlert(req);
}
