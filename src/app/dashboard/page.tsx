"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CameraStreamModal from "@/components/CamStamp/CameraStreamModal";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import {
  Clock,
  Camera,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Timer,
  Briefcase,
  AlertTriangle,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [office, setOffice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalType, setCameraModalType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewType, setPhotoViewType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Overtime Confirmation Modal
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [isSubmittingOvertime, setIsSubmittingOvertime] = useState(false);

  // Timers
  const [shiftDurationStr, setShiftDurationStr] = useState<string>("00:00:00");
  const [overtimeDurationStr, setOvertimeDurationStr] = useState<string>("00:00:00");
  const [hasShownOvertimePrompt, setHasShownOvertimePrompt] = useState(false);

  const fetchSessionData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);

      const todayRes = await fetch("/api/attendance/today");
      if (todayRes.ok) {
        const attData = await todayRes.json();
        setTodayAttendance(attData.todayAttendance);
        setOffice(attData.office);
        if (attData.tasks) {
          setTasks(attData.tasks);
        }
      }

      const tasksRes = await fetch("/api/tasks");
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  // Timer loop for regular shift & overtime
  useEffect(() => {
    if (!todayAttendance || !todayAttendance.clockInTime || todayAttendance.clockOutTime) {
      return;
    }

    const updateTimer = () => {
      const start = new Date(todayAttendance.clockInTime).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));
      const hours = String(Math.floor(diffSec / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
      const seconds = String(diffSec % 60).padStart(2, "0");
      setShiftDurationStr(`${hours}:${minutes}:${seconds}`);

      // Overtime Timer
      if (todayAttendance.isOvertime && todayAttendance.overtimeStartTime) {
        const otStart = new Date(todayAttendance.overtimeStartTime).getTime();
        const otDiffSec = Math.max(0, Math.floor((now - otStart) / 1000));
        const otHours = String(Math.floor(otDiffSec / 3600)).padStart(2, "0");
        const otMinutes = String(Math.floor((otDiffSec % 3600) / 60)).padStart(2, "0");
        const otSeconds = String(otDiffSec % 60).padStart(2, "0");
        setOvertimeDurationStr(`${otHours}:${otMinutes}:${otSeconds}`);
      }

      // Trigger 8-Hour Overtime Prompt when shift reaches 8 hours (28,800 sec)
      if (
        diffSec >= 8 * 3600 &&
        !todayAttendance.isOvertime &&
        !todayAttendance.clockOutTime &&
        !hasShownOvertimePrompt
      ) {
        setOvertimeModalOpen(true);
        setHasShownOvertimePrompt(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayAttendance, hasShownOvertimePrompt]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">Memuat Portal Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const isClockedIn = !!todayAttendance?.clockInTime;
  const isClockedOut = !!todayAttendance?.clockOutTime;
  const isOvertime = !!todayAttendance?.isOvertime;
  const isClientVisit = todayAttendance?.attendanceType === "CLIENT_VISIT";

  const handleOpenClockIn = () => {
    setCameraModalType("CLOCK_IN");
    setCameraModalOpen(true);
  };

  const handleOpenClockOut = () => {
    setCameraModalType("CLOCK_OUT");
    setCameraModalOpen(true);
  };

  const handleAttendanceSuccess = (newAttendance: any) => {
    setTodayAttendance(newAttendance);
    fetchSessionData();
  };

  // Overtime Actions
  const handleStartOvertime = async () => {
    setIsSubmittingOvertime(true);
    try {
      const res = await fetch("/api/attendance/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_OVERTIME" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodayAttendance(data.attendance);
      setOvertimeModalOpen(false);
      alert("Sesi lembur resmi telah dimulai. Selamat bertugas!");
    } catch (err: any) {
      alert("Gagal memulai lembur: " + err.message);
    } finally {
      setIsSubmittingOvertime(false);
    }
  };

  const handleDeclineOvertime = async () => {
    setIsSubmittingOvertime(true);
    try {
      const res = await fetch("/api/attendance/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE_OVERTIME" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodayAttendance(data.attendance);
      setOvertimeModalOpen(false);
      alert("Shift reguler 8 jam Anda telah selesai dan berhasil dicatat. Terima kasih!");
    } catch (err: any) {
      alert("Gagal memproses selesai shift: " + err.message);
    } finally {
      setIsSubmittingOvertime(false);
    }
  };

  const handleFinishOvertime = async () => {
    if (!confirm("Apakah Anda yakin ingin menyelesaikan sesi lembur dan Clock Out?")) return;
    setIsSubmittingOvertime(true);
    try {
      const res = await fetch("/api/attendance/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FINISH_OVERTIME" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodayAttendance(data.attendance);
      alert(data.message);
    } catch (err: any) {
      alert("Gagal menyelesaikan lembur: " + err.message);
    } finally {
      setIsSubmittingOvertime(false);
    }
  };

  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
  const totalTasksCount = tasks.length;
  const taskProgress = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner with Taharica Red & Blue Gradient */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-red-600" />
                <span>Portal Presensi Difitech HRIS</span>
                {isClientVisit && (
                  <span className="ml-2 rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[10px] font-extrabold border border-purple-200">
                    💼 Kunjungan Klien
                  </span>
                )}
                {isOvertime && !isClockedOut && (
                  <span className="ml-2 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-extrabold border border-amber-200 animate-pulse flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Lembur Aktif</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Selamat Bekerja, {user.name} 👋
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {user.jobTitle || "Karyawan"} • {user.department || "Teknologi"} • {new Date().toLocaleDateString("id-ID", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Action Button */}
            <div>
              {!isClockedIn ? (
                <button
                  onClick={handleOpenClockIn}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700"
                >
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Presensi Masuk (CamStamp)</span>
                </button>
              ) : isOvertime && !isClockedOut ? (
                <button
                  onClick={handleFinishOvertime}
                  disabled={isSubmittingOvertime}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-600/25 transition hover:from-amber-700 hover:to-yellow-700"
                >
                  <Timer className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Selesaikan Sesi Lembur</span>
                </button>
              ) : !isClockedOut ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOvertimeModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                  >
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span>Ajukan Lembur</span>
                  </button>

                  <button
                    onClick={handleOpenClockOut}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Presensi Pulang (CamStamp)</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Shift Hari Ini Selesai {todayAttendance.overtimeMinutes > 0 ? `(Lembur: ${Math.round(todayAttendance.overtimeMinutes / 60)}j)` : ""}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Shift Timer Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Status Jam Kerja</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      !isClockedIn
                        ? "bg-slate-100 text-slate-600"
                        : isOvertime && !isClockedOut
                        ? "bg-amber-50 text-amber-800 border border-amber-200 font-extrabold"
                        : !isClockedOut
                        ? "bg-red-50 text-red-700 border border-red-200 font-extrabold"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {!isClockedIn
                      ? "BELUM MASUK"
                      : isOvertime && !isClockedOut
                      ? "SESI LEMBUR"
                      : !isClockedOut
                      ? "AKTIF BEKERJA (8 JAM)"
                      : "SUDAH PULANG"}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-slate-500">
                    {isOvertime && !isClockedOut ? "Durasi Lembur Berjalan" : "Durasi Jam Kerja Hari Ini"}
                  </p>
                  <div className="text-3xl font-black font-mono tracking-tight text-slate-900 mt-1 flex items-center gap-2">
                    <Timer
                      className={`h-6 w-6 ${
                        isOvertime && !isClockedOut
                          ? "text-amber-500 animate-pulse"
                          : isClockedIn && !isClockedOut
                          ? "text-red-600 animate-pulse"
                          : "text-slate-400"
                      }`}
                    />
                    <span>
                      {isClockedOut
                        ? `${Math.floor((todayAttendance?.workDurationMinutes || 0) / 60)}j ${(todayAttendance?.workDurationMinutes || 0) % 60}m`
                        : isOvertime
                        ? overtimeDurationStr
                        : isClockedIn
                        ? shiftDurationStr
                        : "00:00:00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>
                  Masuk:{" "}
                  {todayAttendance?.clockInTime
                    ? new Date(todayAttendance.clockInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WIB"
                    : "--:--"}
                </span>
                <span>
                  Pulang:{" "}
                  {todayAttendance?.clockOutTime
                    ? new Date(todayAttendance.clockOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WIB"
                    : "--:--"}
                </span>
              </div>
            </div>

            {/* Geofence / Lokasi Kunjungan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Lokasi Penugasan</span>
                  {isClientVisit ? (
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-blue-600" />
                  )}
                </div>

                <div className="mt-3">
                  {isClientVisit ? (
                    <>
                      <h4 className="text-sm font-bold text-purple-900">{todayAttendance.clientName || "Kunjungan Klien"}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        Agenda: {todayAttendance.visitPurpose || "Dinas Luar Resmi"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold text-slate-900">{office?.name || "Kantor Pusat Jakarta (SCBD)"}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {office?.address || "Gedung Pacific Century Place, SCBD Lot 10, Senayan"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{isClientVisit ? "Status Dinas:" : "Radius Kantor:"}</span>
                <span className={`font-mono font-bold ${isClientVisit ? "text-purple-600" : "text-blue-600"}`}>
                  {isClientVisit ? "Terverifikasi Klien" : `${office?.radiusMeters || 150} meter`}
                </span>
              </div>
            </div>

            {/* Progres Tugas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Target Tugas Harian</span>
                  <CheckSquare className="h-4 w-4 text-red-600" />
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {completedTasks}/{totalTasksCount} Selesai
                    </span>
                    <span className="text-xs font-bold text-red-600 font-mono">{taskProgress}%</span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-blue-600 transition-all duration-500"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center justify-between text-xs font-bold text-red-600 hover:text-red-700 transition"
                >
                  <span>Buka Papan Tugas Harian</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Stempel CamStamp Terverifikasi Hari Ini */}
          {todayAttendance && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Bukti Stempel CamStamp Hari Ini {isClientVisit && "(Kunjungan Klien)"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Hasil foto kamera terverifikasi stempel waktu & GPS</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPhotoViewType("CLOCK_IN");
                      setPhotoViewerOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                  >
                    <span>Inspeksi Foto Masuk</span>
                  </button>

                  {todayAttendance.clockOutPhoto && (
                    <button
                      onClick={() => {
                        setPhotoViewType("CLOCK_OUT");
                        setPhotoViewerOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    >
                      <span>Inspeksi Foto Pulang</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div
                  onClick={() => {
                    setPhotoViewType("CLOCK_IN");
                    setPhotoViewerOpen(true);
                  }}
                  className="cursor-pointer group relative md:col-span-4 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs"
                >
                  <img
                    src={todayAttendance.clockInPhoto}
                    alt="Foto Presensi"
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white">
                    Klik untuk Zoom
                  </div>
                </div>

                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-semibold uppercase text-[10px]">Status Verifikasi</p>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      <span>
                        {todayAttendance.attendanceType === "CLIENT_VISIT"
                          ? `Kunjungan Klien: ${todayAttendance.clientName}`
                          : todayAttendance.clockInStatus === "ON_TIME"
                          ? "Tepat Waktu (Terverifikasi)"
                          : todayAttendance.clockInStatus}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500 font-semibold uppercase text-[10px]">Koordinat GPS</p>
                    <p className="font-mono text-blue-700 mt-0.5 font-bold">
                      {todayAttendance.clockInLat.toFixed(6)}, {todayAttendance.clockInLng.toFixed(6)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                    <p className="text-slate-500 font-semibold uppercase text-[10px]">Alamat Fisik Terverifikasi</p>
                    <p className="text-slate-800 mt-0.5 truncate font-medium">
                      {todayAttendance.clockInAddress || "SCBD Lot 10, Senayan, Jakarta Selatan"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Overtime Confirmation Modal */}
      {overtimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Konfirmasi Lembur (Overtime)</h3>
                <p className="text-xs text-slate-500">Shift reguler 8 jam kerja Anda telah selesai</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
              <p className="leading-relaxed">
                Anda telah menyelesaikan shift standar <strong>8 jam kerja (480 menit)</strong>. Apakah Anda ingin melanjutkan dengan <strong>Sesi Kerja Lembur</strong> hari ini?
              </p>
              <ul className="list-disc pl-4 text-[11px] text-slate-500 space-y-1">
                <li>Jika <strong>Tidak</strong>, shift kerja 8 jam akan dikunci dan presensi pulang disimpan otomatis.</li>
                <li>Jika <strong>Ya</strong>, timer lembur baru akan berjalan dan tercatat resmi pada slip gaji.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeclineOvertime}
                disabled={isSubmittingOvertime}
                className="rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Tidak, Selesai 8 Jam
              </button>
              <button
                type="button"
                onClick={handleStartOvertime}
                disabled={isSubmittingOvertime}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-700 transition"
              >
                <Zap className="h-4 w-4" />
                <span>Mulai Lembur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CameraStreamModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        type={cameraModalType}
        user={user}
        office={office}
        onSuccess={handleAttendanceSuccess}
      />

      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        attendance={todayAttendance}
        viewType={photoViewType}
      />
    </div>
  );
}
