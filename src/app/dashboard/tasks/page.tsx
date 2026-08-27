"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TaskKanbanBoard from "@/components/Tasks/TaskKanbanBoard";
import TaskFormModal, { TaskItem } from "@/components/Tasks/TaskFormModal";
import { Plus, CheckSquare, Search, Calendar, History, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EmployeeTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Daily Fresh Sheet Date
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  const fetchSessionAndTasks = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);

      const tasksRes = await fetch(`/api/tasks?date=${selectedDate}`);
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks);
      }
    } catch (err) {
      console.error("Task page error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndTasks();
  }, [selectedDate]);

  const handleStatusChange = async (taskId: string, newStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchSessionAndTasks();
    }
  };

  const handleSaveTask = async (taskData: Partial<TaskItem>) => {
    try {
      if (taskData.id) {
        const res = await fetch(`/api/tasks/${taskData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!res.ok) throw new Error("Gagal mengubah tugas");
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...taskData, targetDate: selectedDate }),
        });
        if (!res.ok) throw new Error("Gagal membuat tugas baru");
      }
      await fetchSessionAndTasks();
    } catch (err) {
      console.error("Save task error:", err);
      throw err;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete task error:", err);
      fetchSessionAndTasks();
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Papan Tugas Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesPriority = selectedPriority === "ALL" || t.priority === selectedPriority;
    return matchesSearch && matchesCat && matchesPriority;
  });

  const uniqueBrands = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <CheckSquare className="h-4 w-4" />
                <span>Lembar Kerja Aktivitas Harian Difitech</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Papan Tugas Harian Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Setiap hari adalah lembar tugas baru. Jalankan time tracker langsung pada tugas yang sedang aktif.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/tasks/history"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <History className="h-4 w-4 text-blue-600" />
                <span>Arsip & Riwayat Tugas</span>
              </Link>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setFormModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Daftarkan Tugas Baru</span>
              </button>
            </div>
          </div>

          {/* Date Selector & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            {/* Daily Fresh Sheet Date Navigator */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-slate-700">Lembar Tanggal:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none"
              />
              {selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="rounded-lg bg-red-50 text-red-700 px-2.5 py-1 text-[11px] font-bold hover:bg-red-100 transition"
                >
                  Kembali ke Hari Ini
                </button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Brand</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="LOW">Rendah</option>
                <option value="MEDIUM">Sedang</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak ⚡</option>
              </select>
            </div>
          </div>

          {/* Kanban Board Component */}
          <TaskKanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onEditTask={(task) => {
              setEditingTask(task);
              setFormModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onAddTask={() => {
              setEditingTask(null);
              setFormModalOpen(true);
            }}
            onRefresh={fetchSessionAndTasks}
          />
        </main>
      </div>

      <TaskFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialData={editingTask}
      />
    </div>
  );
}
