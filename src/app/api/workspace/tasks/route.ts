export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // 2. Filter 6 Card Besar Divisi
    if (departmentCard && departmentCard !== "ALL") {
      whereClause.departmentCard = departmentCard;
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

    // Auto flag ke Kanban Content Production jika divisi Sosmed dan opsi diaktifkan
    const isSosmedProduction = normalizedDepartmentCard === "SOSMED" && (isContentProduction === true || isContentProduction === "true");

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        departmentCard: normalizedDepartmentCard,
        brandName: brandName.trim(),
        userId: primaryAssigneeId,
        creatorId: authUser.userId,
        expectedDeadline: expectedDeadline ? new Date(expectedDeadline) : null,
        priority: priority || "MEDIUM",
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
        status: isSelfTask ? "PENDING" : "REQUESTED",
        isContentProduction: isSosmedProduction,
        kanbanStage: isSosmedProduction ? "CONTENT_BRIEF" : null,
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

    // Kirim notifikasi in-app kepada semua penerima tugas (selain pembuat)
    for (const targetUserId of finalAssigneeIds) {
      if (targetUserId !== authUser.userId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            title: `Tugas Baru dari ${authUser.name} (${authUser.department || "Rekan"})`,
            message: `Tugas [${normalizedDepartmentCard} - ${brandName}]: "${title}". Harap tinjau di stage User Requested pada Lembar Tugas Anda.`,
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
