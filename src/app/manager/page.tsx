"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AttendanceMap from "@/components/Maps/AttendanceMap";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CheckSquare,
  ArrowRight,
  ShieldAlert,
  CalendarCheck,
  Eye,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function ManagerOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [office, setOffice] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inspector Modal
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchManagerData = async () => {
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

        const statsRes = await fetch("/api/manager/stats");
        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData);
        }

        const mapRes = await fetch("/api/manager/live-locations");
        if (mapRes.ok) {
          const mData = await mapRes.json();
          setOffice(mData.office);
          setAttendances(mData.attendances);
        }
      } catch (err) {
        console.error("Manager dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagerData();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Dashboard Manajemen Taharica...</p>
        </div>
      </div>
    );
  }

  const taskStats = stats?.taskStats || { total: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0 };
  const taskCompletionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
  const idleEmployees = stats?.idleEmployees || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header with Taharica Red & Blue accent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/40 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Activity className="h-4 w-4" />
                <span>Pusat Kendali Operasional Taharica</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Ringkasan Presensi & Produktivitas Tim
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pantau verifikasi presensi CamStamp, status geofence kantor, dan progres tugas per {new Date().toLocaleDateString("id-ID", { month: "long", day: "numeric", year: "numeric" })}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/manager/live-map"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 transition"
              >
                <MapPin className="h-4 w-4" />
                <span>Buka Radar Live</span>
              </Link>
            </div>
          </div>

          {/* Idle Employee Alerts */}
          {idleEmployees.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-amber-900">
                  ⚠️ Perhatian: {idleEmployees.length} Karyawan Belum Memperbarui Tugas ({">"} 2 Jam)
                </p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Karyawan berikut telah presensi masuk tetapi belum memulai tugas:{" "}
                  <b>{idleEmployees.map((e: any) => e.name).join(", ")}</b>.
                </p>
              </div>
              <Link
                href="/manager/tasks"
                className="rounded-xl bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-300 transition whitespace-nowrap"
              >
                Tinjau Tugas →
              </Link>
            </div>
          )}

          {/* KPI Summary Cards Grid with Red & Blue accents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Clocked In */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Karyawan Masuk Hari Ini</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-slate-900">
                  {stats?.activeClockedIn || 0}
                  <span className="text-sm font-semibold text-slate-400"> / {stats?.totalEmployees || 0} Karyawan</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Sedang aktif dalam jam kerja</p>
              </div>
            </div>

            {/* On-Time Arrival */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Tingkat Tepat Waktu</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-emerald-600">
                  {stats?.onTimeCount || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {stats?.lateCount || 0} Terlambat ({stats?.totalClockedIn > 0 ? Math.round(((stats.lateCount) / stats.totalClockedIn) * 100) : 0}%)
                </p>
              </div>
            </div>

            {/* Geofence Violations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Presensi Luar Kantor</span>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-red-600">
                  {stats?.geofenceViolations || 0}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Presensi di luar radius 150m kantor</p>
              </div>
            </div>

            {/* Daily Tasks Completion */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Penyelesaian Tugas Tim</span>
                <CheckSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-blue-600">
                  {taskCompletionRate}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {taskStats.completed} tuntas dari {taskStats.total} total tugas
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid: Live Map Preview & Task Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Map Preview (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Radar Lokasi & Geofence Kantor Taharica</h3>
                </div>
                <Link
                  href="/manager/live-map"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
                >
                  <span>Layar Penuh</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="h-[340px] w-full overflow-hidden rounded-xl">
                <AttendanceMap
                  office={office}
                  attendances={attendances}
                  onInspectPhoto={(att) => {
                    setSelectedAttendance(att);
                    setPhotoViewerOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Task Breakdown (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-red-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Status Tugas Tim Hari Ini</h3>
                  </div>
                  <Link
                    href="/manager/tasks"
                    className="text-xs font-bold text-red-600 hover:text-red-700 transition"
                  >
                    Rincian →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-slate-800">Tugas Selesai (Deliverables)</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">{taskStats.completed}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="font-semibold text-slate-800">Sedang Dikerjakan</span>
                    </div>
                    <span className="font-mono font-bold text-blue-700">{taskStats.inProgress}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="font-semibold text-slate-800">Terkendala (Blocked)</span>
                    </div>
                    <span className="font-mono font-bold text-red-700">{taskStats.blocked}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      <span className="font-semibold text-slate-800">Belum Dikerjakan (Backlog)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700">{taskStats.pending}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  href="/manager/reports"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition"
                >
                  <span>Unduh Laporan Excel / PDF</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Presensi Stream */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Aliran Presensi Karyawan Taharica</h3>
                <p className="text-xs text-slate-500">Foto CamStamp terverifikasi, titik koordinat, dan kepatuhan kantor</p>
              </div>
              <Link
                href="/manager/attendance"
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Lihat Semua Log Tabel →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendances.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-white">
                        {att.user.avatarUrl ? (
                          <img src={att.user.avatarUrl} alt={att.user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">
                            {att.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{att.user.name}</h4>
                        <p className="text-[10px] text-slate-500">{att.user.department || "Teknologi"}</p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        att.clockInStatus === "ON_TIME"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : att.clockInStatus === "LATE"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }`}
                    >
                      {att.clockInStatus === "ON_TIME" ? "Tepat Waktu" : att.clockInStatus === "LATE" ? "Terlambat" : "Luar Geofence"}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setSelectedAttendance(att);
                      setPhotoViewerOpen(true);
                    }}
                    className="cursor-pointer group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <img
                      src={att.clockInPhoto}
                      alt="Foto Stempel"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white">
                      Inspeksi Stempel
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Jam Masuk:</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jarak dari Kantor:</span>
                      <span className="font-mono text-slate-800 font-medium">
                        {att.clockInDistance ? `${att.clockInDistance.toFixed(0)} meter` : "--"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAttendance(att);
                      setPhotoViewerOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspeksi Foto & GPS</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        attendance={selectedAttendance}
        viewType="CLOCK_IN"
      />
    </div>
  );
}
