"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  History,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Search,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

export default function EmployeeTaskHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchHistory = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const historyRes = await fetch("/api/tasks/history");
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Task history fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Arsip & Riwayat Tugas Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter((group) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      group.date.includes(q) ||
      group.tasks.some(
        (t: any) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
    );
  });

  const totalOverallTasks = history.reduce((acc, g) => acc + g.tasks.length, 0);
  const totalCompletedTasks = history.reduce((acc, g) => acc + g.completedCount, 0);
  const totalActualHours = history.reduce((acc, g) => acc + g.totalActualHours, 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center gap-1 hover:underline text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali ke Papan Harian</span>
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <History className="h-3.5 w-3.5" />
                  <span>Logbook Kinerja Historis</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Arsip Rekam Tugas & Produktivitas Harian
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh rekaman tugas, durasi time tracker, dan bukti deliverable hasil kerja yang telah Anda tuntaskan.
              </p>
            </div>

            {/* Metrics Widget */}
            <div className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tugas Selesai</p>
                <p className="font-mono font-black text-emerald-700">{totalCompletedTasks}/{totalOverallTasks}</p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Jam Kerja Nyata</p>
                <p className="font-mono font-black text-blue-700">{totalActualHours.toFixed(1)} Jam</p>
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari arsip riwayat tugas berdasarkan judul, tanggal, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-5">
            {filteredHistory.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-400">
                <CheckSquare className="h-8 w-8 text-slate-300 mb-2" />
                <p>Belum ada rekaman riwayat tugas yang sesuai.</p>
              </div>
            ) : (
              filteredHistory.map((group) => {
                const dateObj = new Date(group.date + "T00:00:00");
                const formattedDate = dateObj.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={group.date}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                  >
                    {/* Date Block Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <span className="font-bold text-slate-900">{formattedDate}</span>
                        <span className="font-mono text-[10px] text-slate-400">({group.date})</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-600">
                          {group.completedCount}/{group.tasks.length} Selesai
                        </span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Real: {group.totalActualHours.toFixed(1)} Jam
                        </span>
                      </div>
                    </div>

                    {/* Task List in this Date */}
                    <div className="divide-y divide-slate-100 p-2 sm:p-3">
                      {group.tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-slate-50/60 rounded-xl transition"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span
                                className={`rounded-full px-2 py-0.5 font-bold ${
                                  task.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {task.status === "COMPLETED" ? "Selesai" : task.status === "IN_PROGRESS" ? "Berjalan" : "Backlog"}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-slate-600">
                                {task.category}
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900">{task.title}</h5>

                            {task.description && (
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {task.completionNote && (
                              <p className="text-[10px] text-emerald-800 bg-emerald-50 rounded px-2 py-1 border border-emerald-200">
                                Catatan Hasil: &ldquo;{task.completionNote}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                            <div className="text-right font-mono text-[11px] text-slate-500">
                              <span>Est: {task.estimatedHours}j</span> •{" "}
                              <span className="font-bold text-slate-800">
                                Real: {task.actualHours || (task.trackedSeconds ? (task.trackedSeconds / 3600).toFixed(1) : 0)}j
                              </span>
                            </div>

                            {task.deliverableUrl && (
                              <a
                                href={task.deliverableUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Bukti Deliverable</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
