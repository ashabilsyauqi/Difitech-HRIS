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
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
          },
        },
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
        assignees: true,
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
      const isApprovalStage = stage === "APPROVAL";
      const isRevisionStage = stage === "REVISION";
      const isSelfAssigned = !existingTask.creatorId || existingTask.creatorId === authUser.userId;

      let nextStatus = existingTask.status;
      let nextReviewStatus = existingTask.reviewStatus;

      if (isApprovalStage) {
        if (isSelfAssigned) {
          nextStatus = "COMPLETED";
          nextReviewStatus = "APPROVED";
        } else {
          nextStatus = "IN_PROGRESS"; // Menunggu review & ACC dari pemberi tugas
          nextReviewStatus = "TO_BE_REVIEWED";
        }
      } else if (isRevisionStage) {
        nextStatus = "IN_PROGRESS";
        nextReviewStatus = "REVISION_REQUESTED";
      }

      const updated = await prisma.task.update({
        where: { id: params.id },
        data: {
          kanbanStage: stage,
          status: nextStatus,
          reviewStatus: nextReviewStatus,
          ...(deliverableUrl ? { deliverableUrl } : {}),
          ...(completionNote ? { completionNote } : {}),
        },
      });

      // Jika stage mencapai APPROVAL -> kirim notifikasi ke pembuat tugas asal
      if (isApprovalStage) {
        if (existingTask.creatorId && existingTask.creatorId !== authUser.userId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.creatorId,
              title: `Hasil Konten Siap Direview: ${existingTask.title}`,
              message: `${authUser.name} telah menyelesaikan produksi konten untuk [${existingTask.departmentCard || "Sosmed"} - ${existingTask.brandName || "Proyek"}]. Harap review hasil kerja (Pilih Revisi atau ACC / Selesai).`,
              type: "TO_BE_REVIEWED",
              link: "/dashboard/workspace",
              taskId: existingTask.id,
            },
          });
        }
      }

      return NextResponse.json({ success: true, task: updated });
    }

    // 5. Submit Hasil Tugas (Deliverable) oleh Pengerja -> Masuk tahap Review jika ada Pemberi Tugas
    if (body.submitDeliverable) {
      const { deliverableUrl, completionNote } = body.submitDeliverable;
      const isSelfAssigned = !existingTask.creatorId || existingTask.creatorId === authUser.userId;

      if (isSelfAssigned) {
        // Tugas inisiatif pribadi yang dibuat untuk diri sendiri -> langsung COMPLETED (Done !)
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            reviewStatus: "APPROVED",
            deliverableUrl: deliverableUrl || null,
            completionNote: completionNote || null,
            revisionTag: null,
            reviewedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, task: updated });
      } else {
        // Ditugaskan oleh rekan/pemberi tugas -> masuk status TO_BE_REVIEWED!
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "IN_PROGRESS", // tetap aktif dalam proses review
            reviewStatus: "TO_BE_REVIEWED",
            deliverableUrl: deliverableUrl || null,
            completionNote: completionNote || null,
            revisionTag: null,
          },
        });

        // Kirim notifikasi ke Pemberi Tugas (Creator)
        if (existingTask.creatorId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.creatorId,
              title: `Hasil Tugas Siap Direview: ${existingTask.title}`,
              message: `${authUser.name} telah menyerahkan hasil kerja untuk [${existingTask.departmentCard || "Tugas"} - ${existingTask.brandName || "General"}]. Harap review hasil kerja (Pilih Revision atau Done !).`,
              type: "TO_BE_REVIEWED",
              link: "/dashboard/workspace",
              taskId: existingTask.id,
            },
          });
        }

        return NextResponse.json({ success: true, task: updated });
      }
    }

    // 6. Review Action oleh Pemberi Tugas (APPROVE = "Done !" atau REVISION = "Minta Revisi")
    if (body.reviewAction) {
      const { action, revisionNote } = body.reviewAction; // 'START_REVIEW' | 'APPROVE' | 'REVISION'
      const isCreator = existingTask.creatorId === authUser.userId;
      const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";

      if (!isCreator && !isManagerOrAdmin) {
        return NextResponse.json(
          { error: "Hanya pemberi tugas atau manager yang berhak mereview dan menyetujui tugas ini" },
          { status: 403 }
        );
      }

      if (action === "START_REVIEW") {
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            reviewStatus: "UNDER_REVIEW",
          },
        });

        if (existingTask.userId !== authUser.userId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.userId,
              title: `Tugas Sedang Di-review: ${existingTask.title}`,
              message: `${authUser.name} (Pemberi Tugas) sedang mereview hasil kerja Anda.`,
              type: "UNDER_REVIEW",
              link: "/dashboard/tasks",
              taskId: existingTask.id,
            },
          });
        }

        return NextResponse.json({ success: true, task: updated });
      }

      if (action === "APPROVE") {
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            reviewStatus: "APPROVED",
            revisionTag: null,
            reviewedAt: new Date(),
          },
        });

        // Kirim notifikasi ke Pengerja (Assignee) bahwa tugas resmi Done !
        if (existingTask.userId !== authUser.userId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.userId,
              title: `Tugas Disetujui (Done !): ${existingTask.title}`,
              message: `Selamat! ${authUser.name} (Pemberi Tugas) telah menyetujui hasil kerja Anda. Tugas resmi ditandai selesai (Done !) di lembar kerja Anda.`,
              type: "TASK_APPROVED",
              link: "/dashboard/my-tasks",
              taskId: existingTask.id,
            },
          });
        }

        return NextResponse.json({ success: true, task: updated });
      } else if (action === "REVISION") {
        if (!revisionNote || !revisionNote.trim()) {
          return NextResponse.json({ error: "Catatan revisi wajib diisi" }, { status: 400 });
        }

        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "IN_PROGRESS",
            reviewStatus: "REVISION_REQUESTED",
            revisionTag: "Perlu Revisi",
            revisionNote: revisionNote.trim(),
            reviewedAt: new Date(),
          },
        });

        // Kirim notifikasi ke Pengerja (Assignee) tentang catatan revisi
        if (existingTask.userId !== authUser.userId) {
          await prisma.notification.create({
            data: {
              userId: existingTask.userId,
              title: `Catatan Revisi dari ${authUser.name}: ${existingTask.title}`,
              message: `Pemberi tugas meminta revisi: "${revisionNote.trim()}". Harap perbaiki dan submit kembali hasil tugas Anda.`,
              type: "TASK_REVISION",
              link: "/dashboard/my-tasks",
              taskId: existingTask.id,
            },
          });
        }

        return NextResponse.json({ success: true, task: updated });
      }
    }

    // 7. Permintaan Revisi (Revision Loop lama untuk Tim Ads/Sosmed jika dipakai)
    if (body.requestRevision) {
      const { note } = body.requestRevision;

      // a. Tandai task lama dengan label request revision, TETAP tercatat Approved/Completed di histori
      await prisma.task.update({
        where: { id: params.id },
        data: {
          revisionTag: `Request Revision by ${authUser.department || authUser.name}`,
          revisionNote: note || null,
          reviewStatus: "REVISION_REQUESTED",
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

    // 8. Update Standar (Status, Title, Description, Deliverable URL, dll.)
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
    if (status !== undefined) {
      // Jika mencoba set COMPLETED padahal ditugaskan oleh orang lain dan belum di-approve
      if (status === "COMPLETED" && existingTask.creatorId && existingTask.creatorId !== authUser.userId && existingTask.reviewStatus !== "APPROVED") {
        const isCreator = existingTask.creatorId === authUser.userId;
        const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";
        if (isCreator || isManagerOrAdmin) {
          updatedData.status = "COMPLETED";
          updatedData.reviewStatus = "APPROVED";
          updatedData.reviewedAt = new Date();
        } else {
          // Assignee trying to complete -> masuk TO_BE_REVIEWED
          updatedData.status = "IN_PROGRESS";
          updatedData.reviewStatus = "TO_BE_REVIEWED";
        }
      } else {
        updatedData.status = status;
      }
    }
    if (title !== undefined) updatedData.title = title.trim();
    if (description !== undefined) updatedData.description = description;
    if (brandName !== undefined) updatedData.brandName = brandName.trim();
    if (priority !== undefined) updatedData.priority = priority;
    if (deliverableUrl !== undefined) updatedData.deliverableUrl = deliverableUrl;
    if (completionNote !== undefined) updatedData.completionNote = completionNote;
    if (estimatedHours !== undefined) updatedData.estimatedHours = parseFloat(estimatedHours);
    if (actualHours !== undefined) updatedData.actualHours = parseFloat(actualHours);

    if (Array.isArray(body.assigneeIds) && body.assigneeIds.length > 0) {
      const validIds: string[] = Array.from(new Set(body.assigneeIds.filter(Boolean)));
      if (validIds.length > 0) {
        updatedData.userId = validIds[0];
        await prisma.taskAssignee.deleteMany({ where: { taskId: params.id } });
        await prisma.taskAssignee.createMany({
          data: validIds.map((uid, index) => ({
            taskId: params.id,
            userId: uid,
            role: index === 0 ? "PIC" : "MEMBER",
          })),
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: updatedData,
      include: {
        user: { select: { id: true, name: true, department: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, department: true, avatarUrl: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, department: true, avatarUrl: true } },
          },
        },
      },
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
