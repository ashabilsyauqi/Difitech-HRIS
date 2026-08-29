export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureLeaveTable } from "@/lib/ensure-leave-table";

export async function GET(req: NextRequest) {
  try {
    await ensureLeaveTable();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch leave requests error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureLeaveTable();
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      startDate,
      endDate,
      reason,
      emergencyContact,
      attachmentUrl,
      attachmentName,
      attachmentType,
    } = body;

    if (!type || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json(
        { error: "Tipe pengajuan, tanggal mulai, tanggal selesai, dan alasan permohonan wajib diisi." },
        { status: 400 }
      );
    }

    // Attachment validation: Wajib untuk Izin Sakit
    if (type === "SICK" && !attachmentUrl) {
      return NextResponse.json(
        { error: "Pengajuan Izin Sakit wajib melampirkan Surat Keterangan Dokter / Bukti Medis." },
        { status: 400 }
      );
    }

    // Calculate duration in days (inclusive)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const leave = await prisma.leaveRequest.create({
      data: {
        userId: authUser.userId,
        type: type || "SICK",
        startDate,
        endDate,
        durationDays,
        reason: reason.trim(),
        emergencyContact: emergencyContact?.trim() || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName?.trim() || null,
        attachmentType: attachmentType || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, leave });
  } catch (error) {
    console.error("Create leave request error:", error);
    return NextResponse.json({ error: "Failed to submit leave request" }, { status: 500 });
  }
}
