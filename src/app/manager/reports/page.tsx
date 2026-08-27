"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  FileSpreadsheet,
  FileText,
  Download,
} from "lucide-react";
import { exportAttendanceToExcel, exportAttendanceToPdf } from "@/lib/export-utils";

export default function ManagerReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchReportsData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      if (authData.user.role !== "ADMIN" && authData.user.role !== "MANAGER") {
        router.push("/dashboard");
        return;
      }
      setUser(authData.user);

      let queryUrl = "/api/manager/attendance?";
      if (selectedDate) queryUrl += `date=${selectedDate}&`;
      if (selectedDept !== "ALL") queryUrl += `department=${selectedDept}&`;

      const res = await fetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedDate, selectedDept]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Pusat Ekspor Laporan Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const exportRows = attendances.map((att) => ({
    EmployeeName: att.user.name,
    Email: att.user.email,
    Department: att.user.department || "Umum",
    Date: att.date,
    ClockInTime: new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " WIB",
    ClockInStatus: att.clockInStatus === "ON_TIME" ? "Tepat Waktu" : att.clockInStatus === "LATE" ? "Terlambat" : "Luar Geofence",
    ClockInDistance: att.clockInDistance ? `${att.clockInDistance.toFixed(0)}m` : "--",
    ClockOutTime: att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " WIB" : "Aktif",
    WorkDuration: att.workDurationMinutes ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m` : "Aktif",
    TotalTasks: att.tasks?.length || 0,
    CompletedTasks: att.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0,
  }));

  const handleDownloadExcel = () => {
    if (exportRows.length === 0) {
      alert("Tidak ada data presensi yang sesuai dengan filter.");
      return;
    }
    exportAttendanceToExcel(exportRows, `Laporan_Presensi_Difitech_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleDownloadPdf = () => {
    if (exportRows.length === 0) {
      alert("Tidak ada data presensi yang sesuai dengan filter.");
      return;
    }
    exportAttendanceToPdf(exportRows, {
      title: "LAPORAN PRESENSI & TUGAS HARIAN DIFITECH HRIS",
    });
  };

  const departments = ["ALL", "Engineering & Teknologi", "Produk & Desain", "Quality Assurance", "Pemasaran & Growth", "Human Capital & People"];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Pusat Unduh & Rekapitulasi Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Ekspor Laporan Presensi & Payroll
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Unduh rekap data absensi terverifikasi CamStamp dan rasio tugas tim ke format Excel atau dokumen PDF resmi.
              </p>
            </div>
          </div>

          {/* Export Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Excel Card */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Format .XLSX
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-4">Ekspor Excel Presensi & Payroll</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Menghasilkan buku kerja Microsoft Excel yang memuat jam masuk, stempel kepatuhan geofence kantor, dan total jam kerja.
                </p>
              </div>

              <button
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Excel ({exportRows.length} Baris Data)</span>
              </button>
            </div>

            {/* PDF Card */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/20 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 border border-blue-200">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    Dokumen .PDF
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-4">Ringkasan Resmi Dokumen PDF</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Membuat laporan PDF lanskap rapi untuk kebutuhan arsip kepatuhan HR dan laporan manajerial bulanan Difitech HRIS.
                </p>
              </div>

              <button
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Ringkasan PDF</span>
              </button>
            </div>
          </div>

          {/* Table Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-base">Pratinjau Data Laporan Difitech HRIS</h3>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                />

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === "ALL" ? "Semua Departemen" : d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nama Karyawan</th>
                    <th className="px-3 py-3">Departemen</th>
                    <th className="px-3 py-3">Tanggal</th>
                    <th className="px-3 py-3">Jam Masuk</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Jarak</th>
                    <th className="px-3 py-3">Jam Pulang</th>
                    <th className="px-3 py-3">Durasi</th>
                    <th className="px-3 py-3">Tugas Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {exportRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data yang sesuai dengan filter tanggal/departemen.
                      </td>
                    </tr>
                  ) : (
                    exportRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.EmployeeName}</td>
                        <td className="px-3 py-3 text-slate-600">{row.Department}</td>
                        <td className="px-3 py-3 font-mono text-slate-700">{row.Date}</td>
                        <td className="px-3 py-3 font-mono text-slate-900">{row.ClockInTime}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-700">{row.ClockInStatus}</td>
                        <td className="px-3 py-3 font-mono text-slate-600">{row.ClockInDistance}</td>
                        <td className="px-3 py-3 font-mono text-slate-700">{row.ClockOutTime}</td>
                        <td className="px-3 py-3 font-mono text-slate-800">{row.WorkDuration}</td>
                        <td className="px-3 py-3 font-mono text-slate-800">{row.CompletedTasks} / {row.TotalTasks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
