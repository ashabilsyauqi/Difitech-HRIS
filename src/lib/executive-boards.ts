/**
 * Executive & Restricted Boards Helper
 * Memisahkan dan mengisolasi 3 board manajemen khusus:
 * 1. CEO (Chopper View)
 * 2. HR (Human Capital & Operations)
 * 3. DM Executive (Mba Rima)
 *
 * Board ini 100% tertutup dari divisi lain:
 * - Tidak tampil di sidebar karyawan divisi lain (zero trace, no lock icon)
 * - Tidak muncul di BigBoard Difitech ("WB all div")
 * - Tidak bisa dipilih di dropdown Create Task oleh karyawan luar
 */

export const GENERAL_BOARDS = ["SOSMED", "ADS", "SEO", "WEB", "MARKETPLACE"] as const;
export const EXECUTIVE_BOARDS = ["CEO", "HR", "DM_EXECUTIVE"] as const;

export type GeneralBoardKey = typeof GENERAL_BOARDS[number];
export type ExecutiveBoardKey = typeof EXECUTIVE_BOARDS[number];
export type BoardKey = GeneralBoardKey | ExecutiveBoardKey | string;

export interface UserAuthContext {
  id?: string;
  userId?: string;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}

/**
 * Cek apakah sebuah board masuk kategori Board Eksekutif / Khusus
 */
export function isExecutiveBoard(boardKey?: string | null): boolean {
  if (!boardKey) return false;
  return EXECUTIVE_BOARDS.includes(boardKey.toUpperCase() as any);
}

/**
 * Validasi otorisasi akses ke board tertentu
 */
export function canAccessBoard(boardKey?: string | null, user?: UserAuthContext | null): boolean {
  if (!boardKey) return true; // Feed umum / tanpa filter board spesifik
  const key = boardKey.toUpperCase();

  // 1. Board operasional umum dapat diakses siapapun sesuai hak umum
  if (!isExecutiveBoard(key)) {
    return true;
  }

  // Jika board khusus tetapi user tidak terotentikasi, tolak
  if (!user) return false;

  const email = (user.email || "").toLowerCase().trim();
  const role = (user.role || "").toUpperCase().trim();
  const dept = (user.department || "").toLowerCase().trim();
  const title = (user.jobTitle || "").toLowerCase().trim();

  // 2. Hak Akses Penuh: Super Admin & Pak Wijaya (wijaya@difitech.co.id)
  if (
    role === "ADMIN" ||
    email === "wijaya@difitech.co.id" ||
    email === "admin@difitech.id"
  ) {
    return true;
  }

  // 3. Hak Akses Board CEO (Chopper View)
  if (key === "CEO") {
    return (
      email.includes("ceo") ||
      title.includes("ceo") ||
      title.includes("chief executive") ||
      dept.includes("ceo") ||
      role === "CEO"
    );
  }

  // 4. Hak Akses Board HR
  if (key === "HR") {
    return (
      dept.includes("hr") ||
      dept.includes("human") ||
      dept.includes("manajemen & hr") ||
      title.includes("hr") ||
      title.includes("human capital")
    );
  }

  // 5. Hak Akses Board DM Executive (Mba Rima)
  if (key === "DM_EXECUTIVE") {
    return (
      email === "rima@difitech.co.id" ||
      title.includes("dm executive") ||
      title.includes("digital marketing executive") ||
      dept.includes("dm executive")
    );
  }

  return false;
}

/**
 * Daftar konfigurasi UI untuk Board Eksekutif
 */
export const EXECUTIVE_BOARD_CONFIGS = [
  {
    key: "CEO",
    label: "CEO",
    sublabel: "Executive Chopper View",
    color: "text-violet-600 bg-violet-50 border-violet-200",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    headerBg: "bg-gradient-to-r from-violet-600 to-purple-800",
    borderHover: "hover:border-violet-300",
    accentColor: "text-violet-600",
    desc: "Chopper view eksekutif & strategic initiatives perusahaan.",
  },
  {
    key: "HR",
    label: "HR",
    sublabel: "Human Capital & People Ops",
    color: "text-slate-700 bg-slate-100 border-slate-300",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    headerBg: "bg-gradient-to-r from-slate-700 to-slate-900",
    borderHover: "hover:border-slate-300",
    accentColor: "text-slate-700",
    desc: "Rekrutmen karyawan, absensi, payroll gaji, izin cuti, & operasional internal kantor.",
  },
  {
    key: "DM_EXECUTIVE",
    label: "DM Executive",
    sublabel: "Digital Marketing Executive (Mba Rima)",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    headerBg: "bg-gradient-to-r from-indigo-600 to-blue-700",
    borderHover: "hover:border-indigo-300",
    accentColor: "text-indigo-600",
    desc: "Strategi digital marketing eksekutif, koordinasi campaign & growth.",
  },
];
