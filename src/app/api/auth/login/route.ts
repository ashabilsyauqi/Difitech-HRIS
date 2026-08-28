export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

const KNOWN_ACCOUNTS: Record<
  string,
  {
    name: string;
    role: string;
    department: string;
    jobTitle: string;
    basicSalary: number;
    avatarUrl?: string;
  }
> = {
  "admin@difitech.id": {
    name: "Super Admin Difitech",
    role: "ADMIN",
    department: "Human Capital & Operations",
    jobTitle: "Head of HR & Administrator",
    basicSalary: 15000000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  "muditha@difitech.co.id": {
    name: "Muditha",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  "nida@difitech.co.id": {
    name: "Nida",
    role: "EMPLOYEE",
    department: "Kreatif & Desain",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  "khalilan@difitech.co.id": {
    name: "Khalilan",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Intern",
    basicSalary: 3000000,
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
  "dewi@difitech.co.id": {
    name: "Dewi",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
  "fajar@difitech.co.id": {
    name: "Fajar",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  "rima@difitech.co.id": {
    name: "Rima",
    role: "EMPLOYEE",
    department: "Operasional & Bisnis",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  "avila@difitech.co.id": {
    name: "Avila",
    role: "EMPLOYEE",
    department: "Kreatif & Desain",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  "siswandi@difitech.co.id": {
    name: "Siswandi",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  "danar@difitech.co.id": {
    name: "Danar",
    role: "EMPLOYEE",
    department: "Engineering",
    jobTitle: "Karyawan",
    basicSalary: 6000000,
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  },
  "ashabil@difitech.co.id": {
    name: "Ashabil Syauqi",
    role: "EMPLOYEE",
    department: "Engineering & Teknologi",
    jobTitle: "Karyawan",
    basicSalary: 8000000,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
};

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

    // Auto-bootstrap akun tim Difitech jika belum ada di database dan login dengan password default
    const knownConfig = KNOWN_ACCOUNTS[cleanEmail];
    if (!user && knownConfig && password === "password123") {
      const passwordHash = await bcrypt.hash("password123", 10);
      user = await prisma.user.upsert({
        where: { email: cleanEmail },
        update: {
          passwordHash,
          name: knownConfig.name,
          role: knownConfig.role,
          department: knownConfig.department,
          jobTitle: knownConfig.jobTitle,
          avatarUrl: knownConfig.avatarUrl,
        },
        create: {
          email: cleanEmail,
          passwordHash,
          name: knownConfig.name,
          role: knownConfig.role,
          department: knownConfig.department,
          jobTitle: knownConfig.jobTitle,
          avatarUrl: knownConfig.avatarUrl,
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

      // Konfigurasi profil gaji
      await prisma.salaryProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          basicSalary: knownConfig.basicSalary,
          positionAllowance: knownConfig.role === "ADMIN" ? 3000000 : 500000,
          transportAllowance: 500000,
          communicationAllowance: 250000,
          otherAllowance: 0,
          latePenaltyRate: 25000,
          overtimeRatePerHour: 50000,
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

    // Auto-create initial starter tasks if user has 0 tasks
    try {
      const taskCount = await prisma.task.count({ where: { userId: user.id } });
      if (taskCount === 0) {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (cleanEmail === "ashabil@difitech.co.id") {
          await prisma.task.createMany({
            data: [
              {
                userId: user.id,
                title: "Development Fitur Presensi WFA & Remote CamStamp",
                description: "Implementasi 3 opsi presensi (Kantor, WFA, Klien) dengan watermark khusus warna cyan dan bypass radius geofence.",
                category: "Engineering",
                priority: "HIGH",
                status: "COMPLETED",
                estimatedHours: 3.0,
                actualHours: 3.0,
                trackedSeconds: 10800,
                orderIndex: 0,
                targetDate: yesterdayStr,
              },
              {
                userId: user.id,
                title: "Perbaikan State Timer Live Task Persistence",
                description: "Memperbaiki kalkulasi delta timestamp agar live timer tidak reset ke 0 saat browser di-refresh.",
                category: "Engineering",
                priority: "HIGH",
                status: "COMPLETED",
                estimatedHours: 2.0,
                actualHours: 2.0,
                trackedSeconds: 7200,
                orderIndex: 1,
                targetDate: yesterdayStr,
              },
              {
                userId: user.id,
                title: "Implementasi Date Range & Multi-Filter Audit Presensi",
                description: "Menambahkan filter instan nama, departemen, preset rentang waktu, dan export Excel.",
                category: "Engineering",
                priority: "MEDIUM",
                status: "COMPLETED",
                estimatedHours: 2.5,
                actualHours: 2.5,
                trackedSeconds: 9000,
                orderIndex: 2,
                targetDate: yesterdayStr,
              },
              {
                userId: user.id,
                title: "Pengujian Geofence SCBD & Live Radar Map",
                description: "Verifikasi visualisasi pin lokasi karyawan WFA, kantor, dan dinas luar pada peta interaktif Leaflet.",
                category: "QA & Testing",
                priority: "MEDIUM",
                status: "IN_PROGRESS",
                estimatedHours: 2.0,
                actualHours: 1.0,
                trackedSeconds: 3600,
                orderIndex: 3,
                targetDate: todayStr,
              },
              {
                userId: user.id,
                title: "Dokumentasi API & Deployment PM2 cPanel",
                description: "Penyusunan panduan update 2 detik via pre-built Next.js bundle pada environment production.",
                category: "DevOps",
                priority: "LOW",
                status: "PENDING",
                estimatedHours: 1.5,
                actualHours: 0,
                trackedSeconds: 0,
                orderIndex: 4,
                targetDate: todayStr,
              },
            ],
          });
        }
      }
    } catch (tErr) {
      console.error("Auto task creation error:", tErr);
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
