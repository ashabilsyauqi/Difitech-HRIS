export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWIBDateString } from "@/lib/date-utils";

const INTERNAL_SECRET = process.env.INTERNAL_SYNC_SECRET || "difitech_secure_workboard_sync_secret_2026";

/**
 * GET /api/external/sync-user-tasks
 * Digunakan oleh HRIS untuk menarik daftar "Tugas Pribadi / Tugas Saya" aktif milik user.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-internal-secret");
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    if (authHeader !== INTERNAL_SECRET && querySecret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Akses internal ditolak. Secret tidak valid." }, { status: 403 });
    }

    const email = searchParams.get("email")?.trim().toLowerCase();
    const userId = searchParams.get("userId")?.trim();
    const targetDate = searchParams.get("date") || getWIBDateString(new Date());

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Parameter 'email' atau 'userId' wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Cari user di DifWorkBoard
    const user = await prisma.user.findFirst({
      where: email ? { email } : { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User dengan identifier tersebut tidak ditemukan di DifWorkBoard.` },
        { status: 404 }
      );
    }

    const startOfTargetDate = new Date(`${targetDate}T00:00:00.000Z`);
    const endOfTargetDate = new Date(`${targetDate}T23:59:59.999Z`);

    // 2. Tarik tugas di mana user adalah PIC / Assignee atau pemilik task
    const rawTasks = await prisma.task.findMany({
      where: {
        OR: [
          { userId: user.id },
          { assignees: { some: { userId: user.id } } },
        ],
        // Tugas yang aktif ATAU tugas yang diselesaikan pada tanggal ini
        AND: [
          {
            OR: [
              { status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED", "REQUESTED"] } },
              {
                AND: [
                  { status: "COMPLETED" },
                  {
                    updatedAt: {
                      gte: startOfTargetDate,
                      lte: endOfTargetDate,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
    });

    // 3. Petakan ke format konsumsi HRIS
    const mappedTasks = rawTasks.map((t) => {
      // Pemetaan stage/status ke format standar HRIS (PENDING, IN_PROGRESS, BLOCKED, COMPLETED)
      let hrisStatus: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" = "PENDING";
      const stageUpper = (t.kanbanStage || "").toUpperCase();

      if (t.status === "COMPLETED" || stageUpper === "DONE" || stageUpper === "PUBLISHED") {
        hrisStatus = "COMPLETED";
      } else if (t.status === "BLOCKED" || stageUpper.includes("REVISI") || stageUpper.includes("KENDALA")) {
        hrisStatus = "BLOCKED";
      } else if (
        t.status === "IN_PROGRESS" ||
        t.isTracking ||
        stageUpper.includes("PROGRESS") ||
        stageUpper.includes("PRODUCTION") ||
        stageUpper.includes("SCRIPTING") ||
        stageUpper.includes("EDITING")
      ) {
        hrisStatus = "IN_PROGRESS";
      } else {
        hrisStatus = "PENDING";
      }

      return {
        workboardTaskId: t.id,
        title: t.title,
        description: t.description || "",
        category: t.departmentCard || t.category || "General",
        brandName: t.brandName || "Internal",
        departmentCard: t.departmentCard || "ALL",
        priority: t.priority || "MEDIUM",
        status: hrisStatus,
        rawWorkboardStatus: t.status,
        kanbanStage: t.kanbanStage || "To Do",
        estimatedHours: t.estimatedHours || 1,
        expectedDeadline: t.expectedDeadline ? t.expectedDeadline.toISOString() : null,
        suggestionStatus: t.suggestionStatus || "AGREED",
        creatorName: t.creator?.name || "Sistem",
        workboardUrl: `https://difworkboard.difitech.id/dashboard/workspace?task=${t.id}`,
        syncedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      targetDate,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      totalTasks: mappedTasks.length,
      tasks: mappedTasks,
    });
  } catch (error: any) {
    console.error("GET /api/external/sync-user-tasks error:", error);
    return NextResponse.json(
      { error: "Gagal menyinkronkan tugas internal", details: error?.message },
      { status: 500 }
    );
  }
}
