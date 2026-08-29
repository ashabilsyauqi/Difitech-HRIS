export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, reviewNotes } = body; // action: "APPROVE" | "REJECT"

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "Aksi tidak valid. Gunakan APPROVE atau REJECT." },
        { status: 400 }
      );
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pengajuan izin tidak ditemukan" }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: authUser.name || "Management",
        approvedAt: new Date(),
        reviewNotes: reviewNotes?.trim() || (action === "APPROVE" ? "Permohonan disetujui oleh manajemen." : "Permohonan ditolak oleh manajemen."),
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

    return NextResponse.json({
      success: true,
      message: action === "APPROVE" ? "Permohonan berhasil disetujui!" : "Permohonan berhasil ditolak.",
      request: updated,
    });
  } catch (error) {
    console.error("Review leave request error:", error);
    return NextResponse.json({ error: "Failed to update leave request status" }, { status: 500 });
  }
}
