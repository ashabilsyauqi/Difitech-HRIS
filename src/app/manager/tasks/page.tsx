"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Sparkles,
  Calendar,
  Filter,
  Layers,
  Table as TableIcon,
  Tag,
  Timer,
  FileCheck,
  Building,
  Check,
} from "lucide-react";

export default function ManagerTeamTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: Table vs Kanban
  const [viewMode, setViewMode] = useState<"TABLE" | "KANBAN">("TABLE");

  // Date Range Filters
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState<"TODAY" | "WEEK" | "MONTH" | "ALL">("TODAY");

  // Attribute Filters
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchData = async () => {
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

      // Fetch employee list for filter dropdown
      const empRes = await fetch("/api/manager/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setUsersList(empData.employees || []);
      }

      // Fetch tasks with query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedUser !== "ALL") params.append("userId", selectedUser);
      if (selectedBrand !== "ALL") params.append("category", selectedBrand);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const tasksRes = await fetch(`/api/tasks?${params.toString()}`);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Team tasks error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedUser, selectedBrand, selectedStatus]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Matriks Tugas Tim Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  // Extract unique brands dynamically
  const uniqueBrands = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));

  const filteredTasks = tasks.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.category && t.category.toLowerCase().includes(query)) ||
      (t.user?.name && t.user.name.toLowerCase().includes(query)) ||
      (t.user?.email && t.user.email.toLowerCase().includes(query));

    const matchesUser =
      selectedUser === "ALL" ||
      t.userId === selectedUser ||
      t.user?.id === selectedUser ||
      t.user?.email === selectedUser;

    const matchesBrand =
      selectedBrand === "ALL" ||
      t.category === selectedBrand ||
      (t.category && t.category.toLowerCase() === selectedBrand.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || t.status === selectedStatus;

    let matchesDate = true;
    const taskDate = t.attendance?.date || (t.createdAt ? t.createdAt.split("T")[0] : "");
    if (startDate && endDate) {
      matchesDate = taskDate >= startDate && taskDate <= endDate;
    } else if (startDate) {
      matchesDate = taskDate >= startDate;
    } else if (endDate) {
      matchesDate = taskDate <= endDate;
    }

    return matchesSearch && matchesUser && matchesBrand && matchesStatus && matchesDate;
  });

  // Calculate Summary Metrics
  const totalTasksCount = filteredTasks.length;
  const inProgressCount = filteredTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedCount = filteredTasks.filter((t) => t.status === "COMPLETED").length;
  const totalEst = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const totalAct = filteredTasks.reduce(
    (acc, t) => acc + (t.actualHours || (t.trackedSeconds ? t.trackedSeconds / 3600 : 0)),
    0
  );

  const columnConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    PENDING: { label: "Belum Dikerjakan", bg: "bg-slate-100", text: "text-slate-700", icon: Clock },
    IN_PROGRESS: { label: "Sedang Berjalan", bg: "bg-blue-100", text: "text-blue-800", icon: PlayCircle },
    COMPLETED: { label: "Selesai (Deliverables)", bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle2 },
    BLOCKED: { label: "Terkendala (Blocked)", bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
  };

  const getTimelinessStatus = (task: any) => {
    const act = task.actualHours || (task.trackedSeconds ? task.trackedSeconds / 3600 : 0);
    const est = task.estimatedHours || 1;

    if (task.status === "COMPLETED") {
      if (act <= est) {
        return {
          label: "Tepat Waktu",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
          icon: CheckCircle2,
        };
      }
      return {
        label: "Melebihi Estimasi (Overdue)",
        badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
        icon: AlertCircle,
      };
    }

    if (task.status === "IN_PROGRESS") {
      if (act > est) {
        return {
          label: "Sedang Berjalan (Overdue)",
          badge: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse",
          icon: Timer,
        };
      }
      return {
        label: "Sedang Berjalan",
        badge: "bg-blue-50 text-blue-800 border-blue-200 font-bold animate-pulse",
        icon: PlayCircle,
      };
    }

    if (task.status === "BLOCKED") {
      return {
        label: "Terkendala",
        badge: "bg-red-50 text-red-700 border-red-200 font-bold",
        icon: AlertCircle,
      };
    }

    return {
      label: "Belum Selesai (Backlog)",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      icon: Clock,
    };
  };

  const formatSeconds = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}j ${minutes}m`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/60 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Users className="h-4 w-4" />
                <span>Pengawasan Operasional Tugas & Kinerja Karyawan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Daftar & Riwayat Tugas Harian Tim
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pantau riwayat pengerjaan tugas per karyawan, status ketepatan waktu (*on time* / melebihi estimasi), dan link deliverable.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "TABLE"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tabel Riwayat</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("KANBAN")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === "KANBAN"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Papan Kanban</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tugas</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalTasksCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Tugas terdaftar</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Sedang Berjalan</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{inProgressCount}</p>
              <p className="text-[10px] text-blue-600 mt-0.5">Live time tracker aktif</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tugas Tuntas</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{completedCount}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {totalTasksCount > 0 ? `${Math.round((completedCount / totalTasksCount) * 100)}% selesai` : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Total Jam Nyata</p>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {totalAct.toFixed(1)} <span className="text-sm font-semibold">Jam</span>
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Rencana: {totalEst.toFixed(1)} jam</p>
            </div>
          </div>

          {/* Filter Bar with Date Range Presets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-red-600" />
                <span className="text-xs font-bold text-slate-800">Filter Riwayat & Rentang Waktu Tugas:</span>
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

              {/* Brand Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Brand / Klien
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Brand ({uniqueBrands.length})</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Cari Judul / Tugas
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Judul atau brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT: TABLE VIEW VS KANBAN VIEW */}
          {viewMode === "TABLE" ? (
            /* TABLE LIST VIEW */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Karyawan & Tanggal</th>
                      <th className="px-4 py-4">Brand / Klien</th>
                      <th className="px-5 py-4">Judul & Deskripsi Tugas</th>
                      <th className="px-4 py-4">Status Pengerjaan</th>
                      <th className="px-4 py-4">Ketepatan Waktu</th>
                      <th className="px-4 py-4">Rencana vs Realisasi</th>
                      <th className="px-4 py-4">Deliverables & Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400">
                          <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          Tidak ada tugas pada filter atau rentang waktu yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const timeliness = getTimelinessStatus(task);
                        const actualHours = task.actualHours || (task.trackedSeconds ? task.trackedSeconds / 3600 : 0);
                        const taskDate = task.attendance?.date || task.createdAt?.split("T")[0] || "-";

                        return (
                          <tr key={task.id} className="hover:bg-slate-50/80 transition">
                            {/* Karyawan & Tanggal */}
                            <td className="px-5 py-4">
                              <div className="font-mono text-[11px] font-bold text-slate-900 mb-1">
                                📅 {taskDate}
                              </div>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex-shrink-0">
                                  {task.user?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{task.user?.name || "Karyawan"}</div>
                                  <div className="text-[10px] text-slate-400">{task.user?.department || "Umum"}</div>
                                </div>
                              </div>
                            </td>

                            {/* Brand / Klien */}
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
                                <Tag className="h-3 w-3 text-red-600" />
                                <span>{task.category || "Difitech"}</span>
                              </span>
                            </td>

                            {/* Judul & Deskripsi Tugas */}
                            <td className="px-5 py-4 max-w-[280px]">
                              <div className="font-bold text-slate-900 text-xs leading-snug">{task.title}</div>
                              {task.description && (
                                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </div>
                              )}
                            </td>

                            {/* Status Pengerjaan */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  task.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                                    : task.status === "BLOCKED"
                                    ? "bg-red-100 text-red-800 border border-red-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {task.status === "COMPLETED"
                                  ? "Selesai"
                                  : task.status === "IN_PROGRESS"
                                  ? "Sedang Berjalan ⚡"
                                  : task.status === "BLOCKED"
                                  ? "Terkendala"
                                  : "Belum Dikerjakan"}
                              </span>
                            </td>

                            {/* Ketepatan Waktu */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] ${timeliness.badge}`}>
                                <timeliness.icon className="h-3 w-3 flex-shrink-0" />
                                <span>{timeliness.label}</span>
                              </span>
                            </td>

                            {/* Rencana vs Realisasi */}
                            <td className="px-4 py-4 font-mono text-xs">
                              <div className="text-slate-500 text-[11px]">
                                Rencana: <span className="font-bold text-slate-800">{task.estimatedHours || 1}j</span>
                              </div>
                              <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                                Nyata: {actualHours.toFixed(1)}j {task.isTracking ? "⚡ Live" : ""}
                              </div>
                            </td>

                            {/* Deliverables & Bukti */}
                            <td className="px-4 py-4">
                              {task.deliverableUrl ? (
                                <a
                                  href={task.deliverableUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Lihat Bukti Kerja</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Belum ada link</span>
                              )}
                              {task.completionNote && (
                                <div className="text-[10px] text-emerald-800 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200 mt-1 line-clamp-1">
                                  {task.completionNote}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* KANBAN MATRIX OVERVIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"].map((status) => {
                const columnTasks = filteredTasks.filter((t) => t.status === status);
                const conf = columnConfig[status];
                const StatusIcon = conf.icon;

                return (
                  <div
                    key={status}
                    className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3.5 space-y-3 min-h-[440px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-4 w-4 text-slate-500" />
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${conf.bg} ${conf.text}`}>
                          {conf.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-700 font-bold bg-white border border-slate-200 rounded-full px-2 py-0.5">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                      {columnTasks.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Tidak ada tugas di kolom ini
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const timeliness = getTimelinessStatus(task);
                          return (
                            <div
                              key={task.id}
                              className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs hover:border-slate-300 transition"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-800">👤 {task.user?.name || "Karyawan"}</span>
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-700 font-bold">
                                  {task.category || "Difitech"}
                                </span>
                              </div>

                              <h5 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h5>

                              {task.description && (
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              <div className="pt-1 flex items-center justify-between text-[10px]">
                                <span className={`rounded-full border px-2 py-0.5 ${timeliness.badge}`}>
                                  {timeliness.label}
                                </span>
                                <span className="font-mono font-bold text-slate-700">
                                  {(task.actualHours || (task.trackedSeconds ? task.trackedSeconds / 3600 : 0)).toFixed(1)}j / {task.estimatedHours}j
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
