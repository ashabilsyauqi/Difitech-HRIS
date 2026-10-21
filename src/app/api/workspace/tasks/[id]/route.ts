export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
      include: {
        user: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
        followUps: {
          include: { sender: { select: { id: true, name: true, department: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" },
        },
        parentTask: true,
        revisionTasks: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/workspace/tasks/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat tugas" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        creator: true,
        user: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();

    // 1. Negosiasi Deadline (Deadline Suggestion dari Penerima Tugas)
    if (body.suggestDeadline) {
      const { suggestedDeadline, reason } = body.suggestDeadline;
      if (!suggestedDeadline) {
        return NextResponse.json({ error: "Tentukan tanggal saran deadline" }, { status: 400 });
      }

      const updated = await prisma.task.update({
        where: { id: params.id },
        data: {
          suggestedDeadline: new Date(suggestedDeadline),
          suggestionReason: reason || null,
          suggestionStatus: "PENDING",
        },
      });

      // Kirim notifikasi ke pembuat tugas
      if (existingTask.creatorId && existingTask.creatorId !== authUser.userId) {
        await prisma.notification.create({
          data: {
            userId: existingTask.creatorId,
            title: `Saran Deadline Baru: ${existingTask.title}`,
            message: `${authUser.name} mengajukan saran deadline baru (${new Date(suggestedDeadline).toLocaleDateString("id-ID")}). Alasan: "${reason || "Tidak ada catatan"}"`,
            type: "DEADLINE_SUGGESTION",
            link: "/dashboard/workspace",
            taskId: existingTask.id,
          },
        });
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // 2. Respon Pembuat Tugas terhadap Deadline Suggestion (Accept / Reject)
    if (body.respondDeadlineSuggestion) {
      const { action } = body.respondDeadlineSuggestion; // 'ACCEPT' | 'REJECT'
      let updatedData: any = {
        suggestionStatus: action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      };

      if (action === "ACCEPT" && existingTask.suggestedDeadline) {
        updatedData.expectedDeadline = existingTask.suggestedDeadline;
      }

      const updated = await prisma.task.update({
        where: { id: params.id },
        data: updatedData,
      });

      // Kirim notifikasi ke penerima tugas
      if (existingTask.userId !== authUser.userId) {
        await prisma.notification.create({
          data: {
            userId: existingTask.userId,
            title: `Saran Deadline ${action === "ACCEPT" ? "Disetujui" : "Ditolak"}: ${existingTask.title}`,
            message: `${authUser.name} telah ${action === "ACCEPT" ? "menyetujui" : "menolak"} usulan deadline untuk tugas ini.`,
            type: "DEADLINE_SUGGESTION",
            link: "/dashboard/my-tasks",
            taskId: existingTask.id,
          },
        });
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // 3. Oper Tugas ke Kanban Content Production (Khusus Tim Sosmed)
    if (body.sendToContentProduction === true) {
      const updated = await prisma.task.update({
        where: { id: params.id },
        data: {
          isContentProduction: true,
          kanbanStage: "CONTENT_BRIEF",
          status: existingTask.status === "PENDING" ? "IN_PROGRESS" : existingTask.status,
        },
      });

      return NextResponse.json({ success: true, task: updated });
    }

    // 4. Update Kanban Stage (di Kanban Content Production)
    if (body.updateKanbanStage) {
      const { stage, deliverableUrl, completionNote } = body.updateKanbanStage;
      const isApproved = stage === "APPROVAL";

      const updated = await prisma.task.update({
        where: { id: params.id },
        data: {
          kanbanStage: stage,
          status: isApproved ? "COMPLETED" : "IN_PROGRESS",
          ...(deliverableUrl ? { deliverableUrl } : {}),
          ...(completionNote ? { completionNote } : {}),
        },
      });

      // Jika stage mencapai APPROVAL -> auto sync deliverable & selesai ke Card Besar asal
      if (isApproved) {
        // Notifikasi ke pembuat tugas asal (misal Tim Ads/Marketing yang request)
        if (existingTask.creatorId && existingTask.creatorId !== authUser.userId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.creatorId,
              title: `Konten Selesai (Approved): ${existingTask.title}`,
              message: `Tim Sosmed telah menyelesaikan produksi konten untuk ${existingTask.brandName || "proyek"}. Hasil akhir otomatis terarsip selesai di Card Besar.`,
              type: "APPROVAL_COMPLETED",
              link: "/dashboard/workspace",
              taskId: existingTask.id,
            },
          });
        }
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // 5. Permintaan Revisi (Revision Loop) oleh Pemohon Tugas (misal Tim Ads)
    if (body.requestRevision) {
      const { note } = body.requestRevision;

      // a. Tandai task lama dengan label request revision, TETAP tercatat Approved/Completed di histori
      await prisma.task.update({
        where: { id: params.id },
        data: {
          revisionTag: `Request Revision by ${authUser.department || authUser.name}`,
          revisionNote: note || null,
        },
      });

      // b. Buat task baru di Kanban Content Production yang terhubung ke parentTaskId
      const revisionTask = await prisma.task.create({
        data: {
          title: `[Revisi] ${existingTask.title}`,
          description: `Catatan Revisi dari ${authUser.name} (${authUser.department || "Pemberi Tugas"}):\n${note || "Tolong revisi sesuai arahan."}\n\nReferensi Asli:\n${existingTask.description || "-"}`,
          departmentCard: existingTask.departmentCard || "SOSMED",
          brandName: existingTask.brandName || "General",
          userId: existingTask.userId, // Dikembalikan ke personel Sosmed yang sama
          creatorId: authUser.userId,
          parentTaskId: existingTask.id,
          revisionTag: `Revisi untuk #${existingTask.id.slice(-5)}`,
          isContentProduction: true,
          kanbanStage: "CONTENT_BRIEF",
          status: "PENDING",
          priority: "HIGH",
        },
      });

      // c. Kirim notifikasi ke tim Sosmed / Assignee
      await prisma.notification.create({
        data: {
          userId: existingTask.userId,
          title: `Permintaan Revisi Konten: ${existingTask.brandName}`,
          message: `${authUser.name} mengajukan revisi untuk "${existingTask.title}". Task baru telah dibuat di Kanban Content Production.`,
          type: "REVISION_REQUESTED",
          link: "/dashboard/content-production",
          taskId: revisionTask.id,
        },
      });

      return NextResponse.json({ success: true, task: revisionTask, originalTaskId: existingTask.id });
    }

    // 6. Update Standar (Status, Title, Description, Deliverable URL, dll.)
    const {
      status,
      title,
      description,
      brandName,
      priority,
      deliverableUrl,
      completionNote,
      estimatedHours,
      actualHours,
    } = body;

    const updatedData: any = {};
    if (status !== undefined) updatedData.status = status;
    if (title !== undefined) updatedData.title = title.trim();
    if (description !== undefined) updatedData.description = description;
    if (brandName !== undefined) updatedData.brandName = brandName.trim();
    if (priority !== undefined) updatedData.priority = priority;
    if (deliverableUrl !== undefined) updatedData.deliverableUrl = deliverableUrl;
    if (completionNote !== undefined) updatedData.completionNote = completionNote;
    if (estimatedHours !== undefined) updatedData.estimatedHours = parseFloat(estimatedHours);
    if (actualHours !== undefined) updatedData.actualHours = parseFloat(actualHours);

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: updatedData,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("PATCH /api/workspace/tasks/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 500 });
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

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";
    const isCreator = task.creatorId === authUser.userId;
    const isAssignee = task.userId === authUser.userId;

    if (!isManagerOrAdmin && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Anda tidak memiliki akses menghapus tugas ini" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspace/tasks/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}
