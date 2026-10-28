"use client";

export const dynamic = "force-dynamic";


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
  X,
  BellRing,
  Tag,
  Layers,
  ExternalLink,
  Inbox,
  Filter,
} from "lucide-react";
import Link from "next/link";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";

const DEPT_BADGES: Record<string, { label: string; color: string }> = {
  SOSMED: { label: "Sosmed", color: "bg-pink-50 text-pink-700 border-pink-200" },
  ADS: { label: "Ads", color: "bg-blue-50 text-blue-700 border-blue-200" },
  SEO: { label: "SEO", color: "bg-amber-50 text-amber-700 border-amber-200" },
  WEB: { label: "Web", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  MARKETPLACE: { label: "Marketplace", color: "bg-purple-50 text-purple-700 border-purple-200" },
  HR: { label: "HR", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

function getCardStatusBadge(task: any) {
  if (task.reviewStatus === "TO_BE_REVIEWED") {
    return { label: "⏳ Menunggu Review", color: "bg-amber-100 text-amber-800 border-amber-300" };
  }
  if (task.reviewStatus === "UNDER_REVIEW") {
    return { label: "👀 Sedang Review", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
  }
  if (task.reviewStatus === "REVISION_REQUESTED") {
    return { label: "⚠️ Perlu Revisi", color: "bg-rose-100 text-rose-800 border-rose-300" };
  }
  if (task.status === "COMPLETED" || task.reviewStatus === "APPROVED") {
    return { label: "✓ Selesai", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  if (task.status === "IN_PROGRESS") {
    return { label: "⚡ Dikerjakan", color: "bg-blue-100 text-blue-800 border-blue-300" };
  }
  if (task.status === "BLOCKED") {
    return { label: "⛔ Terkendala", color: "bg-red-100 text-red-800 border-red-300" };
  }
  return { label: "Antrean", color: "bg-slate-100 text-slate-700 border-slate-200" };
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [office, setOffice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowRetakePhoto, setAllowRetakePhoto] = useState<boolean>(true);

  // Modals
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraModalType, setCameraModalType] = useState<"CLOCK_IN" | "CLOCK_OUT" | "RETAKE_CLOCK_IN">("CLOCK_IN");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewType, setPhotoViewType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Overtime Confirmation Modal & Settings
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [isSubmittingOvertime, setIsSubmittingOvertime] = useState(false);
  const [startTimeChoice, setStartTimeChoice] = useState<"NOW" | "FROM_SHIFT_END">("FROM_SHIFT_END");
  const [overtimeNotes, setOvertimeNotes] = useState("");

  // Timers
  const [shiftDurationStr, setShiftDurationStr] = useState<string>("00:00:00");
  const [overtimeDurationStr, setOvertimeDurationStr] = useState<string>("00:00:00");
  const [hasShownOvertimePrompt, setHasShownOvertimePrompt] = useState(false);

  // Dashboard Informasi Penting (Semua Tugas, Tugas Pribadi, Tugas Reminded)
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState<"ALL" | "INDIVIDU" | "REMINDED">("ALL");

  // Detail & Action Modals for Task Thumbnails
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [revisionModalTask, setRevisionModalTask] = useState<any | null>(null);
  const [deliverableModalTask, setDeliverableModalTask] = useState<any | null>(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState<any | null>(null);

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
        if (attData.features && typeof attData.features.allowRetakeClockInPhoto === "boolean") {
          setAllowRetakePhoto(attData.features.allowRetakeClockInPhoto);
        }
        if (attData.tasks) {
          setTasks(attData.tasks);
        }
      }

      const tasksRes = await fetch("/api/tasks");
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }

      // Fetch Workspace Collaborative Tasks
      const wRes = await fetch("/api/workspace/tasks");
      if (wRes.ok) {
        const wData = await wRes.json();
        setWorkspaceTasks(wData.tasks || []);
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

      // Trigger Overtime Prompt when shift reaches standard work duration
      const regularMinutes = todayAttendance.regularWorkMinutes || (office?.standardWorkDurationHours ? office.standardWorkDurationHours * 60 : 480);
      const regularSeconds = regularMinutes * 60;

      if (
        diffSec >= regularSeconds &&
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
  }, [todayAttendance, hasShownOvertimePrompt, office]);

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
  const isWFA = todayAttendance?.attendanceType === "WFA";

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

  const getShiftEndWIB = () => {
    if (!todayAttendance?.clockInTime) return "-";
    const cin = new Date(todayAttendance.clockInTime);
    const regularMinutes = todayAttendance.regularWorkMinutes || (office?.standardWorkDurationHours ? office.standardWorkDurationHours * 60 : 480);
    const shiftEnd = new Date(cin.getTime() + regularMinutes * 60 * 1000);
    return shiftEnd.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  // Overtime Actions
  const handleStartOvertime = async (choice?: "NOW" | "FROM_SHIFT_END", note?: string) => {
    setIsSubmittingOvertime(true);
    const finalChoice = choice || startTimeChoice;
    const finalNote = note !== undefined ? note : overtimeNotes;

    try {
      const res = await fetch("/api/attendance/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START_OVERTIME",
          startTimeChoice: finalChoice,
          notes: finalNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodayAttendance(data.attendance);
      setOvertimeModalOpen(false);
      setOvertimeNotes("");
      alert(
        finalChoice === "FROM_SHIFT_END"
          ? "Sesi lembur aktif terhitung sejak selesai shift 8 jam. Selamat bertugas!"
          : "Sesi lembur resmi dimulai sekarang. Selamat bertugas!"
      );
      fetchSessionData();
    } catch (err: any) {
      alert("Gagal memulai lembur: " + err.message);
    } finally {
      setIsSubmittingOvertime(false);
    }
  };

  const handleDeclineOvertime = async () => {
    if (!confirm("Apakah Anda yakin ingin menyelesaikan shift reguler 8 jam dan presensi pulang?")) return;
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
      fetchSessionData();
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
      alert(data.message || "Sesi lembur selesai dan tercatat resmi!");
      fetchSessionData();
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
        <Sidebar role={user.role} department={user.department} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner with Taharica Red & Blue Gradient */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-red-600" />
                <span>Portal Presensi Difitech HRIS</span>
                {isWFA && (
                  <span className="ml-2 rounded-full bg-cyan-100 text-cyan-800 px-2.5 py-0.5 text-[10px] font-extrabold border border-cyan-200">
                    🏠 WFA / Remote
                  </span>
                )}
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
                    onClick={() => {
                      setStartTimeChoice("NOW");
                      setOvertimeModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                  >
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span>Ajukan Lembur</span>
                  </button>

                  <button
                    onClick={handleOpenClockOut}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Presensi Pulang (CamStamp)</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      Shift Hari Ini Selesai{" "}
                      {todayAttendance?.overtimeMinutes > 0
                        ? `(Lembur: ${Math.round(todayAttendance.overtimeMinutes / 60)}j)`
                        : ""}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStartTimeChoice("FROM_SHIFT_END");
                      setOvertimeModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition cursor-pointer active:scale-95"
                    title="Mulai atau ajukan sesi lembur malam ini"
                  >
                    <Zap className="h-4 w-4 text-amber-100" />
                    <span>Ajukan Lembur Malam</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifikasi Review Gate: Tugas yang Didelegasikan Menunggu Review */}
          {workspaceTasks.filter((t) => t.creator?.id === user?.id && (t.reviewStatus === "TO_BE_REVIEWED" || t.reviewStatus === "UNDER_REVIEW")).length > 0 && (
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-amber-950">
                      {workspaceTasks.filter((t) => t.creator?.id === user?.id && (t.reviewStatus === "TO_BE_REVIEWED" || t.reviewStatus === "UNDER_REVIEW")).length} Tugas Delegasi Anda Telah Selesai & Menunggu Review!
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Pengerja telah mengunggah hasil kerja. Silakan periksa hasil kerja, ajukan catatan revisi (dengan screenshot jika ada), atau klik ACC untuk menyelesaikan tugas.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/workspace"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <span>Buka Lembar Kerja Divisi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {workspaceTasks
                  .filter((t) => t.creator?.id === user?.id && (t.reviewStatus === "TO_BE_REVIEWED" || t.reviewStatus === "UNDER_REVIEW"))
                  .slice(0, 4)
                  .map((rt) => (
                    <div
                      key={rt.id}
                      className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="font-bold text-amber-700 uppercase bg-amber-100 px-1.5 py-0.2 rounded">
                            {rt.departmentCard || "Tugas"}
                          </span>
                          <span className="text-slate-500 truncate">
                            Pengerja: <strong className="text-slate-800">{rt.user?.name}</strong>
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate mt-1">{rt.title}</h5>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {rt.deliverableUrl && (
                          <a
                            href={rt.deliverableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition"
                          >
                            Bukti ↗
                          </a>
                        )}
                        <Link
                          href={`/dashboard/workspace?card=${rt.departmentCard || ""}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition shadow-2xs"
                        >
                          Review & ACC
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
                      ? `AKTIF BEKERJA (${((todayAttendance?.regularWorkMinutes || 480) / 60).toFixed(todayAttendance?.regularWorkMinutes % 60 !== 0 ? 1 : 0)} JAM)`
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

              {isClockedOut && !isOvertime && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Ingin lanjut lembur malam ini?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStartTimeChoice("FROM_SHIFT_END");
                      setOvertimeModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 transition cursor-pointer"
                  >
                    ⚡ Ajukan Lembur
                  </button>
                </div>
              )}
            </div>

            {/* Geofence / Lokasi Penugasan / WFA */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Lokasi Penugasan</span>
                  {isWFA ? (
                    <span className="text-cyan-600 font-bold text-sm">🏠</span>
                  ) : isClientVisit ? (
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-blue-600" />
                  )}
                </div>

                <div className="mt-3">
                  {isWFA ? (
                    <>
                      <h4 className="text-sm font-bold text-cyan-900">Work From Anywhere (WFA)</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {todayAttendance?.clientName || todayAttendance?.clockInAddress || "Lokasi remote terverifikasi CamStamp GPS"}
                      </p>
                    </>
                  ) : isClientVisit ? (
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
                <span className="text-slate-500">{isWFA ? "Tipe Kerja:" : isClientVisit ? "Status Dinas:" : "Radius Kantor:"}</span>
                <span className={`font-mono font-bold ${isWFA ? "text-cyan-700 font-bold" : isClientVisit ? "text-purple-600" : "text-blue-600"}`}>
                  {isWFA ? "Bebas Geofence (WFA)" : isClientVisit ? "Terverifikasi Klien" : `${office?.radiusMeters || 150} meter`}
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
                  {allowRetakePhoto && (
                    <button
                      onClick={() => {
                        setCameraModalType("RETAKE_CLOCK_IN");
                        setCameraModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                      title="Ambil ulang foto selfie presensi masuk dengan tetap memakai stempel jam masuk pagi"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Foto Ulang Masuk</span>
                    </button>
                  )}

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

          {/* Dashboard Informasi Tugas & Reminded: Thumbnail Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Dashboard Informasi Tugas & Reminded
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pantau ringkasan tugas terkini, tugas pribadi, serta tugas yang di-follow up.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/tasks"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-red-600" />
                  <span>Papan Tugas (Kanban)</span>
                </Link>
                <a
                  href="https://difworkboard.difitech.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  <span>DifWorkBoard ↗</span>
                </a>
              </div>
            </div>

            {/* Sub-tabs: Semua Tugas, Tugas Pribadi, Tugas Reminded */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setWorkspaceTab("ALL")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  workspaceTab === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Semua Tugas</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                    workspaceTab === "ALL" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {workspaceTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab("INDIVIDU")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  workspaceTab === "INDIVIDU"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tugas Pribadi</span>
                {workspaceTasks.filter((t) => t.userId === user?.id && t.status !== "COMPLETED").length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                      workspaceTab === "INDIVIDU" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {workspaceTasks.filter((t) => t.userId === user?.id && t.status !== "COMPLETED").length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab("REMINDED")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  workspaceTab === "REMINDED"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-rose-700 hover:text-rose-900"
                }`}
              >
                <BellRing className="h-3 w-3" />
                <span>Tugas Reminded</span>
                {workspaceTasks.filter((t) => t.followUps && t.followUps.length > 0).length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                      workspaceTab === "REMINDED" ? "bg-white text-rose-700" : "bg-rose-200 text-rose-900"
                    }`}
                  >
                    {workspaceTasks.filter((t) => t.followUps && t.followUps.length > 0).length}
                  </span>
                )}
              </button>
            </div>

            {/* List of Tasks for Selected Tab as Compact Card Thumbnails */}
            {(() => {
              let displayList: any[] = [];
              if (workspaceTab === "ALL") {
                displayList = [...workspaceTasks];
              } else if (workspaceTab === "INDIVIDU") {
                displayList = workspaceTasks.filter((t) => t.userId === user?.id && t.status !== "COMPLETED");
              } else if (workspaceTab === "REMINDED") {
                displayList = workspaceTasks.filter((t) => t.followUps && t.followUps.length > 0);
              }

              displayList.sort((a, b) => {
                const aDone = a.status === "COMPLETED" || a.reviewStatus === "APPROVED";
                const bDone = b.status === "COMPLETED" || b.reviewStatus === "APPROVED";
                if (aDone !== bDone) return aDone ? 1 : -1;
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              });

              if (displayList.length === 0) {
                return (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      {workspaceTab === "INDIVIDU"
                        ? "Tidak ada tugas pribadi yang aktif saat ini."
                        : workspaceTab === "REMINDED"
                        ? "Bagus! Belum ada tugas yang mandek atau perlu di-follow up."
                        : "Belum ada tugas kolaborasi yang terdaftar."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {displayList.slice(0, 8).map((task) => {
                      const dept = DEPT_BADGES[task.departmentCard] || {
                        label: task.departmentCard || "GENERAL",
                        color: "bg-slate-100 text-slate-700 border-slate-200",
                      };
                      const statusBadge = getCardStatusBadge(task);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-400 hover:shadow-xs transition cursor-pointer space-y-2.5"
                        >
                          <div className="space-y-1.5">
                            {/* Card Top: Department Badge & Status Badge */}
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span
                                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${dept.color}`}
                              >
                                {dept.label}
                              </span>

                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${statusBadge.color}`}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Task Title */}
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {task.title}
                            </h4>

                            {/* Reminded Notice if follow-ups exist */}
                            {task.followUps && task.followUps.length > 0 && (
                              <div className="rounded bg-amber-50 border border-amber-200/80 px-2 py-1 flex items-center gap-1.5 text-[10px] text-amber-800">
                                <BellRing className="h-3 w-3 text-amber-600 shrink-0" />
                                <span className="truncate italic">
                                  {task.followUps[0].sender?.name ? `${task.followUps[0].sender.name}: ` : ""}
                                  "{task.followUps[0].message || "Tolong di-follow up"}"
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer Info: PIC & Due Date */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <div className="flex items-center gap-1.5 truncate pr-1">
                              <div className="h-4 w-4 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-[8px] shrink-0">
                                {(task.user?.name || "U")[0]}
                              </div>
                              <span className="truncate font-medium text-slate-700">
                                {task.user?.name || "Belum ada PIC"}
                              </span>
                            </div>

                            <span className="shrink-0 font-mono text-[9px] text-slate-400">
                              {task.expectedDeadline
                                ? new Date(task.expectedDeadline).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "Fleksibel"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Link / Counter */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <p>
                      Menampilkan <span className="font-bold text-slate-800">{Math.min(displayList.length, 8)}</span> dari{" "}
                      <span className="font-bold text-slate-800">{displayList.length}</span> tugas
                    </p>
                    <Link
                      href="/dashboard/tasks"
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      <span>Lihat Semua di Papan Tugas (Kanban)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {/* Overtime Confirmation & Application Modal */}
      {overtimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isClockedOut ? "Ajukan Sesi Lembur (Overtime)" : "Konfirmasi Lembur (Overtime)"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isClockedOut
                      ? "Shift reguler 8 jam telah selesai, Anda dapat mengaktifkan lembur"
                      : "Shift reguler 8 jam kerja Anda telah selesai"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOvertimeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Tutup (Nanti Saja)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between text-[11px] border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Presensi Masuk Hari Ini:</span>
                <span className="font-mono font-bold text-slate-800">
                  {todayAttendance?.clockInTime
                    ? new Date(todayAttendance.clockInTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Batas Selesai Shift 8 Jam:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {getShiftEndWIB()}
                </span>
              </div>
            </div>

            {/* Pilihan Waktu Mulai Lembur */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pilih Waktu Mulai Lembur:
              </label>

              <label
                className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                  startTimeChoice === "FROM_SHIFT_END"
                    ? "border-amber-500 bg-amber-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="startTimeChoice"
                  value="FROM_SHIFT_END"
                  checked={startTimeChoice === "FROM_SHIFT_END"}
                  onChange={() => setStartTimeChoice("FROM_SHIFT_END")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🕒 Hitung Sejak Selesai 8 Jam ({getShiftEndWIB()})</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Sangat cocok jika tadi sore Anda tidak sempat klik lembur dan sudah lanjut bekerja hingga malam ini.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                  startTimeChoice === "NOW"
                    ? "border-amber-500 bg-amber-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="startTimeChoice"
                  value="NOW"
                  checked={startTimeChoice === "NOW"}
                  onChange={() => setStartTimeChoice("NOW")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900">
                    ⚡ Mulai dari Sekarang (Live Tracker)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Timer stopwatch lembur baru akan mulai berjalan aktif dari detik ini.
                  </p>
                </div>
              </label>
            </div>

            {/* Catatan Keperluan Lembur */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Keterangan / Keperluan Lembur (Opsional):
              </label>
              <input
                type="text"
                value={overtimeNotes}
                onChange={(e) => setOvertimeNotes(e.target.value)}
                placeholder="Contoh: Menyelesaikan tugas website & testing"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOvertimeModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Nanti Saja
              </button>

              {!isClockedOut && (
                <button
                  type="button"
                  onClick={handleDeclineOvertime}
                  disabled={isSubmittingOvertime}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Selesai 8 Jam & Pulang
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStartOvertime(startTimeChoice, overtimeNotes)}
                disabled={isSubmittingOvertime}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-700 transition cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>{isSubmittingOvertime ? "Memproses..." : "Aktifkan Lembur"}</span>
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
        lockedTimestampIso={cameraModalType === "RETAKE_CLOCK_IN" ? todayAttendance?.clockInTime : undefined}
      />

      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        attendance={todayAttendance}
        viewType={photoViewType}
      />

      {/* Task Detail & Collaborative Actions Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          task={selectedTaskForDetail}
          currentUser={user}
          onUpdate={fetchSessionData}
          onOpenDeliverableModal={(t) => setDeliverableModalTask(t)}
          onOpenRevisionModal={(t) => setRevisionModalTask(t)}
          onOpenDeadlineModal={(t) => setDeadlineModalTask(t)}
        />
      )}

      {/* Request Revision Modal */}
      {revisionModalTask && (
        <RequestRevisionModal
          isOpen={!!revisionModalTask}
          onClose={() => setRevisionModalTask(null)}
          taskId={revisionModalTask.id}
          taskTitle={revisionModalTask.title}
          brandName={revisionModalTask.brandName || "Umum"}
          onSuccess={fetchSessionData}
        />
      )}

      {/* Submit Deliverable Modal */}
      {deliverableModalTask && (
        <SubmitDeliverableModal
          isOpen={!!deliverableModalTask}
          onClose={() => setDeliverableModalTask(null)}
          taskId={deliverableModalTask.id}
          taskTitle={deliverableModalTask.title}
          onSuccess={fetchSessionData}
        />
      )}

      {/* Deadline Suggestion Modal */}
      {deadlineModalTask && (
        <DeadlineSuggestionModal
          isOpen={!!deadlineModalTask}
          onClose={() => setDeadlineModalTask(null)}
          taskId={deadlineModalTask.id}
          taskTitle={deadlineModalTask.title}
          currentExpectedDeadline={deadlineModalTask.expectedDeadline}
          onSuccess={fetchSessionData}
        />
      )}
    </div>
  );
}
