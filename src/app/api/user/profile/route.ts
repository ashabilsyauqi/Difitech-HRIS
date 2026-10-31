export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function normalizeWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits || digits.length < 8) return null;

  if (digits.startsWith("08")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  if (digits.startsWith("62")) {
    return digits;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        whatsappNumber: true,
        avatarUrl: true,
        employmentStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Gagal mengambil profil" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const dataToUpdate: any = {};

    if (body.name !== undefined) {
      dataToUpdate.name = body.name.trim();
    }
    if (body.avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;
    }
    if (body.whatsappNumber !== undefined) {
      const trimmed = body.whatsappNumber ? body.whatsappNumber.trim() : "";
      if (!trimmed) {
        dataToUpdate.whatsappNumber = null;
      } else {
        const normalized = normalizeWhatsApp(trimmed);
        if (!normalized) {
          return NextResponse.json(
            { error: "Format nomor WhatsApp tidak valid. Masukkan nomor minimal 10 digit (contoh: 087871976694 atau +628...)" },
            { status: 400 }
          );
        }
        dataToUpdate.whatsappNumber = normalized;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        whatsappNumber: true,
        avatarUrl: true,
        employmentStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profil dan nomor WhatsApp berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}