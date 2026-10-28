export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });
    return NextResponse.json({ office });
  } catch (error) {
    console.error("Fetch office error:", error);
    return NextResponse.json({ error: "Failed to fetch office" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      latitude,
      longitude,
      radiusMeters,
      address,
      workStartTime,
      workEndTime,
      flexibleStartWindowStart,
      flexibleStartWindowEnd,
      lateGraceMinutes,
      standardWorkDurationHours,
      allowedClockInOptions,
      cutoffStartDay,
      cutoffEndDay,
    } = body;

    let office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    if (!office) {
      office = await prisma.officeLocation.create({
        data: {
          name: name || "Difitech Office (Bekasi)",
          latitude: Number(latitude) || -6.221538,
          longitude: Number(longitude) || 107.013962,
          radiusMeters: Number(radiusMeters) || 150,
          address: address || "Ruko Burgundy Summarecon Bekasi, Blok RAL/38, RT.001/RW.001, Harapan Baru, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17123",
          workStartTime: workStartTime || "09:00",
          workEndTime: workEndTime || "17:00",
          flexibleStartWindowStart: flexibleStartWindowStart || "08:00",
          flexibleStartWindowEnd: flexibleStartWindowEnd || "10:00",
          lateGraceMinutes: lateGraceMinutes !== undefined ? Number(lateGraceMinutes) : 5,
          standardWorkDurationHours: standardWorkDurationHours !== undefined ? Number(standardWorkDurationHours) : 8.0,
          allowedClockInOptions: allowedClockInOptions || "08:00, 09:00, 10:00",
          cutoffStartDay: cutoffStartDay !== undefined ? Number(cutoffStartDay) : 17,
          cutoffEndDay: cutoffEndDay !== undefined ? Number(cutoffEndDay) : 16,
        },
      });
    } else {
      office = await prisma.officeLocation.update({
        where: { id: office.id },
        data: {
          ...(name && { name }),
          ...(latitude !== undefined && { latitude: Number(latitude) }),
          ...(longitude !== undefined && { longitude: Number(longitude) }),
          ...(radiusMeters !== undefined && { radiusMeters: Number(radiusMeters) }),
          ...(address && { address }),
          ...(workStartTime && { workStartTime }),
          ...(workEndTime && { workEndTime }),
          ...(flexibleStartWindowStart && { flexibleStartWindowStart }),
          ...(flexibleStartWindowEnd && { flexibleStartWindowEnd }),
          ...(lateGraceMinutes !== undefined && { lateGraceMinutes: Number(lateGraceMinutes) }),
          ...(standardWorkDurationHours !== undefined && { standardWorkDurationHours: Number(standardWorkDurationHours) }),
          ...(allowedClockInOptions !== undefined && { allowedClockInOptions }),
          ...(cutoffStartDay !== undefined && { cutoffStartDay: Math.min(28, Math.max(1, Number(cutoffStartDay))) }),
          ...(cutoffEndDay !== undefined && { cutoffEndDay: Math.min(31, Math.max(1, Number(cutoffEndDay))) }),
        },
      });
    }

    return NextResponse.json({ success: true, office });
  } catch (error) {
    console.error("Update office settings error:", error);
    return NextResponse.json({ error: "Failed to update office settings" }, { status: 500 });
  }
}
