"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Timer,
} from "lucide-react";
import { TaskItem } from "./TaskFormModal";

interface TaskKanbanBoardProps {
  tasks: TaskItem[];
  onStatusChange: (taskId: string, newStatus: TaskItem["status"]) => Promise<void>;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: () => void;
  onRefresh?: () => void;
  readOnly?: boolean;
}

const COLUMNS: {
  id: TaskItem["status"];
  title: string;
  badgeColor: string;
  icon: any;
  description: string;
}[] = [
  {
    id: "PENDING",
    title: "Belum Dikerjakan",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
    description: "Rencana hari ini",
  },
  {
    id: "IN_PROGRESS",
    title: "Sedang Berjalan",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: PlayCircle,
    description: "Dalam pengerjaan",
  },
  {
    id: "COMPLETED",
    title: "Selesai",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "Tugas tuntas",
  },
  {
    id: "BLOCKED",
    title: "Terkendala",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    description: "Butuh bantuan",
  },
];

export default function TaskKanbanBoard({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onRefresh,
  readOnly = false,
}: TaskKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  // Sync initial tracked seconds based on database state & elapsed time if actively tracking
  useEffect(() => {
    const initial: Record<string, number> = {};
    const now = Date.now();
    tasks.forEach((t) => {
      if (t.id) {
        let baseSec = (t as any).trackedSeconds || Math.round((t.actualHours || 0) * 3600) || 0;
        if (t.status !== "COMPLETED" && (t as any).isTracking && (t as any).trackingStartedAt) {
          const startedAt = new Date((t as any).trackingStartedAt).getTime();
          const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
          baseSec += elapsed;
        }
        initial[t.id] = baseSec;
      }
    });
    setActiveTimers(initial);
  }, [tasks]);

  // Live timer interval for tasks with isTracking === true (Calculated with Date.now() timestamp delta)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTimers((prev) => {
        let changed = false;
        const next = { ...prev };
        tasks.forEach((t) => {
          if (t.id && t.status !== "COMPLETED" && (t as any).isTracking) {
            let baseSec = (t as any).trackedSeconds || 0;
            if ((t as any).trackingStartedAt) {
              const startedAt = new Date((t as any).trackingStartedAt).getTime();
              const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
              next[t.id] = baseSec + elapsed;
            } else {
              next[t.id] = (next[t.id] || 0) + 1;
            }
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const handleToggleTimer = async (task: TaskItem) => {
    if (!task.id) return;
    const isCurrentlyTracking = (task as any).isTracking;
    const currentSeconds = activeTimers[task.id] || 0;

    try {
      await fetch("/api/tasks/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: isCurrentlyTracking ? "PAUSE" : "START",
          trackedSeconds: currentSeconds,
        }),
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Timer toggle error:", err);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const getPriorityBadge = (p: TaskItem["priority"]) => {
    switch (p) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getPriorityLabel = (p: TaskItem["priority"]) => {
    switch (p) {
      case "URGENT":
        return "Mendesak";
      case "HIGH":
        return "Tinggi";
      case "MEDIUM":
        return "Sedang";
      default:
        return "Rendah";
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (readOnly) return;
    setDraggedTaskId(id);
    e.dataTransfer.setData("text/plain", id);
  };

  const handleStatusChangeInternal = async (taskId: string, targetStatus: TaskItem["status"]) => {
    const task = tasks.find((t) => t.id === taskId);
    const currentSeconds = activeTimers[taskId] || (task as any)?.trackedSeconds || 0;

    // If moving away from IN_PROGRESS or into COMPLETED, stop tracking immediately
    if (targetStatus === "COMPLETED" || (targetStatus !== "IN_PROGRESS" && (task as any)?.isTracking)) {
      try {
        await fetch("/api/tasks/timer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            action: "PAUSE",
            trackedSeconds: currentSeconds,
          }),
        });
      } catch (e) {
        console.error("Auto pause timer error:", e);
      }
    }

    await onStatusChange(taskId, targetStatus);
    if (onRefresh) onRefresh();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskItem["status"]) => {
    if (readOnly) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      await handleStatusChangeInternal(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header controls with Taharica Red & Blue */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Papan Aktivitas Harian Difitech
          </span>
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700 font-bold font-mono">
            {tasks.length} Tugas
          </span>
        </div>

        {!readOnly && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tugas Harian</span>
          </button>
        )}
      </div>

      {/* 4 Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const colTasks = tasks.filter((t) => t.status === col.id);
          const totalEstimated = colTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-100/70 p-3.5 min-h-[440px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${col.badgeColor}`}>
                    <ColIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{col.title}</h4>
                    <p className="text-[10px] text-slate-500">{col.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono shadow-xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    <p>Tidak ada tugas di kolom ini</p>
                    {!readOnly && col.id === "PENDING" && (
                      <button
                        onClick={onAddTask}
                        className="mt-1 text-red-600 hover:underline text-[11px] font-semibold"
                      >
                        + Tambah tugas baru
                      </button>
                    )}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isTracking = (task as any).isTracking;
                    const seconds = task.id ? activeTimers[task.id] || 0 : 0;

                    return (
                      <div
                        key={task.id}
                        draggable={!readOnly}
                        onDragStart={(e) => task.id && handleDragStart(e, task.id)}
                        className={`group relative rounded-xl border bg-white p-3.5 shadow-2xs transition hover:border-slate-300 hover:shadow-md ${
                          isTracking ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
                        } ${!readOnly ? "cursor-grab active:cursor-grabbing" : ""}`}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {task.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {getPriorityLabel(task.priority)}
                            </span>

                            {!readOnly && task.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => onEditTask(task)}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  title="Ubah Tugas"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => task.id && onDeleteTask(task.id)}
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  title="Hapus Tugas"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">
                          {task.title}
                        </h5>

                        {task.description && (
                          <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Live Time Tracker Bar */}
                        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Timer
                              className={`h-3.5 w-3.5 ${
                                isTracking ? "text-blue-600 animate-spin" : "text-slate-400"
                              }`}
                            />
                            <span className={`font-bold ${isTracking ? "text-blue-700" : "text-slate-700"}`}>
                              {formatTimer(seconds)}
                            </span>
                          </div>

                          {!readOnly && task.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => handleToggleTimer(task)}
                              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                                isTracking
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                              }`}
                            >
                              {isTracking ? (
                                <>
                                  <PauseCircle className="h-3 w-3" />
                                  <span>Jeda</span>
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-3 w-3" />
                                  <span>Mulai</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Deliverable Proof of work link */}
                        {task.deliverableUrl && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <a
                              href={task.deliverableUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 transition truncate max-w-full"
                            >
                              <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                              <span className="truncate">Bukti Hasil Kerja</span>
                            </a>
                          </div>
                        )}

                        {/* Completion Note */}
                        {task.completionNote && (
                          <p className="mt-1.5 text-[10px] text-emerald-800 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-200 leading-tight">
                            &ldquo;{task.completionNote}&rdquo;
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>Est: {task.estimatedHours}j</span>
                            {task.actualHours && (
                              <span className="text-slate-800 font-bold">({task.actualHours}j real)</span>
                            )}
                          </div>

                          {!readOnly && task.id && (
                            <select
                              value={task.status}
                              onChange={(e) =>
                                task.id && handleStatusChangeInternal(task.id, e.target.value as TaskItem["status"])
                              }
                              className="rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700 px-1.5 py-0.5 focus:border-red-500 focus:outline-none"
                            >
                              <option value="PENDING">Backlog</option>
                              <option value="IN_PROGRESS">Berjalan</option>
                              <option value="COMPLETED">Selesai</option>
                              <option value="BLOCKED">Terkendala</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column Footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 text-right text-[10px] text-slate-500 font-mono">
                Total Est: {totalEstimated.toFixed(1)} Jam
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
