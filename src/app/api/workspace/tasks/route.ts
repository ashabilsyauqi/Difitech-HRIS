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
    const isContentProduction = searchParams.get("isContentProduction");
    const kanbanStage = searchParams.get("kanbanStage");
    const search = searchParams.get("search");

    const whereClause: any = {};

    // 1. Filter Tab / Papan "Tugas Pribadi"
    if (myTasks === "true" || myTasksTab === "ALL") {
      whereClause.userId = authUser.userId;
    } else if (myTasksTab) {
      whereClause.userId = authUser.userId;
      if (myTasksTab === "INBOX") {
        whereClause.status = "PENDING";
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

    // 4. Filter Kanban Content Production
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
      whereClause.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { brandName: { contains: q } },
      ];
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

    // Ringkasan Counter Tugas Pribadi untuk badge
    const [inboxCount, inProgressCount, completedCount] = await Promise.all([
      prisma.task.count({ where: { userId: authUser.userId, status: "PENDING" } }),
      prisma.task.count({ where: { userId: authUser.userId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { userId: authUser.userId, status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      tasks,
      counts: {
        inbox: inboxCount,
        inProgress: inProgressCount,
        completed: completedCount,
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
    if (!assigneeId) {
      return NextResponse.json({ error: "Pilih penerima tugas (Assignee)" }, { status: 400 });
    }

    const normalizedDepartmentCard = departmentCard.toUpperCase();

    // Auto flag ke Kanban Content Production jika divisi Sosmed dan opsi diaktifkan
    const isSosmedProduction = normalizedDepartmentCard === "SOSMED" && (isContentProduction === true || isContentProduction === "true");

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        departmentCard: normalizedDepartmentCard,
        brandName: brandName.trim(),
        userId: assigneeId,
        creatorId: authUser.userId,
        expectedDeadline: expectedDeadline ? new Date(expectedDeadline) : null,
        priority: priority || "MEDIUM",
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
        status: "PENDING",
        isContentProduction: isSosmedProduction,
        kanbanStage: isSosmedProduction ? "CONTENT_BRIEF" : null,
        category: normalizedDepartmentCard,
      },
      include: {
        user: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true, department: true } },
      },
    });

    // Kirim notifikasi in-app kepada penerima tugas
    if (assigneeId !== authUser.userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: `Tugas Baru dari ${authUser.name} (${authUser.department || "Rekan"})`,
          message: `Tugas [${normalizedDepartmentCard} - ${brandName}]: "${title}". Harap tinjau di menu Tugas Masuk Anda.`,
          type: "TASK_ASSIGNED",
          link: "/dashboard/my-tasks",
          taskId: newTask.id,
        },
      });
    }

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    console.error("POST /api/workspace/tasks error:", error);
    return NextResponse.json({ error: "Gagal membuat tugas baru" }, { status: 500 });
  }
}
