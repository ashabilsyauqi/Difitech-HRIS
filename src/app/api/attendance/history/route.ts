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
    const limit = parseInt(searchParams.get("limit") || "30");

    const history = await prisma.attendance.findMany({
      where: { userId: authUser.userId },
      orderBy: { date: "desc" },
      take: limit,
      include: {
        tasks: true,
        office: true,
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Attendance history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
