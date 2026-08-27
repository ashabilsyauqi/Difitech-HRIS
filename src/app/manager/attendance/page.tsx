"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import {
  CalendarCheck,
  Search,
  Eye,
  FileSpreadsheet,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Camera,
  RefreshCw,
  Building2,
} from "lucide-react";
import { exportAttendanceToExcel } from "@/lib/export-utils";

export default function ManagerAttendanceLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date Range Filters
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState<"TODAY" | "WEEK" | "MONTH" | "ALL">("TODAY");

  // Attribute Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Inspector Modal
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [photoViewType, setPhotoViewType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applyPreset = (preset: "TODAY" | "WEEK" | "MONTH" | "ALL") => {
    setActivePreset(preset);
    const now = new Date();
    const nowStr = now.toISOString().split("T")[0];

    if (preset === "TODAY") {
      setStartDate(nowStr);
      setEndDate(nowStr);
    } else if (preset === "WEEK") {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      setStartDate(past7.toISOString().split("T")[0]);
      setEndDate(nowStr);
    } else if (preset === "MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(nowStr);
    } else if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    }
  };

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

      // Fetch employee list for filter
      const empRes = await fetch("/api/manager/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setUsersList(empData.employees || []);
      }

      // Fetch attendance logs with query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedUser !== "ALL") params.append("userId", selectedUser);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedDept !== "ALL") params.append("department", selectedDept);

      const res = await fetch(`/api/manager/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data.attendances || []);
      }
    } catch (err) {
      console.error("Attendance logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, selectedUser, selectedStatus, selectedDept]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Log & Audit Presensi Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const filteredAttendances = attendances.filter((att) => {
    const query = searchQuery.toLowerCase().trim();
    const nameMatch =
      !query ||
      (att.user?.name && att.user.name.toLowerCase().includes(query)) ||
      (att.user?.email && att.user.email.toLowerCase().includes(query)) ||
      (att.clientName && att.clientName.toLowerCase().includes(query));

    const userMatch =
      selectedUser === "ALL" ||
      att.userId === selectedUser ||
      att.user?.id === selectedUser ||
      att.user?.email === selectedUser;

    const statusMatch =
      selectedStatus === "ALL" ||
      att.clockInStatus === selectedStatus ||
      (selectedStatus === "CLIENT_VISIT" && att.attendanceType === "CLIENT_VISIT");

    const deptMatch =
      selectedDept === "ALL" ||
      att.user?.department === selectedDept;

    let dateMatch = true;
    if (startDate && endDate) {
      dateMatch = att.date >= startDate && att.date <= endDate;
    } else if (startDate) {
      dateMatch = att.date >= startDate;
    } else if (endDate) {
      dateMatch = att.date <= endDate;
    }

    return nameMatch && userMatch && statusMatch && deptMatch && dateMatch;
  });

  // Summary Metrics
  const totalRecords = filteredAttendances.length;
  const onTimeCount = filteredAttendances.filter((a) => a.clockInStatus === "ON_TIME").length;
  const lateCount = filteredAttendances.filter((a) => a.clockInStatus === "LATE").length;
  const clientVisitCount = filteredAttendances.filter((a) => a.attendanceType === "CLIENT_VISIT").length;
  const totalWorkHours = filteredAttendances.reduce((acc, a) => acc + ((a.workDurationMinutes || 0) / 60), 0);

  const handleExportExcel = () => {
    const exportRows = filteredAttendances.map((att) => ({
      Tanggal: att.date,
      NamaKaryawan: att.user.name,
      Email: att.user.email,
      Departemen: att.user.department || "Umum",
      TipePresensi: att.attendanceType === "CLIENT_VISIT" ? "Kunjungan Klien" : "Kantor Difitech",
      NamaKlien: att.clientName || "-",
      JamMasuk: new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      StatusMasuk: att.clockInStatus === "ON_TIME" ? "Tepat Waktu" : att.clockInStatus === "LATE" ? "Terlambat" : "Luar Geofence",
      JarakKantor: att.clockInDistance ? `${att.clockInDistance.toFixed(0)}m` : "-",
      JamPulang: att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Aktif",
      DurasiKerja: att.workDurationMinutes ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m` : "Aktif",
      Lembur: att.overtimeMinutes ? `${Math.floor(att.overtimeMinutes / 60)}j ${att.overtimeMinutes % 60}m` : "0j",
      TotalTugas: att.tasks?.length || 0,
      TugasSelesai: att.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0,
    }));

    exportAttendanceToExcel(exportRows, `Audit_Presensi_Difitech_${startDate || "All"}_sd_${endDate || "All"}.xlsx`);
  };

  const getStatusBadge = (st: string, type?: string) => {
    if (type === "CLIENT_VISIT") {
      return {
        label: "Dinas Luar",
        badge: "bg-purple-100 text-purple-800 border-purple-200",
      };
    }
    switch (st) {
      case "ON_TIME":
        return { label: "Tepat Waktu", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "LATE":
        return { label: "Terlambat", badge: "bg-amber-100 text-amber-800 border-amber-200 font-bold" };
      case "OUT_OF_GEOFENCE":
        return { label: "Luar Geofence", badge: "bg-red-100 text-red-800 border-red-200 font-bold" };
      case "OVERTIME_COMPLETED":
        return { label: "Lembur Selesai", badge: "bg-blue-100 text-blue-900 border-blue-300 font-extrabold" };
      default:
        return { label: st || "Hadir", badge: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/60 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <CalendarCheck className="h-4 w-4" />
                <span>Audit & Log Rekam Presensi Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Riwayat & Logbook Presensi Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Filter rentang tanggal riwayat kehadiran, inspeksi foto CamStamp GPS, dan audit ketepatan waktu shift tim.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 transition active:scale-[0.99]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Presensi</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalRecords}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sesi kehadiran terekam</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tepat Waktu</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{onTimeCount}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {totalRecords > 0 ? `${Math.round((onTimeCount / totalRecords) * 100)}% kepatuhan shift` : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Terlambat</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{lateCount}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Melewati batas jam masuk</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Akumulasi Jam Kerja</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{totalWorkHours.toFixed(1)} <span className="text-sm font-semibold">Jam</span></p>
              <p className="text-[10px] text-blue-600 mt-0.5">{clientVisitCount} dinas luar</p>
            </div>
          </div>

          {/* Filter Bar with Date Range Presets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-red-600" />
                <span className="text-xs font-bold text-slate-800">Filter Riwayat & Rentang Waktu:</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("TODAY")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    activePreset === "TODAY"
                      ? "bg-red-600 text-white shadow-red-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📅 Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("WEEK")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    activePreset === "WEEK"
                      ? "bg-red-600 text-white shadow-red-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🗓️ 7 Hari Terakhir
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("MONTH")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    activePreset === "MONTH"
                      ? "bg-red-600 text-white shadow-red-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📊 Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("ALL")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                    activePreset === "ALL"
                      ? "bg-red-600 text-white shadow-red-600/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🌐 Semua Waktu
                </button>
              </div>
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Date Range Start */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset("ALL");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset("ALL");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                />
              </div>

              {/* Employee Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Pilih Karyawan
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Karyawan ({usersList.length})</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Status Kehadiran
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ON_TIME">Tepat Waktu (On Time)</option>
                  <option value="LATE">Terlambat (Late)</option>
                  <option value="OUT_OF_GEOFENCE">Luar Geofence</option>
                  <option value="CLIENT_VISIT">Dinas Luar / Kunjungan Klien</option>
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Cari Nama / Klien
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nama karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table of Records */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Tanggal & Karyawan</th>
                    <th className="px-4 py-4">Presensi Masuk</th>
                    <th className="px-4 py-4">Status & Radius</th>
                    <th className="px-4 py-4">Presensi Pulang</th>
                    <th className="px-4 py-4">Durasi & Lembur</th>
                    <th className="px-4 py-4">Tugas Harian</th>
                    <th className="px-4 py-4 text-center">Foto CamStamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400">
                        <CalendarCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        Tidak ada catatan presensi pada filter atau rentang waktu yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => {
                      const statusInfo = getStatusBadge(att.clockInStatus, att.attendanceType);
                      const isClient = att.attendanceType === "CLIENT_VISIT";

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/80 transition">
                          {/* Tanggal & Karyawan */}
                          <td className="px-5 py-4">
                            <div className="font-mono text-[11px] font-bold text-slate-900 mb-1">
                              📅 {att.date}
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs flex-shrink-0">
                                {att.user?.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{att.user?.name}</div>
                                <div className="text-[10px] text-slate-400">{att.user?.jobTitle || att.user?.department || "Karyawan"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Jam Masuk */}
                          <td className="px-4 py-4">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[180px]">
                              {isClient ? `📍 ${att.clientName || "Dinas Luar"}` : `🏢 ${att.office?.name || "Difitech HQ"}`}
                            </div>
                          </td>

                          {/* Status & Radius */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] ${statusInfo.badge}`}>
                              <span>{statusInfo.label}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {isClient ? "Kunjungan Klien" : att.clockInDistance ? `Radius: ${att.clockInDistance.toFixed(0)}m` : "--"}
                            </div>
                          </td>

                          {/* Jam Pulang */}
                          <td className="px-4 py-4">
                            {att.clockOutTime ? (
                              <>
                                <div className="font-mono font-bold text-slate-900 text-xs">
                                  {new Date(att.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                                </div>
                                <span className="inline-block text-[10px] text-slate-400">Selesai</span>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Sedang Bekerja
                              </span>
                            )}
                          </td>

                          {/* Durasi & Lembur */}
                          <td className="px-4 py-4 font-mono text-xs">
                            <div className="font-bold text-slate-900">
                              {att.workDurationMinutes
                                ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m`
                                : "Berjalan"}
                            </div>
                            {att.overtimeMinutes > 0 && (
                              <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                                ⚡ Lembur: {Math.floor(att.overtimeMinutes / 60)}j {att.overtimeMinutes % 60}m
                              </div>
                            )}
                          </td>

                          {/* Tugas Harian */}
                          <td className="px-4 py-4">
                            <div className="text-xs font-semibold text-slate-800">
                              {att.tasks?.length || 0} Tugas
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">
                              {att.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0} Selesai
                            </div>
                          </td>

                          {/* Foto CamStamp Inspector */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {att.clockInPhoto && (
                                <button
                                  onClick={() => {
                                    setSelectedAttendance(att);
                                    setPhotoViewType("CLOCK_IN");
                                    setPhotoViewerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                                  title="Lihat Foto CamStamp Masuk"
                                >
                                  <Camera className="h-3 w-3 text-red-600" />
                                  <span>In</span>
                                </button>
                              )}

                              {att.clockOutPhoto && (
                                <button
                                  onClick={() => {
                                    setSelectedAttendance(att);
                                    setPhotoViewType("CLOCK_OUT");
                                    setPhotoViewerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                  title="Lihat Foto CamStamp Pulang"
                                >
                                  <Camera className="h-3 w-3 text-blue-600" />
                                  <span>Out</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CamStamp Photo Inspector Modal */}
      {selectedAttendance && (
        <PhotoViewerModal
          isOpen={photoViewerOpen}
          onClose={() => setPhotoViewerOpen(false)}
          photoDataUrl={
            photoViewType === "CLOCK_IN"
              ? selectedAttendance.clockInPhoto
              : selectedAttendance.clockOutPhoto
          }
          userName={selectedAttendance.user?.name}
          timestamp={
            photoViewType === "CLOCK_IN"
              ? selectedAttendance.clockInTime
              : selectedAttendance.clockOutTime
          }
          address={
            photoViewType === "CLOCK_IN"
              ? selectedAttendance.clockInAddress
              : selectedAttendance.clockOutAddress
          }
          latitude={
            photoViewType === "CLOCK_IN"
              ? selectedAttendance.clockInLat
              : selectedAttendance.clockOutLat
          }
          longitude={
            photoViewType === "CLOCK_IN"
              ? selectedAttendance.clockInLng
              : selectedAttendance.clockOutLng
          }
          attendanceType={selectedAttendance.attendanceType}
          clientName={selectedAttendance.clientName}
          isOvertime={selectedAttendance.isOvertime}
        />
      )}
    </div>
  );
}
