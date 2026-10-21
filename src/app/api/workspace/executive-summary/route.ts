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

    // Role check: Admin, Manager, or CEO (Super Admin)
    const isManagerOrAdmin = authUser.role === "ADMIN" || authUser.role === "MANAGER";
    if (!isManagerOrAdmin) {
      return NextResponse.json({ error: "Akses terbatas hanya untuk CEO & Tim Manajemen HR" }, { status: 403 });
    }

    // Hitung rentang Minggu ini (Senin s.d. Minggu dalam zona waktu WIB UTC+7)
    const now = new Date();
    // Offset 7 jam WIB
    const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const dayOfWeek = wibNow.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(wibNow);
    monday.setUTCDate(wibNow.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    // Konversi kembali ke UTC ISO String untuk query database
    const startOfWeekUTC = new Date(monday.getTime() - 7 * 3600 * 1000);
    const endOfWeekUTC = new Date(sunday.getTime() - 7 * 3600 * 1000);

    // Ambil semua task minggu ini (berdasarkan expectedDeadline ATAU createdAt di minggu ini)
    const weeklyTasks = await prisma.task.findMany({
      where: {
        OR: [
          {
            expectedDeadline: {
              gte: startOfWeekUTC,
              lte: endOfWeekUTC,
            },
          },
          {
            createdAt: {
              gte: startOfWeekUTC,
              lte: endOfWeekUTC,
            },
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, department: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, department: true, avatarUrl: true } },
        followUps: {
          include: { sender: { select: { id: true, name: true, department: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ringkasan per Divisi Card
    const divisionStats: Record<string, { total: number; completed: number; inProgress: number; pending: number }> = {
      SOSMED: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      ADS: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      SEO: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      WEB: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      MARKETPLACE: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      HR: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    };

    // Ringkasan per Brand
    const brandStats: Record<string, number> = {};

    weeklyTasks.forEach((t) => {
      const dept = (t.departmentCard || "HR").toUpperCase();
      if (!divisionStats[dept]) {
        divisionStats[dept] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
      }
      divisionStats[dept].total += 1;
      if (t.status === "COMPLETED") divisionStats[dept].completed += 1;
      else if (t.status === "IN_PROGRESS") divisionStats[dept].inProgress += 1;
      else divisionStats[dept].pending += 1;

      const brand = t.brandName || "Umum/Internal";
      brandStats[brand] = (brandStats[brand] || 0) + 1;
    });

    // Radar Follow-Up: Log semua aksi Follow-Up
    const followUps = await prisma.taskFollowUp.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, department: true, avatarUrl: true } },
        recipient: { select: { id: true, name: true, department: true, avatarUrl: true } },
        task: {
          select: {
            id: true,
            title: true,
            brandName: true,
            departmentCard: true,
            status: true,
            expectedDeadline: true,
          },
        },
      },
    });

    // Analisis Bottleneck: Tugas yang paling sering di-follow up
    const taskFollowUpCount: Record<string, { count: number; task: any; senders: string[] }> = {};
    followUps.forEach((fu) => {
      if (!fu.task) return;
      const tid = fu.task.id;
      if (!taskFollowUpCount[tid]) {
        taskFollowUpCount[tid] = {
          count: 0,
          task: fu.task,
          senders: [],
        };
      }
      taskFollowUpCount[tid].count += 1;
      if (!taskFollowUpCount[tid].senders.includes(fu.sender.name)) {
        taskFollowUpCount[tid].senders.push(fu.sender.name);
      }
    });

    const highFollowUpTasks = Object.values(taskFollowUpCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      weekRange: {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
      },
      weeklyTasks,
      divisionStats,
      brandStats,
      followUps,
      highFollowUpTasks,
      summary: {
        totalWeeklyTasks: weeklyTasks.length,
        completedWeeklyTasks: weeklyTasks.filter((t) => t.status === "COMPLETED").length,
        inProgressWeeklyTasks: weeklyTasks.filter((t) => t.status === "IN_PROGRESS").length,
        pendingWeeklyTasks: weeklyTasks.filter((t) => t.status === "PENDING").length,
        totalFollowUpsRecorded: followUps.length,
      },
    });
  } catch (error) {
    console.error("GET /api/workspace/executive-summary error:", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan eksekutif" }, { status: 500 });
  }
}
