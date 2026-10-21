"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import CreateTaskModal from "@/components/Tasks/CreateTaskModal";
import TaskDetailModal from "@/components/Tasks/TaskDetailModal";
import FollowUpButton from "@/components/Tasks/FollowUpButton";
import SubmitDeliverableModal from "@/components/Tasks/SubmitDeliverableModal";
import RequestRevisionModal from "@/components/Tasks/RequestRevisionModal";
import {
  Clapperboard,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  Tag,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface KanbanStage {
  key: string;
  label: string;
  order: number;
  color: string;
}

const DEFAULT_STAGES: KanbanStage[] = [
  { key: "CONTENT_BRIEF", label: "1. Content Brief", order: 1, color: "border-blue-300 bg-blue-50/50" },
  { key: "SHOOTING", label: "2. Shooting", order: 2, color: "border-purple-300 bg-purple-50/50" },
  { key: "DESIGN", label: "3. Design", order: 3, color: "border-pink-300 bg-pink-50/50" },
  { key: "VIDEO_EDITING", label: "4. Video Editing", order: 4, color: "border-amber-300 bg-amber-50/50" },
  { key: "REVISION", label: "5. Revision", order: 5, color: "border-rose-300 bg-rose-50/50" },
  { key: "APPROVAL", label: "6. Approval", order: 6, color: "border-emerald-300 bg-emerald-50/50" },
];

export default function ContentProductionKanbanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any | null>(null);
  const [approvalModalTask, setApprovalModalTask] = useState<any | null>(null);
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
      params.set("isContentProduction", "true");
      if (selectedBrand !== "ALL") params.set("brandName", selectedBrand);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/workspace/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch kanban tasks:", err);
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
      console.error("Failed to fetch metadata:", err);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchBrands();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setCreateModalOpen(true);
        window.history.replaceState({}, "", "/dashboard/content-production");
      }
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedBrand, searchQuery]);

  const handleMoveStage = async (task: any, newStage: string) => {
    if (newStage === "APPROVAL") {
      // Trigger approval modal for deliverable link
      setApprovalModalTask(task);
      return;
    }

    try {
      await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateKanbanStage: { stage: newStage },
        }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to move stage:", err);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Fleksibel";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-pink-100 text-pink-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                  Tim Sosmed & Kreatif
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-500">Pipeline Produksi Konten</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Kanban Project: Content Production
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Alur produksi konten (Brief &rarr; Shooting &rarr; Design &rarr; Editing &rarr; Revision &rarr; Approval). Auto-sync ke Card Besar saat Approval.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/workspace"
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Layers className="h-4 w-4 text-slate-500" />
                <span>Lihat 6 Card Divisi</span>
              </Link>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-pink-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Request Konten Baru</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari konten atau brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filter Brand:
              </span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-pink-500 outline-none bg-white font-medium"
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

          {/* Kanban Columns (Horizontal Scrollable) */}
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1300px]">
              {DEFAULT_STAGES.map((stage, idx) => {
                const stageTasks = tasks.filter(
                  (t) => (t.kanbanStage || "CONTENT_BRIEF") === stage.key
                );

                return (
                  <div
                    key={stage.key}
                    className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col overflow-hidden"
                  >
                    {/* Stage Header */}
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{stage.label}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                          {stageTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Stage Body */}
                    <div className="p-2.5 space-y-2.5 flex-1 min-h-[500px] max-h-[720px] overflow-y-auto bg-slate-50/50">
                      {stageTasks.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                          Tidak ada card
                        </div>
                      ) : (
                        stageTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskForDetail(task)}
                            className={`rounded-xl border bg-white p-3 shadow-2xs transition hover:shadow-xs hover:border-slate-300 space-y-2 cursor-pointer group ${
                              stage.key === "APPROVAL" ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                            }`}
                          >
                            {/* Badges & Follow Up */}
                            <div className="flex items-center justify-between gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              <span className="rounded-md bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                                <Tag className="h-2 w-2" /> {task.brandName || "Brand"}
                              </span>

                              <FollowUpButton
                                taskId={task.id}
                                taskTitle={task.title}
                                initialFollowUps={task.followUps}
                                onFollowUpSuccess={fetchTasks}
                              />
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-pink-600 transition-colors">
                              {task.title}
                            </h4>

                            {/* Revision Indicator */}
                            {task.revisionTag && (
                              <div className="rounded bg-rose-50 border border-rose-200 p-1.5 text-[10px] text-rose-800 font-bold flex items-center gap-1">
                                <RefreshCw className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                                <span className="truncate">{task.revisionTag}</span>
                              </div>
                            )}

                            {/* Assignee & Deadline */}
                            <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <User className="h-2.5 w-2.5 text-slate-400" /> Editor / PIC:
                                </span>
                                <strong className="text-slate-700 truncate max-w-[120px]">
                                  {task.user?.name}
                                </strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 text-slate-400" /> Target:
                                </span>
                                <span className="font-bold text-slate-700">
                                  {formatDateTime(task.expectedDeadline)}
                                </span>
                              </div>
                            </div>

                            {/* Deliverable Url if on Approval */}
                            {task.deliverableUrl && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="rounded bg-emerald-50 border border-emerald-200 p-1.5 text-[10px] flex items-center justify-between"
                              >
                                <span className="text-emerald-800 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> File Konten
                                </span>
                                <a
                                  href={task.deliverableUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  Buka <ExternalLink className="h-2 w-2" />
                                </a>
                              </div>
                            )}

                            {/* Stage Navigation Arrows */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                            >
                              {idx > 0 ? (
                                <button
                                  onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx - 1].key)}
                                  title={`Kembalikan ke ${DEFAULT_STAGES[idx - 1].label}`}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                              ) : <span />}

                              {/* Action: Next Stage or Minta Revisi */}
                              {stage.key === "APPROVAL" ? (
                                <button
                                  onClick={() => setRevisionModalTask(task)}
                                  className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  <span>Minta Revisi</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMoveStage(task, DEFAULT_STAGES[idx + 1].key)}
                                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <span>Lanjut</span>
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDepartment="SOSMED"
        initialIsContentProduction={true}
        onSuccess={fetchTasks}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTaskForDetail)}
        onClose={() => setSelectedTaskForDetail(null)}
        task={selectedTaskForDetail}
        currentUser={user}
        onUpdate={fetchTasks}
        onOpenDeliverableModal={(t) => setApprovalModalTask(t)}
        onOpenRevisionModal={(t) => setRevisionModalTask(t)}
      />

      {approvalModalTask && (
        <SubmitDeliverableModal
          isOpen={Boolean(approvalModalTask)}
          onClose={() => setApprovalModalTask(null)}
          taskId={approvalModalTask.id}
          taskTitle={approvalModalTask.title}
          isApprovalAction={true}
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
