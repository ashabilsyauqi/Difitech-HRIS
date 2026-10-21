"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import DeadlineSuggestionModal from "@/components/Tasks/DeadlineSuggestionModal";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import {
  Inbox,
  Play,
  CheckCircle2,
  Clock,
  Calendar,
  Tag,
  User,
  Plus,
  Search,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function MyTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"INBOX" | "IN_PROGRESS" | "COMPLETED">("INBOX");
  const [tasks, setTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState({ inbox: 0, inProgress: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deadlineModalTask, setDeadlineModalTask] = useState<any | null>(null);
  const [deliverableModalTask, setDeliverableModalTask] = useState<any | null>(null);
  const [revisionModalTask, setRevisionModalTask] = useState<any | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("myTasksTab", activeTab);
      if (selectedBrand !== "ALL") params.set("brandName", selectedBrand);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/workspace/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch my tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/workspace/metadata");
      if (res.ok) {
        const data = await res.json();
        setAvailableBrands(data.brands || []);
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [activeTab, selectedBrand, searchQuery]);

  const handleStartTask = async (taskId: string) => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  const handleRespondSuggestion = async (taskId: string, action: "ACCEPT" | "REJECT") => {
    try {
      await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondDeadlineSuggestion: { action } }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to respond to suggestion:", err);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Tidak ada";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                  Personal Desk
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-500">Auto-Sync HRIS</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Tugas Pribadi
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola daftar tugas masuk, proses pengerjaan, dan arsip tugas selesai Anda
              </p>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>

          {/* 3 Main Tabs (Masuk, Dikerjakan, Selesai) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveTab("INBOX")}
              className={`flex items-center justify-between p-4 rounded-2xl border transition text-left cursor-pointer ${
                activeTab === "INBOX"
                  ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeTab === "INBOX" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Tugas Masuk</h4>
                  <p className="text-[11px] text-slate-500">Menunggu dikerjakan</p>
                </div>
              </div>
              <span className={`text-lg font-black ${activeTab === "INBOX" ? "text-blue-700" : "text-slate-700"}`}>
                {counts.inbox}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={`flex items-center justify-between p-4 rounded-2xl border transition text-left cursor-pointer ${
                activeTab === "IN_PROGRESS"
                  ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeTab === "IN_PROGRESS" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-600"}`}>
                  <Play className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Sedang Dikerjakan</h4>
                  <p className="text-[11px] text-slate-500">Dalam proses aktif</p>
                </div>
              </div>
              <span className={`text-lg font-black ${activeTab === "IN_PROGRESS" ? "text-amber-700" : "text-slate-700"}`}>
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("COMPLETED")}
              className={`flex items-center justify-between p-4 rounded-2xl border transition text-left cursor-pointer ${
                activeTab === "COMPLETED"
                  ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeTab === "COMPLETED" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Tugas Selesai</h4>
                  <p className="text-[11px] text-slate-500">Tersubmit & disetujui</p>
                </div>
              </div>
              <span className={`text-lg font-black ${activeTab === "COMPLETED" ? "text-emerald-700" : "text-slate-700"}`}>
                {counts.completed}
              </span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari tugas atau brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Brand:
              </span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
              >
                <option value="ALL">Semua Brand</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks List */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-xs">Memuat daftar tugas...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Inbox className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">Tidak ada tugas dalam kategori ini</h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "INBOX"
                  ? "Semua tugas masuk telah Anda proses!"
                  : activeTab === "IN_PROGRESS"
                  ? "Belum ada tugas yang sedang dikerjakan. Ambil dari Tugas Masuk."
                  : "Belum ada riwayat tugas selesai."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-md bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 uppercase tracking-wide">
                        {task.departmentCard || "GENERAL"}
                      </span>
                      {task.brandName && (
                        <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-0.5 flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {task.brandName}
                        </span>
                      )}
                      {task.priority === "URGENT" && (
                        <span className="rounded-md bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.5">
                          URGENT
                        </span>
                      )}
                      {task.revisionTag && (
                        <span className="rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5 flex items-center gap-1">
                          <RefreshCw className="h-2.5 w-2.5" /> {task.revisionTag}
                        </span>
                      )}
                    </div>

                    {/* Follow Up Component */}
                    <FollowUpButton
                      taskId={task.id}
                      taskTitle={task.title}
                      initialFollowUps={task.followUps}
                      onFollowUpSuccess={fetchTasks}
                    />
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line line-clamp-3">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Creator Info & Post Timestamp */}
                  <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Diposting oleh:</span>
                      <strong className="text-slate-800">{task.creator?.name || "Kolega"}</strong>
                      <span className="text-slate-400">({task.creator?.department || "HRIS"})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(task.createdAt)}
                    </span>
                  </div>

                  {/* Deadline Section & Suggestion Alert */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="h-3 w-3 text-slate-400" /> Target Deadline:
                      </span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {formatDateTime(task.expectedDeadline)}
                      </span>
                    </div>

                    {/* Jika ada Usulan Saran Deadline */}
                    {task.suggestedDeadline && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900">Saran Deadline Diajukan:</span>
                          <span className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                            task.suggestionStatus === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : task.suggestionStatus === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-200 text-blue-900"
                          }`}>
                            {task.suggestionStatus}
                          </span>
                        </div>
                        <p className="text-blue-800 font-mono text-[10px]">
                          {formatDateTime(task.suggestedDeadline)}
                        </p>
                        {task.suggestionReason && (
                          <p className="text-blue-700 italic text-[10px]">
                            Alasan: "{task.suggestionReason}"
                          </p>
                        )}
                        {/* Jika user adalah creator, ada tombol Terima/Tolak */}
                        {user?.id === task.creatorId && task.suggestionStatus === "PENDING" && (
                          <div className="flex items-center gap-2 pt-1 border-t border-blue-200/80">
                            <button
                              onClick={() => handleRespondSuggestion(task.id, "ACCEPT")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                            >
                              Terima Deadline
                            </button>
                            <button
                              onClick={() => handleRespondSuggestion(task.id, "REJECT")}
                              className="rounded-lg bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-300"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deliverable Link if completed */}
                  {task.deliverableUrl && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800 truncate">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="font-bold truncate">Hasil Akhir:</span>
                      </div>
                      <a
                        href={task.deliverableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                      >
                        Buka Tautan <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Action Buttons based on Active Tab */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {activeTab === "INBOX" && (
                      <>
                        <button
                          onClick={() => setDeadlineModalTask(task)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>Saran Deadline</span>
                        </button>

                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-blue-700 shadow-2xs transition"
                        >
                          <Play className="h-3 w-3" />
                          <span>Kerjakan Sekarang</span>
                        </button>
                      </>
                    )}

                    {activeTab === "IN_PROGRESS" && (
                      <>
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          Sedang aktif berjalan
                        </span>

                        <button
                          onClick={() => setDeliverableModalTask(task)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Submit & Selesai</span>
                        </button>
                      </>
                    )}

                    {activeTab === "COMPLETED" && (
                      <>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Tugas Selesai & Terarsip
                        </span>

                        {/* Jika user adalah pembuat tugas (misal tim Ads), bisa ajukan revisi */}
                        <button
                          onClick={() => setRevisionModalTask(task)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Minta Revisi</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchTasks}
      />

      {deadlineModalTask && (
        <DeadlineSuggestionModal
          isOpen={Boolean(deadlineModalTask)}
          onClose={() => setDeadlineModalTask(null)}
          taskId={deadlineModalTask.id}
          taskTitle={deadlineModalTask.title}
          currentExpectedDeadline={deadlineModalTask.expectedDeadline}
          onSuccess={fetchTasks}
        />
      )}

      {deliverableModalTask && (
        <SubmitDeliverableModal
          isOpen={Boolean(deliverableModalTask)}
          onClose={() => setDeliverableModalTask(null)}
          taskId={deliverableModalTask.id}
          taskTitle={deliverableModalTask.title}
          onSuccess={fetchTasks}
        />
      )}

      {revisionModalTask && (
        <RequestRevisionModal
          isOpen={Boolean(revisionModalTask)}
          onClose={() => setRevisionModalTask(null)}
          taskId={revisionModalTask.id}
          taskTitle={revisionModalTask.title}
          brandName={revisionModalTask.brandName || "General"}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  );
}
