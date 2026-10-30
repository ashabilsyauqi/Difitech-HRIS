export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTaskDiscussionAndLogsTables } from "@/lib/ensure-task-tables";
import { isExecutiveBoard, canAccessBoard, EXECUTIVE_BOARDS } from "@/lib/executive-boards";
import { buildTaskAssignedMessage, sendWhatsAppNotification } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentCard = searchParams.get("departmentCard");
    const brandName = searchParams.get("brandName");
    const myTasksTab = searchParams.get("myTasksTab"); // INBOX | IN_PROGRESS | COMPLETED | ALL
    const myTasks = searchParams.get("myTasks");
    const viewScope = searchParams.get("viewScope"); // MINE | DELEGATED | ALL
    const isContentProduction = searchParams.get("isContentProduction");
    const kanbanStage = searchParams.get("kanbanStage");
    const search = searchParams.get("search");

    const whereClause: any = {};

    // 1. Filter Corong & BigBoard (Personal vs Delegated vs Division)
    if (viewScope === "DELEGATED") {
      whereClause.creatorId = authUser.userId;
      whereClause.NOT = {
        userId: authUser.userId,
      };
    } else if (viewScope === "MINE" || myTasks === "true" || myTasksTab === "ALL") {
      whereClause.OR = [
        { userId: authUser.userId },
        { assignees: { some: { userId: authUser.userId } } },
      ];
    } else if (myTasksTab) {
      whereClause.OR = [
        { userId: authUser.userId },
        { assignees: { some: { userId: authUser.userId } } },
      ];
      if (myTasksTab === "INBOX") {
        whereClause.status = { in: ["PENDING", "REQUESTED"] };
      } else if (myTasksTab === "IN_PROGRESS") {
        whereClause.status = "IN_PROGRESS";
      } else if (myTasksTab === "COMPLETED") {
        whereClause.status = "COMPLETED";
      }
    }

    // 2. Filter Card Divisi & Proteksi Board Eksekutif (CEO, HR, DM Executive)
    if (departmentCard && departmentCard !== "ALL") {
      const normalizedDept = departmentCard.toUpperCase();
      if (isExecutiveBoard(normalizedDept)) {
        if (!canAccessBoard(normalizedDept, authUser)) {
          return NextResponse.json({
            tasks: [],
            counts: { inbox: 0, inProgress: 0, completed: 0, pendingReview: 0, delegated: 0 },
          });
        }
      }
      whereClause.departmentCard = normalizedDept;
    } else {
      // BigBoard Difitech ("WB all div"): Tugas eksekutif TIDAK DIGABUNG ke WB all div!
      const isPersonalScope = viewScope === "MINE" || viewScope === "DELEGATED" || Boolean(myTasks) || Boolean(myTasksTab);
      if (!isPersonalScope) {
        whereClause.departmentCard = { notIn: Array.from(EXECUTIVE_BOARDS) };
      }
    }

    // 3. Filter Brand
    if (brandName && brandName !== "ALL") {
      whereClause.brandName = brandName;
    }

    // 4. Filter Kanban Content Production (Sosmed)
    if (isContentProduction !== null && isContentProduction !== undefined && isContentProduction !== "") {
      whereClause.isContentProduction = isContentProduction === "true";
    }

    // 5. Filter Stage
    if (kanbanStage && kanbanStage !== "ALL") {
      whereClause.kanbanStage = kanbanStage;
    }

    // 6. Search Query
    if (search && search.trim() !== "") {
      const q = search.trim();
      const searchConditions = [
        { title: { contains: q } },
        { description: { contains: q } },
        { brandName: { contains: q } },
      ];

      if (whereClause.OR) {
        // Gabungkan existing personal OR dengan search condition
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions },
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        creatorId: true,
        attendanceId: true,
        departmentCard: true,
        brandName: true,
        expectedDeadline: true,
        suggestedDeadline: true,
        suggestionReason: true,
        suggestionStatus: true,
        isContentProduction: true,
        kanbanStage: true,
        kanbanOrder: true,
        parentTaskId: true,
        revisionTag: true,
        revisionNote: true,
        reviewStatus: true,
        reviewedAt: true,
        targetDate: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        estimatedHours: true,
        actualHours: true,
        deliverableUrl: true,
        completionNote: true,
        isTracking: true,
        trackingStartedAt: true,
        trackedSeconds: true,
        orderIndex: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                jobTitle: true,
                avatarUrl: true,
              },
            },
          },
        },
        followUps: {
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
          orderBy: { createdAt: "desc" },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            revisionTag: true,
            kanbanStage: true,
            status: true,
          },
        },
        revisionTasks: {
          select: {
            id: true,
            title: true,
            revisionTag: true,
            kanbanStage: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { kanbanOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    // Hitung counter untuk Personal BigBoard
    const personalFilter = {
      OR: [
        { userId: authUser.userId },
        { assignees: { some: { userId: authUser.userId } } },
      ],
    };

    const [inboxCount, inProgressCount, completedCount, pendingReviewCount, delegatedCount] = await Promise.all([
      prisma.task.count({ where: { ...personalFilter, status: { in: ["PENDING", "REQUESTED"] } } }),
      prisma.task.count({ where: { ...personalFilter, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...personalFilter, status: "COMPLETED" } }),
      prisma.task.count({ where: { creatorId: authUser.userId, reviewStatus: "TO_BE_REVIEWED" } }),
      prisma.task.count({
        where: {
          creatorId: authUser.userId,
          NOT: { userId: authUser.userId },
          status: { not: "COMPLETED" },
        },
      }),
    ]);

    return NextResponse.json({
      tasks,
      counts: {
        inbox: inboxCount,
        inProgress: inProgressCount,
        completed: completedCount,
        pendingReview: pendingReviewCount,
        delegated: delegatedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/workspace/tasks error:", error);
    return NextResponse.json({ error: "Gagal mengambil data tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      departmentCard,
      brandName,
      assigneeId,
      assigneeIds,
      expectedDeadline,
      priority,
      estimatedHours,
      isContentProduction,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }
    if (!departmentCard) {
      return NextResponse.json({ error: "Pilih Card Divisi tujuan tugas" }, { status: 400 });
    }
    if (!brandName || !brandName.trim()) {
      return NextResponse.json({ error: "Nama Brand wajib diisi" }, { status: 400 });
    }

    // Kumpulkan target assignees (support single atau multi-assignee)
    let finalAssigneeIds: string[] = [];
    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      finalAssigneeIds = Array.from(new Set(assigneeIds.filter(Boolean)));
    } else if (assigneeId) {
      finalAssigneeIds = [assigneeId];
    }

    if (finalAssigneeIds.length === 0) {
      return NextResponse.json({ error: "Pilih minimal satu penerima tugas (Assignee)" }, { status: 400 });
    }

    const primaryAssigneeId = finalAssigneeIds[0];
    const isSelfTask = finalAssigneeIds.length === 1 && primaryAssigneeId === authUser.userId;
    const normalizedDepartmentCard = departmentCard.toUpperCase();

    // Proteksi pembuatan tugas pada board eksekutif:
    if (isExecutiveBoard(normalizedDepartmentCard) && !canAccessBoard(normalizedDepartmentCard, authUser)) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda tidak memiliki wewenang untuk membuat tugas di board eksekutif ini" },
        { status: 403 }
      );
    }

    await ensureTaskDiscussionAndLogsTables();

    // Auto flag ke Kanban Content Production jika divisi Sosmed dan opsi diaktifkan
    const isSosmedProduction = normalizedDepartmentCard === "SOSMED" && (isContentProduction === true || isContentProduction === "true");

    const initialDeadline = expectedDeadline ? new Date(expectedDeadline) : null;
    const initialSuggestionStatus = initialDeadline
      ? isSelfTask
        ? "AGREED"
        : "WAITING_ASSIGNEE_CONFIRMATION"
      : "NONE";

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        departmentCard: normalizedDepartmentCard,
        brandName: brandName.trim(),
        userId: primaryAssigneeId,
        creatorId: authUser.userId,
        expectedDeadline: initialDeadline,
        suggestedDeadline: initialDeadline,
        suggestionReason: initialDeadline && !isSelfTask ? "Target awal yang diajukan pembuat tugas" : null,
        suggestionStatus: initialSuggestionStatus,
        priority: priority || "MEDIUM",
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
        status: isSelfTask ? "PENDING" : "REQUESTED",
        isContentProduction: isSosmedProduction,
        kanbanStage: isSosmedProduction ? "CONTENT_BRIEF" : isSelfTask ? "NOT_STARTED" : "USER_REQUESTED",
        category: normalizedDepartmentCard,
        assignees: {
          create: finalAssigneeIds.map((uid, index) => ({
            userId: uid,
            role: index === 0 ? "PIC" : "MEMBER",
          })),
        },
      },
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

    const assigneeNames = newTask.assignees?.map((a: any) => a.user?.name).filter(Boolean) || [];
    const assigneeStr = assigneeNames.length > 0 ? assigneeNames.join(", ") : newTask.user?.name || "Pengerja";

    const deadlineFmt = initialDeadline
      ? initialDeadline.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Belum ditentukan";

    // Catat log aktivitas pertama: Tugas Dibuat
    await prisma.taskActivityLog.create({
      data: {
        taskId: newTask.id,
        userId: authUser.userId,
        actionType: "TASK_CREATED",
        title: "Tugas Dibuat",
        description: `${authUser.name} (${authUser.department || "Pembuat"}) membuat tugas [${normalizedDepartmentCard} - ${brandName.trim()}]: "${title.trim()}" untuk ${assigneeStr}. Target awal deadline: ${deadlineFmt}.`,
        toValue: isSosmedProduction ? "CONTENT_BRIEF" : "PENDING",
        metadata: JSON.stringify({
          initialDeadline: initialDeadline ? initialDeadline.toISOString() : null,
          suggestionStatus: initialSuggestionStatus,
          departmentCard: normalizedDepartmentCard,
          brandName: brandName.trim(),
        }),
      },
    });

    // Kirim notifikasi in-app kepada semua penerima tugas (selain pembuat)
    for (const targetUserId of finalAssigneeIds) {
      if (targetUserId !== authUser.userId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            title: `Tugas Baru: ${title} (Target: ${deadlineFmt})`,
            message: `${authUser.name} (${authUser.department || "Rekan"}) menugaskan Anda tugas baru. Harap tinjau di lembar tugas dan lakukan ACC atau ajukan negosiasi deadline bila perlu.`,
            type: "TASK_ASSIGNED",
            link: "/dashboard/workspace",
            taskId: newTask.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    console.error("POST /api/workspace/tasks error:", error);
    return NextResponse.json({ error: "Gagal membuat tugas baru" }, { status: 500 });
  }
}
