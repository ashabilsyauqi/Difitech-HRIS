export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTaskDiscussionAndLogsTables } from "@/lib/ensure-task-tables";
import { buildTaskFollowUpMessage, sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureTaskDiscussionAndLogsTables();

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        creator: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const message = body.message || `Tolong di-update segera ya, status tugas ini belum ada perkembangan terbaru.`;

    // Tentukan penerima follow-up:
    // Jika pengirim adalah pengerja (task.userId), maka follow-up ditujukan ke pemberi tugas (task.creator).
    // Jika pengirim adalah pemberi tugas / pihak lain, maka follow-up ditujukan ke pengerja tugas (task.user).
    const isAssigneeSending = authUser.userId === task.userId;
    const recipient = isAssigneeSending ? (task.creator || task.user) : task.user;
    const recipientId = recipient ? recipient.id : task.userId;

    const followUp = await prisma.taskFollowUp.create({
      data: {
        taskId: task.id,
        senderId: authUser.userId,
        recipientId: recipientId,
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

    // 1. Kirim notifikasi WhatsApp ke penerima jika ada nomor WA
    let waResult = null;
    if (recipient && recipient.id !== authUser.userId) {
      const waMessage = buildTaskFollowUpMessage({
        recipientName: recipient.name,
        senderName: authUser.name,
        senderRoleOrDept: authUser.department || "Kolega",
        taskTitle: task.title,
        department: task.departmentCard,
        brand: task.brandName,
        message,
        taskId: task.id,
      });

      waResult = await sendWhatsAppNotification({
        to: recipient.whatsappNumber,
        message: waMessage,
        recipientName: recipient.name,
        taskId: task.id,
        actionType: "FOLLOW_UP",
      });
    }

    // 2. Catat jejak audit di TaskActivityLog sistem
    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: authUser.userId,
        actionType: "FOLLOW_UP",
        title: "Follow Up Dikirim",
        description: `${authUser.name} (${authUser.department || "Kolega"}) mengirim follow up ke ${recipient?.name || "Pengerja"}: "${message}"`,
        metadata: JSON.stringify({
          followUpId: followUp.id,
          recipientId,
          recipientName: recipient?.name,
          waResult,
        }),
      },
    }).catch((err) => console.error("Failed to write follow-up activity log:", err));

    // 3. Kirim notifikasi in-app
    if (recipientId && recipientId !== authUser.userId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          title: `⚠️ Follow Up: ${task.title}`,
          message: `${authUser.name} (${authUser.department || "Kolega"}) menekan tombol Follow Up: "${message}"`,
          type: "FOLLOW_UP",
          link: isAssigneeSending ? "/dashboard/workspace" : "/dashboard/my-tasks",
          taskId: task.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, followUp, waResult });
  } catch (error) {
    console.error("POST /api/workspace/tasks/[id]/follow-up error:", error);
    return NextResponse.json({ error: "Gagal mengirim follow up" }, { status: 500 });
  }
}
