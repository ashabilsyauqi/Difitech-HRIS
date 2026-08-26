"use client";

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
} from "lucide-react";

export default function ManagerTeamTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      // Fetch all tasks
      const tasksRes = await fetch("/api/tasks");
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }

      // Fetch employee list for filter dropdown
      const empRes = await fetch("/api/manager/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setUsersList(empData.employees || []);
      }
    } catch (err) {
      console.error("Team tasks error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const filteredTasks = tasks.filter((t) => {
    const matchesUser = selectedUser === "ALL" || t.userId === selectedUser;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user?.name && t.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesUser && matchesStatus && matchesSearch;
  });

  const totalEst = filteredTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const totalAct = filteredTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);

  const columnConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    PENDING: { label: "Belum Dikerjakan", bg: "bg-slate-100", text: "text-slate-700", icon: Clock },
    IN_PROGRESS: { label: "Sedang Berjalan", bg: "bg-blue-100", text: "text-blue-800", icon: PlayCircle },
    COMPLETED: { label: "Selesai (Deliverables)", bg: "bg-emerald-100", text: "text-emerald-800", icon: CheckCircle2 },
    BLOCKED: { label: "Terkendala (Blocked)", bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/50 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Users className="h-4 w-4" />
                <span>Pengawasan Operasional Tugas Tim Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Matriks Tugas Lintas Departemen
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pantau rencana jam kerja, progres deliverable, dan hambatan tim secara terpusat.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-3 text-xs shadow-2xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Total Rencana</p>
                <p className="font-mono font-bold text-slate-800">{totalEst.toFixed(1)} jam</p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Total Realisasi</p>
                <p className="font-mono font-bold text-emerald-700">{totalAct.toFixed(1)} jam</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tugas atau nama karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Karyawan</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department || "Umum"})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Belum Dikerjakan</option>
                <option value="IN_PROGRESS">Sedang Berjalan</option>
                <option value="COMPLETED">Selesai (Deliverables)</option>
                <option value="BLOCKED">Terkendala</option>
              </select>
            </div>
          </div>

          {/* Kanban Overview Matrix */}
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
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${conf.bg} ${conf.text}`}
                      >
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
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-800">👤 {task.user?.name || "Karyawan"}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-600">
                              {task.category}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h5>

                          {task.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {task.deliverableUrl && (
                            <a
                              href={task.deliverableUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-semibold"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              <span>Buka Link Hasil Kerja</span>
                            </a>
                          )}

                          {task.completionNote && (
                            <p className="text-[10px] text-emerald-800 bg-emerald-50 rounded p-1.5 border border-emerald-200 leading-tight">
                              &ldquo;{task.completionNote}&rdquo;
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Est: {task.estimatedHours} jam</span>
                            {task.actualHours && <span className="text-slate-800 font-bold">Real: {task.actualHours} jam</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
