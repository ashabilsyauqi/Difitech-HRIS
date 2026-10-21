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

    const [employees, kanbanStages, tasksWithBrands] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          jobTitle: true,
          avatarUrl: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.kanbanStageSetting.findMany({
        orderBy: { order: "asc" },
      }),
      prisma.task.findMany({
        where: { brandName: { not: null } },
        select: { brandName: true },
        distinct: ["brandName"],
      }),
    ]);

    const existingBrands = tasksWithBrands
      .map((t) => t.brandName)
      .filter((b): b is string => Boolean(b && b.trim()));

    const defaultBrands = ["Internal Difitech", "Brand Utama", "Klien VIP", "Sosmed Agency"];
    const allBrands = Array.from(new Set([...defaultBrands, ...existingBrands]));

    return NextResponse.json({
      employees,
      kanbanStages,
      brands: allBrands,
    });
  } catch (error) {
    console.error("GET /api/workspace/metadata error:", error);
    return NextResponse.json({ error: "Gagal memuat metadata workspace" }, { status: 500 });
  }
}
