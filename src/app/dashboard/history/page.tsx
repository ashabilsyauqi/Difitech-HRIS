"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import {
  History,
  Eye,
  Zap,
  Clock,
  CalendarCheck,
} from "lucide-react";

export default function EmployeeHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inspector Modal
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [photoViewType, setPhotoViewType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        const histRes = await fetch("/api/attendance/history");
        if (histRes.ok) {
          const hData = await histRes.json();
          setHistory(hData.history);
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Riwayat Presensi Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (st: string, type?: string) => {
    if (type === "WFA") {
      return "bg-cyan-100 text-cyan-800 border-cyan-200 font-bold";
    }
    if (type === "CLIENT_VISIT") {
      return "bg-purple-100 text-purple-800 border-purple-200 font-bold";
    }
    switch (st) {
      case "ON_TIME":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LATE":
        return "bg-amber-100 text-amber-800 border-amber-200 font-bold";
      case "OUT_OF_GEOFENCE":
        return "bg-red-100 text-red-800 border-red-200 font-bold";
      case "OVERTIME_COMPLETED":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (st: string, type?: string) => {
    if (type === "WFA") {
      return "🏠 WFA / Remote";
    }
    if (type === "CLIENT_VISIT") {
      return "💼 Dinas Luar";
    }
    switch (st) {
      case "ON_TIME":
        return "Tepat Waktu";
      case "LATE":
        return "Terlambat";
      case "OUT_OF_GEOFENCE":
        return "Luar Geofence";
      case "OVERTIME_COMPLETED":
        return "⚡ Lembur Tuntas";
      default:
        return st;
    }
  };

  const totalDays = history.length;
  const onTimeCount = history.filter((h) => h.clockInStatus === "ON_TIME").length;
  const lateCount = history.filter((h) => h.clockInStatus === "LATE").length;
  const totalOvertimeMinutes = history.reduce((acc, h) => acc + (h.overtimeMinutes || 0), 0);
  const overtimeCount = history.filter((h) => h.isOvertime || (h.overtimeMinutes && h.overtimeMinutes > 0)).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <History className="h-4 w-4" />
                <span>Riwayat Log Presensi Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Rekam Jejak Presensi & CamStamp
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tinjau bukti foto stempel waktu, koordinat GPS, sesi lembur, dan rasio tugas yang Anda selesaikan.
              </p>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kehadiran</p>
                <CalendarCheck className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalDays} <span className="text-xs font-semibold text-slate-500">Hari</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5">Sesi presensi terekam</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tepat Waktu</p>
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-800 mt-1">{onTimeCount}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {totalDays > 0 ? `${Math.round((onTimeCount / totalDays) * 100)}% kepatuhan` : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Terlambat</p>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-800 mt-1">{lateCount}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Di luar batas toleransi</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Total Jam Lembur</p>
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-950 mt-1">
                {Math.floor(totalOvertimeMinutes / 60)}j {totalOvertimeMinutes % 60}m
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5 font-medium">{overtimeCount} kali sesi lembur</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-4 py-4">Foto CamStamp</th>
                    <th className="px-4 py-4">Jam Masuk</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Jarak Kantor</th>
                    <th className="px-4 py-4">Jam Pulang</th>
                    <th className="px-4 py-4">Durasi Shift</th>
                    <th className="px-4 py-4 text-amber-700">⚡ Lembur</th>
                    <th className="px-4 py-4">Tugas</th>
                    <th className="px-4 py-4 text-right">Inspeksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        Belum ada riwayat data presensi.
                      </td>
                    </tr>
                  ) : (
                    history.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                          {row.date}
                        </td>

                        <td className="px-4 py-4">
                          <div
                            onClick={() => {
                              setSelectedAttendance(row);
                              setPhotoViewType("CLOCK_IN");
                              setPhotoViewerOpen(true);
                            }}
                            className="h-10 w-14 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition shadow-2xs"
                          >
                            <img
                              src={row.clockInPhoto}
                              alt="Foto"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-900">
                          {new Date(row.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(row.clockInStatus, row.attendanceType)}`}>
                            {getStatusLabel(row.clockInStatus, row.attendanceType)}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600">
                          {row.clockInDistance ? `${row.clockInDistance.toFixed(0)}m` : "--"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-700">
                          {row.clockOutTime ? new Date(row.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " WIB" : "--:--"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-800">
                          {row.workDurationMinutes ? `${Math.floor(row.workDurationMinutes / 60)}j ${row.workDurationMinutes % 60}m` : "--"}
                        </td>

                        {/* Lembur Column */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {row.isOvertime && !row.clockOutTime ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              ⚡ Sesi Berjalan
                            </span>
                          ) : row.overtimeMinutes > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 font-mono">
                              ⚡ {Math.floor(row.overtimeMinutes / 60)}j {row.overtimeMinutes % 60}m
                            </span>
                          ) : row.isOvertime ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              ⚡ Lembur (0m)
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-mono">
                            {row.tasks?.length || 0} tugas
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedAttendance(row);
                              setPhotoViewType("CLOCK_IN");
                              setPhotoViewerOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Lihat Foto</span>
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
