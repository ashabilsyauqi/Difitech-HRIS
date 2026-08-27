export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Auto-bootstrap Super Admin jika database belum memiliki akun admin
    if (!user && cleanEmail === "admin@difitech.id" && password === "password123") {
      const passwordHash = await bcrypt.hash("password123", 10);
      user = await prisma.user.upsert({
        where: { email: "admin@difitech.id" },
        update: {
          passwordHash,
          name: "Super Admin Difitech",
          role: "ADMIN",
          department: "Human Capital & Operations",
          jobTitle: "Head of HR & Administrator",
        },
        create: {
          email: "admin@difitech.id",
          passwordHash,
          name: "Super Admin Difitech",
          role: "ADMIN",
          department: "Human Capital & Operations",
          jobTitle: "Head of HR & Administrator",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        },
      });

      // Pastikan data lokasi kantor default juga ada
      await prisma.officeLocation.upsert({
        where: { id: "clx-office-scbd-01" },
        update: {},
        create: {
          id: "clx-office-scbd-01",
          name: "Difitech HQ (Jakarta)",
          address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
          latitude: -6.224647,
          longitude: 106.809592,
          radiusMeters: 150,
          workStartTime: "09:00",
          workEndTime: "17:00",
        },
      });

      // Konfigurasi profil gaji super admin
      await prisma.salaryProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          basicSalary: 15000000,
          positionAllowance: 3000000,
          transportAllowance: 1000000,
          communicationAllowance: 500000,
          otherAllowance: 0,
          latePenaltyRate: 50000,
          overtimeRatePerHour: 100000,
          bpjsKesehatanActive: true,
          bpjsKetenagakerjaanActive: true,
          applyPph21: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
    };

    const token = await signToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        avatarUrl: user.avatarUrl,
      },
      token,
    });

    // Set secure cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kendala saat memproses login" },
      { status: 500 }
    );
  }
}
