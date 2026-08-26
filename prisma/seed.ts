import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper to check if a date is a weekday (Monday-Friday)
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

async function main() {
  console.log("🚀 Memulai Pembuatan Data Lengkap 1 Tahun (September 2025 - Agustus 2026) untuk Taharica HRIS...");

  // 1. Lokasi Kantor Utama (Taharica HQ Jakarta SCBD)
  const defaultOffice = await prisma.officeLocation.upsert({
    where: { id: "clx-office-scbd-01" },
    update: {
      name: "Taharica HQ (Jakarta)",
      address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
      latitude: -6.224647,
      longitude: 106.809592,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
    },
    create: {
      id: "clx-office-scbd-01",
      name: "Taharica HQ (Jakarta)",
      address: "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
      latitude: -6.224647,
      longitude: 106.809592,
      radiusMeters: 150,
      workStartTime: "09:00",
      workEndTime: "17:00",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  const oneYearAgo = new Date("2025-08-15T08:00:00+07:00");

  // 2. Daftar 6 Karyawan Utama Taharica Group
  const employeesData = [
    {
      key: "ashabil",
      email: "ashabil@hris.local",
      name: "Ashabil",
      role: "MANAGER",
      department: "Engineering & Teknologi",
      jobTitle: "VP of Engineering & Tech Lead",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bankName: "BCA",
      bankAccountNumber: "8012345671",
      npwpNumber: "09.123.456.7-012.000",
      salary: {
        basicSalary: 25000000,
        positionAllowance: 5000000,
        transportAllowance: 2000000,
        communicationAllowance: 500000,
        latePenaltyRate: 100000,
        overtimeRatePerHour: 150000,
      },
    },
    {
      key: "rayhan",
      email: "rayhan@hris.local",
      name: "Rayhan",
      role: "ADMIN",
      department: "Human Capital & People",
      jobTitle: "Head of People Operations",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      bankName: "Mandiri",
      bankAccountNumber: "1370012345672",
      npwpNumber: "09.234.567.8-013.000",
      salary: {
        basicSalary: 20000000,
        positionAllowance: 4000000,
        transportAllowance: 1500000,
        communicationAllowance: 500000,
        latePenaltyRate: 75000,
        overtimeRatePerHour: 100000,
      },
    },
    {
      key: "agus",
      email: "agus@hris.local",
      name: "Agus",
      role: "EMPLOYEE",
      department: "Engineering & Teknologi",
      jobTitle: "Senior Frontend Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bankName: "BCA",
      bankAccountNumber: "8012345673",
      npwpNumber: "09.345.678.9-014.000",
      salary: {
        basicSalary: 14000000,
        positionAllowance: 2500000,
        transportAllowance: 1200000,
        communicationAllowance: 300000,
        latePenaltyRate: 50000,
        overtimeRatePerHour: 75000,
      },
    },
    {
      key: "rohmat",
      email: "rohmat@hris.local",
      name: "Rohmat",
      role: "EMPLOYEE",
      department: "Produk & Desain",
      jobTitle: "Lead UI/UX Designer",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bankName: "BCA",
      bankAccountNumber: "8012345674",
      npwpNumber: "09.456.789.0-015.000",
      salary: {
        basicSalary: 13500000,
        positionAllowance: 2000000,
        transportAllowance: 1200000,
        communicationAllowance: 300000,
        latePenaltyRate: 50000,
        overtimeRatePerHour: 75000,
      },
    },
    {
      key: "farhan",
      email: "farhan@hris.local",
      name: "Farhan",
      role: "EMPLOYEE",
      department: "Quality Assurance",
      jobTitle: "Lead QA Automation Engineer",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      bankName: "BSI",
      bankAccountNumber: "7123456785",
      npwpNumber: "09.567.890.1-016.000",
      salary: {
        basicSalary: 11000000,
        positionAllowance: 1500000,
        transportAllowance: 1000000,
        communicationAllowance: 300000,
        latePenaltyRate: 50000,
        overtimeRatePerHour: 75000,
      },
    },
    {
      key: "rafi",
      email: "rafi@hris.local",
      name: "Rafi",
      role: "EMPLOYEE",
      department: "Pemasaran & Growth",
      jobTitle: "Senior Growth Marketing Specialist",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      bankName: "Mandiri",
      bankAccountNumber: "1370012345676",
      npwpNumber: "09.678.901.2-017.000",
      salary: {
        basicSalary: 10500000,
        positionAllowance: 1500000,
        transportAllowance: 1000000,
        communicationAllowance: 300000,
        latePenaltyRate: 50000,
        overtimeRatePerHour: 75000,
      },
    },
  ];

  const userMap: Record<string, any> = {};

  for (const emp of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        role: emp.role,
        department: emp.department,
        jobTitle: emp.jobTitle,
        avatarUrl: emp.avatarUrl,
        bankName: emp.bankName,
        bankAccountNumber: emp.bankAccountNumber,
        bankAccountHolder: emp.name,
        npwpNumber: emp.npwpNumber,
        bpjsKesehatanNumber: `00012345${emp.key}`,
        bpjsKetenagakerjaanNumber: `98765432${emp.key}`,
      },
      create: {
        email: emp.email,
        passwordHash,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        jobTitle: emp.jobTitle,
        avatarUrl: emp.avatarUrl,
        bankName: emp.bankName,
        bankAccountNumber: emp.bankAccountNumber,
        bankAccountHolder: emp.name,
        npwpNumber: emp.npwpNumber,
        bpjsKesehatanNumber: `00012345${emp.key}`,
        bpjsKetenagakerjaanNumber: `98765432${emp.key}`,
        createdAt: oneYearAgo,
      },
    });

    userMap[emp.key] = user;

    await prisma.salaryProfile.upsert({
      where: { userId: user.id },
      update: {
        basicSalary: emp.salary.basicSalary,
        positionAllowance: emp.salary.positionAllowance,
        transportAllowance: emp.salary.transportAllowance,
        communicationAllowance: emp.salary.communicationAllowance,
        latePenaltyRate: emp.salary.latePenaltyRate,
        overtimeRatePerHour: emp.salary.overtimeRatePerHour,
      },
      create: {
        userId: user.id,
        basicSalary: emp.salary.basicSalary,
        positionAllowance: emp.salary.positionAllowance,
        transportAllowance: emp.salary.transportAllowance,
        communicationAllowance: emp.salary.communicationAllowance,
        latePenaltyRate: emp.salary.latePenaltyRate,
        overtimeRatePerHour: emp.salary.overtimeRatePerHour,
        createdAt: oneYearAgo,
      },
    });
  }

  // 3. Generate 12 Bulan Periode Penggajian (September 2025 s/d Agustus 2026)
  console.log("📅 Membuat 12 Periode Payroll Bulanan...");

  const periodsConfig = [
    { year: 2025, month: 9, label: "September 2025" },
    { year: 2025, month: 10, label: "Oktober 2025" },
    { year: 2025, month: 11, label: "November 2025" },
    { year: 2025, month: 12, label: "Desember 2025", bonus: true },
    { year: 2026, month: 1, label: "Januari 2026" },
    { year: 2026, month: 2, label: "Februari 2026" },
    { year: 2026, month: 3, label: "Maret 2026" },
    { year: 2026, month: 4, label: "April 2026", thr: true },
    { year: 2026, month: 5, label: "Mei 2026" },
    { year: 2026, month: 6, label: "Juni 2026" },
    { year: 2026, month: 7, label: "Juli 2026" },
    { year: 2026, month: 8, label: "Agustus 2026" },
  ];

  for (const p of periodsConfig) {
    const monthStr = String(p.month).padStart(2, "0");
    const lastDay = new Date(p.year, p.month, 0).getDate();
    const startDate = `${p.year}-${monthStr}-01`;
    const endDate = `${p.year}-${monthStr}-${lastDay}`;
    const cutoffDate = `${p.year}-${monthStr}-25`;
    const paymentDate = `${p.year}-${monthStr}-28`;

    const period = await prisma.payrollPeriod.upsert({
      where: { month_year: { month: p.month, year: p.year } },
      update: {
        periodLabel: p.label,
        startDate,
        endDate,
        cutoffDate,
        paymentDate,
        status: "PAID",
      },
      create: {
        periodLabel: p.label,
        month: p.month,
        year: p.year,
        startDate,
        endDate,
        cutoffDate,
        paymentDate,
        status: "PAID",
        createdAt: new Date(`${startDate}T00:00:00Z`),
      },
    });

    let totalGrossMonth = 0;
    let totalDedMonth = 0;
    let totalNetMonth = 0;

    for (const emp of employeesData) {
      const u = userMap[emp.key];
      if (!u) continue;

      const sal = emp.salary;
      let otherAllowance = 0;
      let notes = "Pembayaran gaji terverifikasi CamStamp";

      if (p.bonus && emp.key !== "rafi") {
        otherAllowance = sal.basicSalary * 0.5; // Bonus akhir tahun 50% gaji pokok
        notes = "Termasuk Bonus Kinerja Akhir Tahun 2025";
      } else if (p.thr) {
        otherAllowance = sal.basicSalary; // THR 1x Gaji Pokok
        notes = "Termasuk Tunjangan Hari Raya (THR) Idul Fitri 1447 H";
      }

      // Lembur sesekali untuk tim teknis
      let overtimeHours = 0;
      let overtimePay = 0;
      if ((emp.key === "agus" || emp.key === "farhan") && (p.month % 2 === 0)) {
        overtimeHours = 4.0;
        overtimePay = overtimeHours * sal.overtimeRatePerHour;
      }

      // Keterlambatan realistis sesekali
      let lateCount = 0;
      if (emp.key === "rohmat" && (p.month === 8 || p.month === 2)) lateCount = 1;
      if (emp.key === "farhan" && p.month === 5) lateCount = 1;
      const latePenaltyTotal = lateCount * sal.latePenaltyRate;

      const grossSalary =
        sal.basicSalary +
        sal.positionAllowance +
        sal.transportAllowance +
        sal.communicationAllowance +
        otherAllowance +
        overtimePay;

      // BPJS Karyawan
      const bpjsKesBase = Math.min(sal.basicSalary, 12000000);
      const bpjsKes = Math.round(bpjsKesBase * 0.01);
      const bpjsTk = Math.round(sal.basicSalary * 0.02 + Math.min(sal.basicSalary, 10042300) * 0.01);

      // PPh 21 TER Estimasi
      let pph21Rate = 0.05;
      if (grossSalary > 20000000) pph21Rate = 0.15;
      else if (grossSalary > 10000000) pph21Rate = 0.08;
      const pph21 = Math.round(grossSalary * pph21Rate);

      const totalDeductions = latePenaltyTotal + bpjsKes + bpjsTk + pph21;
      const netSalary = grossSalary - totalDeductions;

      totalGrossMonth += grossSalary;
      totalDedMonth += totalDeductions;
      totalNetMonth += netSalary;

      await prisma.payslip.upsert({
        where: {
          payrollPeriodId_userId: {
            payrollPeriodId: period.id,
            userId: u.id,
          },
        },
        update: {
          attendanceDaysCount: 22,
          lateCount,
          latePenaltyTotal,
          overtimeHours,
          overtimePay,
          basicSalary: sal.basicSalary,
          positionAllowance: sal.positionAllowance,
          transportAllowance: sal.transportAllowance,
          communicationAllowance: sal.communicationAllowance,
          otherAllowance,
          grossSalary,
          bpjsKesehatanEmp: bpjsKes,
          bpjsKetenagakerjaanEmp: bpjsTk,
          pph21Amount: pph21,
          totalDeductions,
          netSalary,
          bankName: emp.bankName,
          bankAccountNumber: emp.bankAccountNumber,
          status: "PAID",
          paidAt: new Date(`${paymentDate}T10:00:00+07:00`),
          notes,
        },
        create: {
          payrollPeriodId: period.id,
          userId: u.id,
          attendanceDaysCount: 22,
          lateCount,
          latePenaltyTotal,
          overtimeHours,
          overtimePay,
          basicSalary: sal.basicSalary,
          positionAllowance: sal.positionAllowance,
          transportAllowance: sal.transportAllowance,
          communicationAllowance: sal.communicationAllowance,
          otherAllowance,
          grossSalary,
          bpjsKesehatanEmp: bpjsKes,
          bpjsKetenagakerjaanEmp: bpjsTk,
          pph21Amount: pph21,
          totalDeductions,
          netSalary,
          bankName: emp.bankName,
          bankAccountNumber: emp.bankAccountNumber,
          status: "PAID",
          paidAt: new Date(`${paymentDate}T10:00:00+07:00`),
          notes,
          createdAt: new Date(`${paymentDate}T09:00:00Z`),
        },
      });
    }

    await prisma.payrollPeriod.update({
      where: { id: period.id },
      data: {
        totalGrossPayout: totalGrossMonth,
        totalDeductions: totalDedMonth,
        totalNetPayout: totalNetMonth,
      },
    });
  }

  // 4. Generate Log Presensi Harian CamStamp 1 Tahun Penuh (Hari Kerja)
  console.log("⏱️  Menghasilkan Riwayat Presensi CamStamp 1 Tahun Penuh...");

  const startDate = new Date("2025-09-01");
  const endDate = new Date("2026-08-26");
  const attendanceBatch: any[] = [];

  const baseSvg = (name: string, dateStr: string, timeStr: string, statusColor: string) =>
    `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3Ctext x='50%25' y='42%25' font-family='Arial' font-size='22' font-weight='bold' fill='%23ffffff' text-anchor='middle'%3E${encodeURIComponent(name)}%3C/text%3E%3Ctext x='50%25' y='56%25' font-family='monospace' font-size='13' fill='%23${statusColor}' text-anchor='middle'%3ECamStamp: -6.224647, 106.809592 (${dateStr} ${timeStr})%3C/text%3E%3Ctext x='50%25' y='68%25' font-family='sans-serif' font-size='11' fill='%2394a3b8' text-anchor='middle'%3E📍 Pacific Century Place SCBD Jakarta%3C/text%3E%3C/svg%3E`;

  // Loop setiap hari sepanjang 1 tahun
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (!isWeekday(d)) continue; // Hanya hari Senin-Jumat

    const dateStr = formatDate(d);

    for (const emp of employeesData) {
      // Exclude Rafi from today (2026-08-26) so Rafi is marked as "BELUM MASUK"
      if (dateStr === "2026-08-26" && emp.key === "rafi") {
        continue;
      }

      const u = userMap[emp.key];
      if (!u) continue;

      // Seed pseudo-random variance based on day & user
      const hash = (d.getDate() * 17 + d.getMonth() * 31 + emp.name.charCodeAt(0)) % 100;
      
      let hour = 8;
      let minute = 20 + (hash % 35); // 08:20 - 08:55
      let status = "ON_TIME";
      let distance = 10 + (hash % 40);
      let statusColor = "38bdf8";

      // 5% kemungkinan terlambat
      if (hash > 94) {
        hour = 9;
        minute = 8 + (hash % 20); // 09:08 - 09:28
        status = "LATE";
        statusColor = "fbbf24";
      }

      // 2% kemungkinan WFH / Out of geofence
      if (hash === 50) {
        status = "OUT_OF_GEOFENCE";
        distance = 450 + (hash % 300);
        statusColor = "f87171";
      }

      const clockInTime = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:15+07:00`);
      const clockOutHour = 17 + (hash % 3); // 17:00 - 19:00
      const clockOutMin = 15 + (hash % 40);
      const clockOutTime = new Date(`${dateStr}T${String(clockOutHour).padStart(2, "0")}:${String(clockOutMin).padStart(2, "0")}:45+07:00`);
      const duration = (clockOutHour - hour) * 60 + (clockOutMin - minute);

      attendanceBatch.push({
        userId: u.id,
        officeId: defaultOffice.id,
        date: dateStr,
        clockInTime,
        clockInPhoto: baseSvg(emp.name, dateStr, `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} WIB`, statusColor),
        clockInLat: -6.224647 + (hash % 10 - 5) * 0.00003,
        clockInLng: 106.809592 + (hash % 10 - 5) * 0.00003,
        clockInAddress: "Gedung Pacific Century Place, SCBD Lot 10, Jakarta Selatan",
        clockInAccuracy: 12.0 + (hash % 15),
        clockInStatus: status,
        clockInDistance: distance,
        clockOutTime,
        clockOutPhoto: baseSvg(emp.name, dateStr, `${String(clockOutHour).padStart(2, "0")}:${String(clockOutMin).padStart(2, "0")} WIB`, "34d399"),
        clockOutLat: -6.224647,
        clockOutLng: 106.809592,
        clockOutAddress: "Gedung Pacific Century Place, SCBD Lot 10, Jakarta Selatan",
        clockOutAccuracy: 14.0,
        clockOutStatus: "ON_TIME",
        clockOutDistance: distance,
        workDurationMinutes: duration,
        deviceInfo: "Chrome / macOS / CamStamp Hardware Auth",
        notes: status === "LATE" ? "Keterlambatan presensi pagi" : status === "OUT_OF_GEOFENCE" ? "Kunjungan kerja lapangan / WFH" : undefined,
        createdAt: clockInTime,
      });
    }
  }

  console.log(`💾 Menyimpan ${attendanceBatch.length} log presensi ke database...`);

  // Simpan secara chunk
  const chunkSize = 200;
  for (let i = 0; i < attendanceBatch.length; i += chunkSize) {
    const chunk = attendanceBatch.slice(i, i + chunkSize);
    for (const att of chunk) {
      await prisma.attendance.upsert({
        where: { userId_date: { userId: att.userId, date: att.date } },
        update: att,
        create: att,
      });
    }
  }

  // 5. Data Tugas Kanban Historis 1 Tahun
  console.log("📋 Menambahkan Portofolio Tugas Historis Sepanjang Tahun...");

  const sampleTasks = [
    {
      userKey: "agus",
      title: "Arsitektur Client-side CamStamp Canvas Engine",
      description: "Implementasi rendering stempel watermark GPS & ISO timestamp langsung di canvas browser.",
      category: "Development",
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 6.0,
      actualHours: 5.5,
      deliverableUrl: "https://github.com/taharica/hris-camstamp/pull/1",
      completionNote: "Lolos uji performa 60 FPS pada kamera perangkat mobile",
    },
    {
      userKey: "agus",
      title: "Integrasi Desain Talenta Light Theme & Nuansa Merah Taharica",
      description: "Pembaruan visual antarmuka sistem HRIS sesuai identitas korporat Taharica.",
      category: "Development",
      priority: "MEDIUM",
      status: "COMPLETED",
      estimatedHours: 4.0,
      actualHours: 3.5,
      deliverableUrl: "https://github.com/taharica/hris-camstamp/pull/8",
      completionNote: "Komponen tailwind dan warna aksen diselaraskan",
    },
    {
      userKey: "agus",
      title: "Modul Ekspor Excel & PDF Slip Gaji Karyawan",
      description: "Pembangunan generator slip gaji PDF berstandar keuangan Indonesia.",
      category: "Development",
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 5.0,
      actualHours: 4.5,
      deliverableUrl: "https://github.com/taharica/hris-camstamp/pull/22",
      completionNote: "Kop surat resmi, rincian BPJS, PPh 21, dan barcode terintegrasi",
    },
    {
      userKey: "rohmat",
      title: "Design System & UI Component Library Taharica HRIS",
      description: "Pembuatan komponen UI Figma: Navbar, Sidebar, Kartu Presensi, dan Modal CamStamp.",
      category: "Design",
      priority: "URGENT",
      status: "COMPLETED",
      estimatedHours: 8.0,
      actualHours: 7.0,
      deliverableUrl: "https://www.figma.com/file/taharica-design-system",
      completionNote: "Telah disetujui oleh VP of Engineering",
    },
    {
      userKey: "rohmat",
      title: "Mockup & User Flow Manajemen Penggajian (Payroll Master)",
      description: "Alur kalkulasi 1-klik, penyesuaian bonus, dan transfer massal perbankan.",
      category: "Design",
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 4.5,
      actualHours: 4.0,
      deliverableUrl: "https://www.figma.com/file/taharica-payroll-flow",
      completionNote: "UX divalidasi dengan tim People Operations",
    },
    {
      userKey: "farhan",
      title: "Automated End-to-End Testing Geofencing & GPS Haversine",
      description: "Penyusunan automated suite testing untuk validasi jarak radius 150 meter kantor SCBD.",
      category: "Quality Assurance",
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 6.0,
      actualHours: 5.8,
      deliverableUrl: "https://github.com/taharica/hris-camstamp/actions/runs/204",
      completionNote: "100% test coverage pada algoritma jarak Haversine",
    },
    {
      userKey: "farhan",
      title: "Security Audit Anti-Spoofing & Metadata Validation",
      description: "Pengujian penetrasi terhadap mock location Android & manipulasi jam perangkat.",
      category: "Quality Assurance",
      priority: "URGENT",
      status: "COMPLETED",
      estimatedHours: 7.0,
      actualHours: 6.5,
      deliverableUrl: "https://github.com/taharica/hris-camstamp/security/reports/01",
      completionNote: "Enkripsi timestamp client dan validasi server-side dinyatakan aman",
    },
    {
      userKey: "rayhan",
      title: "Penyusunan Struktur Kompensasi & Skema BPJS/PPh 21 Taharica",
      description: "Standardisasi formula penggajian, potongan keterlambatan, dan pendaftaran BPJS Karyawan.",
      category: "Operations",
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 5.0,
      actualHours: 5.0,
      deliverableUrl: "https://drive.google.com/drive/folders/taharica-hc-policy",
      completionNote: "Kebijakan resmi SDM telah disahkan manajemen",
    },
    {
      userKey: "rafi",
      title: "Penyelarasan Branding & Komunikasi Internal Taharica Group",
      description: "Sosialisasi adopsi platform presensi CamStamp kepada seluruh divisi kerja.",
      category: "Marketing",
      priority: "MEDIUM",
      status: "COMPLETED",
      estimatedHours: 3.5,
      actualHours: 3.0,
      deliverableUrl: "https://taharica.internal/handbook-camstamp",
      completionNote: "Tingkat adopsi presensi tepat waktu mencapai 98%",
    },
  ];

  for (const t of sampleTasks) {
    const u = userMap[t.userKey];
    if (!u) continue;

    const existing = await prisma.task.findFirst({
      where: { userId: u.id, title: t.title },
    });
    if (!existing) {
      const { userKey, ...tData } = t;
      await prisma.task.create({ data: { ...tData, userId: u.id } as any });
    }
  }

  console.log("🎉 Sukses! Database telah disimulasikan berjalan selama 1 TAHUN PENUH!");
  console.log("   - 12 Periode Penggajian (Sept 2025 - Agust 2026) dengan Slip Gaji & THR.");
  console.log("   - ~1,500 Catatan Presensi CamStamp Lengkap dengan Waktu, Koordinat, & Stempel.");
  console.log("   - Portofolio Tugas Kanban & Matriks Kinerja 1 Tahun.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
