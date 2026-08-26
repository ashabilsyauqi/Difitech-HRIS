"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import {
  CalendarCheck,
  Search,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { exportAttendanceToExcel } from "@/lib/export-utils";

export default function ManagerAttendanceLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  // Inspector Modal
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [photoViewType, setPhotoViewType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchLogs = async () => {
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
      if (selectedStatus !== "ALL") queryUrl += `status=${selectedStatus}&`;
      if (selectedDept !== "ALL") queryUrl += `department=${selectedDept}&`;

      const res = await fetch(queryUrl);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error("Attendance logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate, selectedStatus, selectedDept]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Log Presensi Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const filteredAttendances = attendances.filter((att) => {
    const nameMatch = att.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = att.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const handleExportExcel = () => {
    const exportRows = filteredAttendances.map((att) => ({
      EmployeeName: att.user.name,
      Email: att.user.email,
      Department: att.user.department || "Umum",
      Date: att.date,
      ClockInTime: new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ClockInStatus: att.clockInStatus === "ON_TIME" ? "Tepat Waktu" : att.clockInStatus === "LATE" ? "Terlambat" : "Luar Geofence",
      ClockInDistance: att.clockInDistance ? `${att.clockInDistance.toFixed(0)}m` : "--",
      ClockOutTime: att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Aktif",
      WorkDuration: att.workDurationMinutes ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m` : "Aktif",
      TotalTasks: att.tasks?.length || 0,
      CompletedTasks: att.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0,
    }));

    exportAttendanceToExcel(exportRows, `Laporan_Presensi_Difitech_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "CLIENT_VISIT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ON_TIME":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LATE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "OUT_OF_GEOFENCE":
        return "bg-red-100 text-red-800 border-red-200";
      case "OVERTIME_COMPLETED":
        return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (att: any) => {
    const st = att.clockInStatus;
    if (att.attendanceType === "CLIENT_VISIT" || st === "CLIENT_VISIT") {
      return `Kunjungan Klien${att.clientName ? `: ${att.clientName}` : ""}`;
    }
    if (att.isOvertime) {
      return `Lembur Aktif (${att.overtimeMinutes || 0}m)`;
    }
    switch (st) {
      case "ON_TIME":
        return "Tepat Waktu";
      case "LATE":
        return "Terlambat";
      case "OUT_OF_GEOFENCE":
        return "Luar Geofence";
      default:
        return st;
    }
  };

  const departments = ["ALL", "Engineering & Teknologi", "Produk & Desain", "Quality Assurance", "Pemasaran & Growth", "Human Capital & People"];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <CalendarCheck className="h-4 w-4" />
                <span>Audit & Log Presensi Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Rekapitulasi Presensi & Geofence Tim
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Audit forensik stempel foto CamStamp, radius jarak, dan durasi kerja perorangan.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Ekspor ke Excel (.xlsx)</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama karyawan atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

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

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="ON_TIME">Tepat Waktu Saja</option>
                <option value="LATE">Terlambat</option>
                <option value="OUT_OF_GEOFENCE">Luar Geofence</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Karyawan</th>
                    <th className="px-4 py-4">Departemen</th>
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">CamStamp</th>
                    <th className="px-4 py-4">Jam Masuk</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Jarak</th>
                    <th className="px-4 py-4">Jam Pulang</th>
                    <th className="px-4 py-4">Durasi</th>
                    <th className="px-4 py-4">Tugas</th>
                    <th className="px-4 py-4 text-right">Inspeksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada log presensi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              {att.user.avatarUrl ? (
                                <img src={att.user.avatarUrl} alt={att.user.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                                  {att.user.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 whitespace-nowrap">{att.user.name}</p>
                              <p className="text-[10px] text-slate-500">{att.user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {att.user.department || "Umum"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-700">
                          {att.date}
                        </td>

                        <td className="px-4 py-4">
                          <div
                            onClick={() => {
                              setSelectedAttendance(att);
                              setPhotoViewType("CLOCK_IN");
                              setPhotoViewerOpen(true);
                            }}
                            className="h-10 w-14 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition shadow-2xs"
                          >
                            <img
                              src={att.clockInPhoto}
                              alt="Foto Stempel"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-900">
                          {new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(att.attendanceType === "CLIENT_VISIT" ? "CLIENT_VISIT" : att.clockInStatus)}`}>
                            {getStatusLabel(att)}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600">
                          {att.clockInDistance ? `${att.clockInDistance.toFixed(0)}m` : "--"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-700">
                          {att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " WIB" : "Aktif"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-800">
                          {att.workDurationMinutes ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m` : "Aktif"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-mono">
                            {att.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0} / {att.tasks?.length || 0}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedAttendance(att);
                              setPhotoViewType("CLOCK_IN");
                              setPhotoViewerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspeksi</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        attendance={selectedAttendance}
        viewType={photoViewType}
      />
    </div>
  );
}
