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
    } = body;

    let office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    if (!office) {
      office = await prisma.officeLocation.create({
        data: {
          name: name || "Difitech HQ (Jakarta)",
          latitude: Number(latitude) || -6.224647,
          longitude: Number(longitude) || 106.809592,
          radiusMeters: Number(radiusMeters) || 150,
          address: address || "Jakarta HQ",
          workStartTime: workStartTime || "09:00",
          workEndTime: workEndTime || "17:00",
          flexibleStartWindowStart: flexibleStartWindowStart || "08:00",
          flexibleStartWindowEnd: flexibleStartWindowEnd || "10:00",
          lateGraceMinutes: lateGraceMinutes !== undefined ? Number(lateGraceMinutes) : 5,
          standardWorkDurationHours: standardWorkDurationHours !== undefined ? Number(standardWorkDurationHours) : 8.0,
          allowedClockInOptions: allowedClockInOptions || "08:00, 09:00, 10:00",
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
        },
      });
    }

    return NextResponse.json({ success: true, office });
  } catch (error) {
    console.error("Update office settings error:", error);
    return NextResponse.json({ error: "Failed to update office settings" }, { status: 500 });
  }
}
