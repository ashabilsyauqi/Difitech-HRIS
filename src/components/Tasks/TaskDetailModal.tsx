"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  Layers,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clapperboard,
  Share2,
  Inbox,
  Check,
} from "lucide-react";
import FollowUpButton from "./FollowUpButton";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any | null;
  currentUser: any;
  onUpdate: () => void;
  onOpenDeadlineModal?: (task: any) => void;
  onOpenDeliverableModal?: (task: any) => void;
  onOpenRevisionModal?: (task: any) => void;
  customStages?: WorkboardStage[];
}

const DEPARTMENTS: Record<string, { label: string; color: string }> = {
  SOSMED: { label: "Sosmed", color: "bg-pink-100 text-pink-700 border-pink-200" },
  ADS: { label: "Ads", color: "bg-blue-100 text-blue-700 border-blue-200" },
  SEO: { label: "SEO", color: "bg-amber-100 text-amber-700 border-amber-200" },
  WEB: { label: "Web", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  MARKETPLACE: { label: "Marketplace", color: "bg-purple-100 text-purple-700 border-purple-200" },
  HR: { label: "HR", color: "bg-slate-100 text-slate-700 border-slate-300" },
};

export interface WorkboardStage {
  key: string;
  label: string;
  step: number;
  color?: string;
  badgeStyle?: string;
  isDefault?: boolean;
}

export const WORKBOARD_STAGES: WorkboardStage[] = [
  { key: "NOT_STARTED", label: "Not Started", step: 1, color: "slate", isDefault: true },
  { key: "ON_PROGRESS", label: "On Progress", step: 2, color: "blue", isDefault: true },
  { key: "SUBMIT_TO_REVIEW", label: "Submit to Review", step: 3, color: "amber", isDefault: true },
  { key: "REVISION", label: "Revision", step: 4, color: "rose", isDefault: true },
  { key: "DONE", label: "Done", step: 5, color: "emerald", isDefault: true },
];

export function getTaskStageKey(task: any, customStages?: WorkboardStage[]): string {
  if (!task) return "NOT_STARTED";
  if (task.kanbanStage && task.kanbanStage !== "CONTENT_BRIEF") {
    if (customStages && customStages.some((s) => s.key === task.kanbanStage)) {
      return task.kanbanStage;
    }
    if (["NOT_STARTED", "ON_PROGRESS", "SUBMIT_TO_REVIEW", "REVISION", "DONE"].includes(task.kanbanStage)) {
      return task.kanbanStage;
    }
    return task.kanbanStage;
  }
  if (task.status === "COMPLETED" || task.reviewStatus === "APPROVED") {
    return "DONE";
  }
  if (task.reviewStatus === "REVISION_REQUESTED") {
    return "REVISION";
  }
  if (
    task.reviewStatus === "TO_BE_REVIEWED" ||
    task.reviewStatus === "UNDER_REVIEW" ||
    task.kanbanStage === "APPROVAL"
  ) {
    return "SUBMIT_TO_REVIEW";
  }
  if (task.status === "IN_PROGRESS") {
    return "ON_PROGRESS";
  }
  return "NOT_STARTED";
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  currentUser,
  onUpdate,
  onOpenDeadlineModal,
  onOpenDeliverableModal,
  onOpenRevisionModal,
  customStages,
}: TaskDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !task) return null;

  const deptConfig = DEPARTMENTS[task.departmentCard] || {
    label: task.departmentCard || "Divisi",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const isAssignee = Boolean(
    currentUser &&
      (task.user?.id === currentUser.id ||
        task.userId === currentUser.id ||
        task.assignees?.some(
          (a: any) => (a.user?.id || a.userId) === currentUser.id
        ))
  );
  const isCreator = currentUser && task.creator?.id === currentUser.id;
  const isCreatorOrManager = Boolean(isCreator || currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER");
  const hasDeliverable = Boolean(task.deliverableUrl || task.deliverableAttachment);
  const isReviewPending =
    task.status !== "COMPLETED" &&
    (task.reviewStatus === "TO_BE_REVIEWED" ||
      task.reviewStatus === "UNDER_REVIEW" ||
      task.kanbanStage === "APPROVAL" ||
      hasDeliverable);

  const handleStartTask = async () => {
    try {
      setIsUpdating(true);
      await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to start task:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartReview = async () => {
    try {
      setIsUpdating(true);
      await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "START_REVIEW" } }),
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to start review:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveReview = async () => {
    try {
      setIsUpdating(true);
      await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "APPROVE" } }),
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Failed to approve task:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "Fleksibel";
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

  const stagesToRender = customStages && customStages.length > 0 ? customStages : WORKBOARD_STAGES;
  const currentStageKey = getTaskStageKey(task, stagesToRender);
  const currentStageIndex = stagesToRender.findIndex((s) => s.key === currentStageKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-7xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col h-[94vh] max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${deptConfig.color}`}>
                  Card {deptConfig.label}
                </span>
                {task.brandName && (
                  <span className="rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] px-2.5 py-0.5 flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" /> {task.brandName}
                  </span>
                )}
                {task.creator?.id && task.creator.id !== currentUser?.id && (
                  <span className="rounded-full bg-purple-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 shadow-2xs flex items-center gap-1">
                    <Inbox className="h-3 w-3" /> User Requested
                  </span>
                )}
                {isAssignee && (
                  <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[10px] px-2 py-0.5">
                    👤 Tugas Anda
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-0.5">{task.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FollowUpButton
              taskId={task.id}
              taskTitle={task.title}
              initialFollowUps={task.followUps}
              onFollowUpSuccess={onUpdate}
            />
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visual Pipeline Stages Bar (Image 2 Teero Stepper) */}
        <div className="bg-slate-50/50 px-6 py-3.5 shrink-0 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center min-w-[720px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs divide-x divide-slate-200">
            {stagesToRender.map((stage, sIdx) => {
              const isCurrent = currentStageKey === stage.key;
              const isPassed = currentStageIndex > -1 && sIdx < currentStageIndex;
              const isRevisionStage = stage.key === "REVISION";
              const isSkippedRevision =
                stage.key === "REVISION" &&
                currentStageKey === "DONE" &&
                !task.revisionNote &&
                (!task.revisionCount || task.revisionCount === 0);

              return (
                <div
                  key={stage.key}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2.5 text-xs relative transition select-none ${
                    isCurrent
                      ? isRevisionStage
                        ? "bg-rose-50/50 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-rose-500"
                        : "bg-blue-50/40 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                      : isPassed
                      ? "bg-emerald-50/20"
                      : isSkippedRevision
                      ? "bg-slate-50/60 opacity-60"
                      : "bg-white"
                  }`}
                >
                  {/* Step Circle Badge */}
                  {isPassed ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div
                      className={`h-6 w-6 rounded-full text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0 ${
                        isRevisionStage ? "bg-rose-600 ring-2 ring-rose-200" : "bg-blue-600 ring-2 ring-blue-200"
                      }`}
                    >
                      <span>{stage.step}</span>
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-bold flex items-center justify-center text-xs shrink-0">
                      <span>{stage.step}</span>
                    </div>
                  )}

                  {/* Step Label */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`whitespace-nowrap ${
                        isCurrent
                          ? isRevisionStage
                            ? "font-black text-rose-700"
                            : "font-black text-blue-700"
                          : isPassed
                          ? "font-bold text-emerald-700"
                          : isSkippedRevision
                          ? "font-medium text-slate-400 line-through decoration-slate-300"
                          : "font-semibold text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isSkippedRevision && (
                      <span className="text-[9px] text-slate-400 -mt-0.5">(Tanpa Revisi)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body: 2-Column Worksheet */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Lembar Kerja Deskripsi / Brief (WYSIWYG View) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Review Gate Banner (Jika TO_BE_REVIEWED, UNDER_REVIEW, APPROVAL stage, atau ada deliverable) */}
            {isReviewPending && (
              <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 space-y-3 shadow-xs animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      {task.reviewStatus === "UNDER_REVIEW"
                        ? "Sedang Di-review"
                        : "Menunggu Review Pemberi Tugas"}
                    </h4>
                  </div>
                  {task.deliverableUrl && (
                    <a
                      href={task.deliverableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition shrink-0 shadow-2xs"
                    >
                      <span>Periksa Hasil Kerja</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-amber-900 space-y-1">
                  <p>
                    <strong>{task.user?.name || "Pengerja"}</strong> telah menyelesaikan tugas ini dan menyerahkan deliverable.
                  </p>
                  {task.completionNote && (
                    <p className="italic bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 text-amber-950 font-medium">
                      Catatan Pengerja: "{task.completionNote}"
                    </p>
                  )}
                </div>

                {/* Aksi Pemberi Tugas (Reviewer) */}
                {isCreatorOrManager ? (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
                    <span className="text-[11px] font-bold text-amber-800 mr-1">Keputusan Pemberi Tugas:</span>
                    {task.reviewStatus !== "UNDER_REVIEW" && (
                      <button
                        onClick={handleStartReview}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Mulai Review</span>
                      </button>
                    )}
                    {task.reviewStatus === "UNDER_REVIEW" && (
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-1 rounded-lg">
                        👀 Sedang Anda Review
                      </span>
                    )}
                    {onOpenRevisionModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRevisionModal(task);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Minta Revisi</span>
                      </button>
                    )}
                    <button
                      onClick={handleApproveReview}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ACC / Selesai (Done !)</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800 italic pt-1 border-t border-amber-200">
                    {task.reviewStatus === "UNDER_REVIEW" ? (
                      <>Sedang di-review oleh <strong>{task.creator?.name || "Pemberi Tugas"}</strong>.</>
                    ) : (
                      <>Menunggu review dari <strong>{task.creator?.name || "Pemberi Tugas"}</strong>.</>
                    )}{" "}
                    Tugas akan resmi masuk ke stage <strong>Selesai (Done !)</strong> begitu di-ACC.
                  </p>
                )}
              </div>
            )}

            {/* Banner Catatan Revisi jika REVISION_REQUESTED */}
            {task.reviewStatus === "REVISION_REQUESTED" && (
              <div className="rounded-2xl bg-rose-50 border-2 border-rose-300 p-4 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <span>Perlu Revisi dari Pemberi Tugas ({task.creator?.name || "Kolega"})</span>
                  </div>
                  {isAssignee && onOpenDeliverableModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDeliverableModal(task);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                    >
                      <Play className="h-3 w-3" />
                      <span>Submit Hasil Revisi</span>
                    </button>
                  )}
                </div>
                {task.revisionNote && (
                  <div className="rounded-xl bg-white border border-rose-200 p-3 text-xs text-slate-800 shadow-2xs">
                    <strong className="text-rose-800 block mb-1.5 font-bold">Catatan & Bukti Screenshot Revisi:</strong>
                    <div
                      className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: task.revisionNote }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Banner Tugas Selesai (Done !) */}
            {task.status === "COMPLETED" && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Tugas Telah Disetujui & Tuntas (Done !)</span>
                </div>
                {task.deliverableUrl && (
                  <a
                    href={task.deliverableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <span>Buka Deliverable</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Lembar Kerja & Instruksi Pengerjaan
              </h4>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs min-h-[360px]">
                {task.description ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                ) : (
                  <p className="text-xs italic text-slate-400">
                    Tidak ada catatan tambahan untuk tugas ini.
                  </p>
                )}
              </div>
            </div>

            {/* Bukti Deliverable & Hasil Akhir */}
            {task.deliverableUrl && task.status !== "COMPLETED" && !isReviewPending && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Hasil Akhir Pekerjaan Telah Diserahkan</span>
                  </div>
                  <a
                    href={task.deliverableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                  >
                    <span>Buka Tautan Hasil</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Riwayat Catatan Revisi */}
            {task.revisionTag && task.reviewStatus !== "REVISION_REQUESTED" && (
              <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4 space-y-1">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
                  <span>{task.revisionTag}</span>
                </div>
                {task.revisionNote && (
                  <p className="text-xs text-purple-800 italic">"{task.revisionNote}"</p>
                )}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail Informasi & Properti */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">Properti Lembar Kerja</span>
            </div>

            {/* Assignee / Tim Pelaksana */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">
                {task.assignees && task.assignees.length > 1
                  ? `Tim Penerima (${task.assignees.length} Orang):`
                  : "Penerima Tugas:"}
              </span>
              {task.assignees && task.assignees.length > 0 ? (
                <div className="space-y-1.5">
                  {task.assignees.map((asgn: any) => {
                    const u = asgn.user || task.user;
                    const isMe = u?.id === currentUser?.id;
                    return (
                      <div
                        key={asgn.id || u?.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200"
                      >
                        <div className="h-6 w-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0">
                          {u?.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            (u?.name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {isMe ? `${u?.name} (Saya)` : u?.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {u?.department || "Anggota Tim"} {asgn.role === "PIC" ? "• PIC" : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200">
                  <div className="h-7 w-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                    {task.user?.name ? task.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {task.user?.id === currentUser?.id ? `${task.user?.name} (Saya)` : task.user?.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {task.user?.department || "Anggota Tim"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Creator */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Pemberi Tugas:</span>
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
                <span className="font-bold">
                  {task.creator?.id === currentUser?.id ? `${task.creator?.name} (Saya)` : (task.creator?.name || "Kolega")}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDateTime(task.createdAt)}
                </span>
              </div>
            </div>

            {/* Target Deadline */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Target Deadline:</span>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800 flex items-center justify-between">
                <span>{formatDateTime(task.expectedDeadline)}</span>
                {isAssignee && task.status !== "COMPLETED" && onOpenDeadlineModal && (
                  <button
                    onClick={() => onOpenDeadlineModal(task)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Nego
                  </button>
                )}
              </div>
            </div>

            {/* Usulan Deadline if any */}
            {task.suggestedDeadline && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center justify-between font-bold text-[10px]">
                  <span>Usulan Deadline PIC:</span>
                  <span className="uppercase px-1 rounded bg-blue-200 text-[9px]">
                    {task.suggestionStatus}
                  </span>
                </div>
                <p className="font-mono text-xs">{formatDateTime(task.suggestedDeadline)}</p>
                {task.suggestionReason && (
                  <p className="italic text-[10px] text-blue-700">"{task.suggestionReason}"</p>
                )}
              </div>
            )}

            {/* Prioritas */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-semibold block text-[11px]">Prioritas:</span>
              <div className="p-2 rounded-xl bg-white border border-slate-200 font-bold text-xs">
                {task.priority || "MEDIUM"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Image 2 Style: Back left, Next right) */}
        <div className="border-t border-slate-100 bg-slate-50/90 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            {/* STAGE 1: NOT_STARTED */}
            {currentStageKey === "NOT_STARTED" && (
              <>
                {isAssignee ? (
                  <button
                    onClick={handleStartTask}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Next: Mulai Kerjakan &rarr;</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
                    Tahap 1: Menunggu PIC Memulai
                  </span>
                )}
              </>
            )}

            {/* STAGE 2: ON_PROGRESS */}
            {currentStageKey === "ON_PROGRESS" && (
              <>
                {isAssignee && onOpenDeliverableModal ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeliverableModal(task);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Next: Submit to Review &rarr;</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Tahap 2: PIC Sedang Mengerjakan</span>
                  </span>
                )}
              </>
            )}

            {/* STAGE 3: SUBMIT_TO_REVIEW */}
            {currentStageKey === "SUBMIT_TO_REVIEW" && (
              <>
                {isCreatorOrManager ? (
                  <div className="flex items-center gap-2">
                    {task.reviewStatus === "TO_BE_REVIEWED" && (
                      <button
                        onClick={handleStartReview}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Mulai Review</span>
                      </button>
                    )}
                    {onOpenRevisionModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRevisionModal(task);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Minta Revisi (Tahap 4)</span>
                      </button>
                    )}
                    <button
                      onClick={handleApproveReview}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>ACC Selesai (Langsung Done &rarr;)</span>
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-300">
                    <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                    <span>Tahap 3: Menunggu Keputusan Pemberi Tugas</span>
                  </span>
                )}
              </>
            )}

            {/* STAGE 4: REVISION */}
            {currentStageKey === "REVISION" && (
              <>
                {isAssignee && onOpenDeliverableModal ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeliverableModal(task);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Submit Ulang Hasil Revisi &rarr;</span>
                  </button>
                ) : (
                  <span className="text-xs text-rose-700 font-bold bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200">
                    Tahap 4: Menunggu PIC Memperbaiki Revisi
                  </span>
                )}
              </>
            )}

            {/* STAGE 5: DONE */}
            {currentStageKey === "DONE" && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Tahap 5: Tugas Selesai & Di-ACC</span>
                </span>
                {isCreatorOrManager && onOpenRevisionModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRevisionModal(task);
                    }}
                    className="flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Minta Revisi Baru</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
