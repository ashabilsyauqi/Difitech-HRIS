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

    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
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
        replyTo: {
          select: {
            id: true,
            message: true,
            attachmentName: true,
            user: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/workspace/tasks/[id]/comments error:", error);
    return NextResponse.json({ error: "Gagal memuat diskusi" }, { status: 500 });
  }
}

export async function POST(
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
      select: { id: true, title: true, creatorId: true, userId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const {
      message,
      replyToId,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize,
    } = body;

    const trimmedMsg = typeof message === "string" ? message.trim() : "";

    if (!trimmedMsg && !attachmentUrl) {
      return NextResponse.json(
        { error: "Pesan atau lampiran tidak boleh kosong" },
        { status: 400 }
      );
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        userId: authUser.userId,
        message: trimmedMsg,
        replyToId: replyToId || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName ? attachmentName.trim() : null,
        attachmentType: attachmentType || null,
        attachmentSize: typeof attachmentSize === "number" ? attachmentSize : null,
      },
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
        replyTo: {
          select: {
            id: true,
            message: true,
            attachmentName: true,
            user: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
          },
        },
      },
    });

    // Record activity log
    const logDesc = trimmedMsg
      ? trimmedMsg.length > 70
        ? trimmedMsg.substring(0, 70) + "..."
        : trimmedMsg
      : `Mengirim lampiran: ${attachmentName || "File"}`;

    await prisma.taskActivityLog.create({
      data: {
        taskId: params.id,
        userId: authUser.userId,
        actionType: "COMMENT_ADDED",
        title: replyToId ? "Membalas Komentar" : "Komentar Baru",
        description: `${authUser.name}: "${logDesc}"`,
        metadata: JSON.stringify({
          commentId: comment.id,
          hasAttachment: Boolean(attachmentUrl),
          attachmentName: attachmentName || null,
          isReply: Boolean(replyToId),
        }),
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("POST /api/workspace/tasks/[id]/comments error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}
