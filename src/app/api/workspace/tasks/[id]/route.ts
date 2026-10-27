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

function triggerHrisRealtimeSync(userEmail: string, task: any) {
  const stagingHrisUrl = process.env.STAGING_HRIS_INTERNAL_URL || "http://187.52.127.244:3010";
  const syncSecret = process.env.INTERNAL_SYNC_SECRET || "difitech_secure_workboard_sync_secret_2026";

  fetch(`${stagingHrisUrl}/api/tasks/sync-workboard?email=${encodeURIComponent(userEmail)}&secret=${syncSecret}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": syncSecret,
    },
    body: JSON.stringify({
      workboardTaskId: task.id,
      email: userEmail,
      kanbanStage: task.kanbanStage,
      status: task.status,
    }),
  }).catch((err: any) => {
    console.warn("[DWB -> Staging HRIS Realtime Sync] Webhook failed:", err?.message);
  });
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

    await ensureTaskDiscussionAndLogsTables();

    // 1. Konsolidasi & Negosiasi Deadline Dua Arah (Bilateral Deadline Negotiation)
    if (body.consolidateDeadline || body.suggestDeadline || body.respondDeadlineSuggestion) {
      const isCreator = existingTask.creatorId === authUser.userId;
      const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";
      const isAssignee = existingTask.userId === authUser.userId || existingTask.assignees?.some((a) => a.userId === authUser.userId);

      // Normalisasi request (mendukung format baru consolidateDeadline maupun format lama)
      let action: "ACCEPT" | "PROPOSE" | "COUNTER_PROPOSE" = "PROPOSE";
      let proposedDeadline: string | undefined = undefined;
      let reason: string | undefined = undefined;

      if (body.consolidateDeadline) {
        action = body.consolidateDeadline.action;
        proposedDeadline = body.consolidateDeadline.proposedDeadline;
        reason = body.consolidateDeadline.reason;
      } else if (body.suggestDeadline) {
        action = existingTask.suggestedDeadline ? "COUNTER_PROPOSE" : "PROPOSE";
        proposedDeadline = body.suggestDeadline.suggestedDeadline;
        reason = body.suggestDeadline.reason;
      } else if (body.respondDeadlineSuggestion) {
        action = body.respondDeadlineSuggestion.action === "ACCEPT" ? "ACCEPT" : "COUNTER_PROPOSE";
        proposedDeadline = body.respondDeadlineSuggestion.counterDeadline;
        reason = body.respondDeadlineSuggestion.reason;
      }

      // AKSI 1: ACC / SETUJUI DEADLINE INI
      if (action === "ACCEPT") {
        const finalAgreedDeadline = existingTask.suggestedDeadline || existingTask.expectedDeadline;
        if (!finalAgreedDeadline) {
          return NextResponse.json({ error: "Tidak ada tanggal deadline untuk disepakati" }, { status: 400 });
        }

        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            expectedDeadline: finalAgreedDeadline,
            suggestedDeadline: finalAgreedDeadline,
            suggestionStatus: "AGREED",
            suggestionReason: reason || existingTask.suggestionReason || "Disepakati bersama",
          },
          include: {
            user: { select: { id: true, name: true, department: true, avatarUrl: true } },
            creator: { select: { id: true, name: true, department: true, avatarUrl: true } },
            assignees: { include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } } },
          },
        });

        const formattedDate = new Date(finalAgreedDeadline).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Rekam log aktivitas: Deadline Disepakati (ACC)
        await prisma.taskActivityLog.create({
          data: {
            taskId: params.id,
            userId: authUser.userId,
            actionType: "DEADLINE_AGREED",
            title: "Deadline Disepakati (ACC)",
            description: `${authUser.name} (${authUser.department || (isCreator ? "Pembuat" : "Pengerja")}) menyetujui target deadline: ${formattedDate}. Status: Disepakati & Terkunci.`,
            toValue: new Date(finalAgreedDeadline).toISOString(),
            metadata: JSON.stringify({ agreedDeadline: finalAgreedDeadline, acceptedBy: authUser.userId }),
          },
        });

        // Kirim notifikasi ke pihak lawan
        const notifyTargetUserIds = isAssignee
          ? [existingTask.creatorId].filter(Boolean)
          : [existingTask.userId, ...(existingTask.assignees?.map((a) => a.userId) || [])].filter((uid) => uid && uid !== authUser.userId);

        for (const targetUid of notifyTargetUserIds) {
          if (targetUid && targetUid !== authUser.userId) {
            await prisma.notification.create({
              data: {
                userId: targetUid,
                title: `Deadline Disepakati (ACC): ${existingTask.title}`,
                message: `${authUser.name} telah menyetujui target deadline: ${formattedDate}. Deadline kini resmi terkunci.`,
                type: "DEADLINE_AGREED",
                link: "/dashboard/workspace",
                taskId: existingTask.id,
              },
            });
          }
        }

        return NextResponse.json({ success: true, task: updated });
      }

      // AKSI 2: AJUKAN USULAN / TANDINGAN DEADLINE
      if (action === "PROPOSE" || action === "COUNTER_PROPOSE") {
        if (!proposedDeadline) {
          return NextResponse.json({ error: "Tentukan tanggal & jam deadline yang diajukan" }, { status: 400 });
        }

        const isSelfAssigned = !existingTask.creatorId || (existingTask.creatorId === authUser.userId && existingTask.userId === authUser.userId);

        if (isSelfAssigned) {
          // Tugas mandiri / pribadi: langsung simpan target batas waktu tanpa negosiasi bilateral
          const updated = await prisma.task.update({
            where: { id: params.id },
            data: {
              expectedDeadline: new Date(proposedDeadline),
              suggestedDeadline: new Date(proposedDeadline),
              suggestionStatus: "AGREED",
              suggestionReason: reason ? reason.trim() : null,
            },
            include: {
              user: { select: { id: true, name: true, department: true, avatarUrl: true } },
              creator: { select: { id: true, name: true, department: true, avatarUrl: true } },
              assignees: { include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } } },
            },
          });

          await prisma.taskActivityLog.create({
            data: {
              taskId: params.id,
              userId: authUser.userId,
              actionType: "DEADLINE_CHANGE",
              title: "Target Waktu Mandiri Diperbarui",
              description: `${authUser.name} memperbarui target batas waktu tugas mandiri ke: ${new Date(proposedDeadline).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`,
              toValue: new Date(proposedDeadline).toISOString(),
            },
          });

          return NextResponse.json({ success: true, task: updated });
        }

        // Tentukan giliran konfirmasi berikutnya untuk tugas delegasi antar tim
        const nextStatus = isCreator || isManagerOrAdmin
          ? "WAITING_ASSIGNEE_CONFIRMATION"
          : "WAITING_CREATOR_CONFIRMATION";

        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            suggestedDeadline: new Date(proposedDeadline),
            suggestionReason: reason ? reason.trim() : null,
            suggestionStatus: nextStatus,
          },
          include: {
            user: { select: { id: true, name: true, department: true, avatarUrl: true } },
            creator: { select: { id: true, name: true, department: true, avatarUrl: true } },
            assignees: { include: { user: { select: { id: true, name: true, department: true, avatarUrl: true } } } },
          },
        });

        const formattedDate = new Date(proposedDeadline).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const isCounter = action === "COUNTER_PROPOSE" || Boolean(existingTask.suggestedDeadline);

        // Rekam log aktivitas konsolidasi deadline
        await prisma.taskActivityLog.create({
          data: {
            taskId: params.id,
            userId: authUser.userId,
            actionType: "DEADLINE_CONSOLIDATION",
            title: isCounter ? "Tandingan Deadline Diajukan" : "Usulan Deadline Diajukan",
            description: `${authUser.name} (${authUser.department || (isCreator ? "Pembuat" : "Pengerja")}) mengajukan ${isCounter ? "tandingan" : "usulan"} deadline ke: ${formattedDate}${reason ? `. Catatan: "${reason.trim()}"` : ""}.`,
            fromValue: existingTask.expectedDeadline ? new Date(existingTask.expectedDeadline).toISOString() : null,
            toValue: new Date(proposedDeadline).toISOString(),
            metadata: JSON.stringify({
              proposedDeadline,
              reason: reason ? reason.trim() : null,
              proposerId: authUser.userId,
              status: nextStatus,
            }),
          },
        });

        // Kirim notifikasi ke pihak lawan
        const notifyTargetUserIds = (isCreator || isManagerOrAdmin)
          ? [existingTask.userId, ...(existingTask.assignees?.map((a) => a.userId) || [])].filter((uid) => uid && uid !== authUser.userId)
          : [existingTask.creatorId].filter(Boolean);

        for (const targetUid of notifyTargetUserIds) {
          if (targetUid && targetUid !== authUser.userId) {
            await prisma.notification.create({
              data: {
                userId: targetUid,
                title: `${isCounter ? "Tandingan" : "Usulan"} Deadline: ${existingTask.title}`,
                message: `${authUser.name} mengajukan ${isCounter ? "tandingan" : "usulan"} deadline baru (${formattedDate})${reason ? `. Catatan: "${reason.trim()}"` : ""}. Harap tinjau untuk ACC atau ajukan tandingan kembali.`,
                type: "DEADLINE_CONSOLIDATION",
                link: "/dashboard/workspace",
                taskId: existingTask.id,
              },
            });
          }
        }

        return NextResponse.json({ success: true, task: updated });
      }

      return NextResponse.json({ error: "Aksi konsolidasi tidak valid" }, { status: 400 });
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
      const { stage, deliverableUrl, deliverableAttachment, completionNote } = body.updateKanbanStage;
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
      } else {
        if (nextStatus === "REQUESTED" || nextStatus === "PENDING") {
          nextStatus = "IN_PROGRESS";
        }
        if (nextReviewStatus === "REVISION_REQUESTED") {
          nextReviewStatus = "NONE";
        }
      }

      const updated = await prisma.task.update({
        where: { id: params.id },
        data: {
          kanbanStage: stage,
          status: nextStatus,
          reviewStatus: nextReviewStatus,
          ...(deliverableUrl !== undefined ? { deliverableUrl: deliverableUrl || null } : {}),
          ...(deliverableAttachment !== undefined ? { deliverableAttachment: deliverableAttachment || null } : {}),
          ...(completionNote !== undefined ? { completionNote: completionNote || null } : {}),
        },
      });

      await prisma.taskActivityLog.create({
        data: {
          taskId: params.id,
          userId: authUser.userId,
          actionType: "STAGE_CHANGE",
          title: "Perpindahan Stage",
          description: `${authUser.name} memindahkan stage ke "${stage}"`,
          fromValue: existingTask.kanbanStage || "NONE",
          toValue: stage,
        },
      }).catch(() => {});

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
      const { deliverableUrl, deliverableAttachment, completionNote } = body.submitDeliverable;
      const isSelfAssigned = !existingTask.creatorId || existingTask.creatorId === authUser.userId;

      // Pastikan ada salah satu bukti (Link atau Screenshot)
      if (!deliverableUrl && !deliverableAttachment) {
        return NextResponse.json(
          { error: "Harap lampirkan minimal 1 Screenshot bukti pengerjaan atau Tautan Link!" },
          { status: 400 }
        );
      }

      // Log activity
      await prisma.taskActivityLog.create({
        data: {
          taskId: params.id,
          userId: authUser.userId,
          actionType: "SUBMIT_DELIVERABLE",
          title: "Penyerahan Hasil Kerja",
          description: `${authUser.name} menyerahkan hasil kerja${completionNote ? `: "${completionNote}"` : ""}`,
          metadata: JSON.stringify({
            deliverableUrl: deliverableUrl || null,
            hasDeliverableAttachment: Boolean(deliverableAttachment),
          }),
        },
      });

      if (isSelfAssigned) {
        // Tugas inisiatif pribadi yang dibuat untuk diri sendiri -> langsung COMPLETED (Done !)
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "COMPLETED",
            reviewStatus: "APPROVED",
            kanbanStage: "DONE",
            deliverableUrl: deliverableUrl || null,
            deliverableAttachment: deliverableAttachment || null,
            completionNote: completionNote || null,
            revisionTag: null,
            reviewedAt: new Date(),
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (updated.user?.email) triggerHrisRealtimeSync(updated.user.email, updated);
        return NextResponse.json({ success: true, task: updated });
      } else {
        // Ditugaskan oleh rekan/pemberi tugas -> masuk status TO_BE_REVIEWED!
        const updated = await prisma.task.update({
          where: { id: params.id },
          data: {
            status: "IN_PROGRESS", // tetap aktif dalam proses review
            reviewStatus: "TO_BE_REVIEWED",
            kanbanStage: "SUBMIT_TO_REVIEW",
            deliverableUrl: deliverableUrl || null,
            deliverableAttachment: deliverableAttachment || null,
            completionNote: completionNote || null,
            revisionTag: null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (updated.user?.email) triggerHrisRealtimeSync(updated.user.email, updated);

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

        await prisma.taskActivityLog.create({
          data: {
            taskId: params.id,
            userId: authUser.userId,
            actionType: "STAGE_CHANGE",
            title: "Mulai Review",
            description: `${authUser.name} mulai memeriksa/mereview hasil kerja tugas ini`,
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
            kanbanStage: "DONE",
            revisionTag: null,
            reviewedAt: new Date(),
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        await prisma.taskActivityLog.create({
          data: {
            taskId: params.id,
            userId: authUser.userId,
            actionType: "APPROVE_TASK",
            title: "Tugas Disetujui (Done !)",
            description: `${authUser.name} menyetujui hasil kerja. Tugas resmi selesai (Done !)`,
            toValue: "DONE",
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

        // Trigger realtime sync to Staging HRIS
        if (updated.user?.email) {
          triggerHrisRealtimeSync(updated.user.email, updated);
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
            kanbanStage: "REVISION",
            revisionTag: "Perlu Revisi",
            revisionNote: revisionNote.trim(),
            reviewedAt: new Date(),
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        await prisma.taskActivityLog.create({
          data: {
            taskId: params.id,
            userId: authUser.userId,
            actionType: "REQUEST_REVISION",
            title: "Permintaan Revisi",
            description: `${authUser.name} meminta revisi: "${revisionNote.trim()}"`,
            toValue: "REVISION",
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

        // Trigger realtime sync to Staging HRIS
        if (updated.user?.email) {
          triggerHrisRealtimeSync(updated.user.email, updated);
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
      kanbanStage,
    } = body;

    const updatedData: any = {};
    if (kanbanStage !== undefined) {
      updatedData.kanbanStage = kanbanStage;
      if (kanbanStage === "USER_REQUESTED") {
        updatedData.status = "REQUESTED";
        updatedData.reviewStatus = "NONE";
      } else if (kanbanStage === "NOT_STARTED") {
        updatedData.status = "PENDING";
        updatedData.reviewStatus = "NONE";
      } else if (kanbanStage === "ON_PROGRESS") {
        updatedData.status = "IN_PROGRESS";
        updatedData.reviewStatus = "NONE";
      } else if (kanbanStage === "DONE") {
        const isCreator = !existingTask.creatorId || existingTask.creatorId === authUser.userId;
        const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";
        if (isCreator || isManagerOrAdmin) {
          updatedData.status = "COMPLETED";
          updatedData.reviewStatus = "APPROVED";
          updatedData.reviewedAt = new Date();
        } else {
          updatedData.status = "IN_PROGRESS";
          updatedData.reviewStatus = "TO_BE_REVIEWED";
        }
      } else if (kanbanStage === "SUBMIT_TO_REVIEW") {
        updatedData.status = "IN_PROGRESS";
        updatedData.reviewStatus = "TO_BE_REVIEWED";
      } else if (kanbanStage === "REVISION") {
        updatedData.status = "IN_PROGRESS";
        updatedData.reviewStatus = "REVISION_REQUESTED";
      } else {
        if (existingTask.status === "PENDING") {
          updatedData.status = "IN_PROGRESS";
        }
      }
    }

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
        user: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true, avatarUrl: true } },
          },
        },
      },
    });

    // Record stage or status change in activity log if changed
    if (kanbanStage !== undefined && kanbanStage !== existingTask.kanbanStage) {
      await prisma.taskActivityLog.create({
        data: {
          taskId: params.id,
          userId: authUser.userId,
          actionType: "STAGE_CHANGE",
          title: "Perpindahan Stage",
          description: `${authUser.name} memindahkan stage ke "${kanbanStage}"`,
          fromValue: existingTask.kanbanStage || "NOT_STARTED",
          toValue: kanbanStage,
        },
      });
    } else if (
      status !== undefined &&
      status !== existingTask.status &&
      !body.reviewAction &&
      !body.submitDeliverable
    ) {
      await prisma.taskActivityLog.create({
        data: {
          taskId: params.id,
          userId: authUser.userId,
          actionType: "STATUS_CHANGE",
          title: "Perubahan Status",
          description: `${authUser.name} mengubah status tugas menjadi "${status}"`,
          fromValue: existingTask.status,
          toValue: status,
        },
      });
    }

    // Realtime stage sync webhook to Staging HRIS
    if (kanbanStage !== undefined || status !== undefined || body.reviewAction || body.submitDeliverable) {
      const targetUserEmail = updated.user?.email || authUser.email;
      const stagingHrisUrl = process.env.STAGING_HRIS_INTERNAL_URL || "http://187.52.127.244:3010";
      const syncSecret = process.env.INTERNAL_SYNC_SECRET || "difitech_secure_workboard_sync_secret_2026";

      // Fire-and-forget background webhook
      fetch(`${stagingHrisUrl}/api/tasks/sync-workboard?email=${encodeURIComponent(targetUserEmail)}&secret=${syncSecret}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": syncSecret,
        },
        body: JSON.stringify({
          workboardTaskId: updated.id,
          email: targetUserEmail,
          kanbanStage: updated.kanbanStage,
          status: updated.status,
        }),
      }).catch((err: any) => {
        console.warn("[DWB -> Staging HRIS Realtime Sync] Webhook failed:", err?.message);
      });
    }

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
