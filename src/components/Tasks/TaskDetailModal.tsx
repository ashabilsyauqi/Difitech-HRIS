"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowRightLeft,
  MessageSquare,
  Paperclip,
  Send,
  CornerDownRight,
  FileText,
  Download,
  Image as ImageIcon,
  History,
  Loader2,
  PlayCircle,
  PauseCircle,
  Timer,
} from "lucide-react";
import FollowUpButton from "./FollowUpButton";

export interface TaskCommentItem {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    message: string;
    attachmentName?: string | null;
    user?: {
      id: string;
      name: string;
      department?: string | null;
    } | null;
  } | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    department?: string | null;
    avatarUrl?: string | null;
    role?: string;
  } | null;
}

export interface TaskActivityLogItem {
  id: string;
  taskId: string;
  userId?: string | null;
  actionType: string;
  title: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    department?: string | null;
    avatarUrl?: string | null;
    role?: string;
  } | null;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any | null;
  currentUser: any;
  onUpdate: (updatedTask?: any) => void;
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
  { key: "USER_REQUESTED", label: "User Requested", step: 1, color: "purple", isDefault: true },
  { key: "NOT_STARTED", label: "Not Started", step: 2, color: "slate", isDefault: true },
  { key: "ON_PROGRESS", label: "On Progress", step: 3, color: "blue", isDefault: true },
  { key: "SUBMIT_TO_REVIEW", label: "Submit to Review", step: 4, color: "amber", isDefault: true },
  { key: "REVISION", label: "Revision", step: 5, color: "rose", isDefault: true },
  { key: "DONE", label: "Done", step: 6, color: "emerald", isDefault: true },
];

export const SOSMED_WORKBOARD_STAGES: WorkboardStage[] = [
  { key: "CONTENT_BRIEF", label: "1. Content Brief", step: 1, color: "blue", isDefault: true },
  { key: "SHOOTING", label: "2. Shooting", step: 2, color: "purple", isDefault: true },
  { key: "DESIGN", label: "3. Design", step: 3, color: "pink", isDefault: true },
  { key: "VIDEO_EDITING", label: "4. Video Editing", step: 4, color: "amber", isDefault: true },
  { key: "REVISION", label: "5. Revision", step: 5, color: "rose", isDefault: true },
  { key: "APPROVAL", label: "6. Approval", step: 6, color: "emerald", isDefault: true },
];

export function getTaskStageKey(task: any, customStages?: WorkboardStage[]): string {
  if (!task) return "NOT_STARTED";

  // 1. Prioritas Utama: Jika tugas selesai atau disetujui (ACC) -> DONE (atau APPROVAL)
  if (task.status === "COMPLETED" || task.reviewStatus === "APPROVED" || task.kanbanStage === "DONE") {
    if (customStages && customStages.some((s) => s.key === "APPROVAL")) {
      return "APPROVAL";
    }
    return "DONE";
  }

  // 2. Jika tugas dalam status revisi
  if (task.reviewStatus === "REVISION_REQUESTED" || task.kanbanStage === "REVISION") {
    return "REVISION";
  }

  // 3. Jika sedang menunggu review dari pemberi tugas
  if (
    task.reviewStatus === "TO_BE_REVIEWED" ||
    task.reviewStatus === "UNDER_REVIEW" ||
    task.kanbanStage === "APPROVAL"
  ) {
    if (customStages && customStages.some((s) => s.key === "APPROVAL")) {
      return "APPROVAL";
    }
    return "SUBMIT_TO_REVIEW";
  }

  // 4. Jika eksplisit kanbanStage === "USER_REQUESTED" atau "REQUESTED"
  if (task.kanbanStage === "USER_REQUESTED" || task.kanbanStage === "REQUESTED") {
    return "USER_REQUESTED";
  }

  // 5. Check matching custom stage or Sosmed stage directly from task.kanbanStage
  if (task.kanbanStage) {
    if (customStages && customStages.some((s) => s.key === task.kanbanStage)) {
      return task.kanbanStage;
    }
    if (SOSMED_WORKBOARD_STAGES.some((s) => s.key === task.kanbanStage)) {
      return task.kanbanStage;
    }
    if (["USER_REQUESTED", "NOT_STARTED", "ON_PROGRESS", "SUBMIT_TO_REVIEW", "REVISION", "DONE"].includes(task.kanbanStage)) {
      return task.kanbanStage;
    }
  }

  // 6. Jika tugas sedang berjalan
  if (task.status === "IN_PROGRESS") {
    if (task.kanbanStage && task.kanbanStage !== "CONTENT_BRIEF" && task.kanbanStage !== "USER_REQUESTED") {
      return task.kanbanStage;
    }
    if (customStages && customStages.some((s) => s.key === "SHOOTING")) {
      return task.kanbanStage || "SHOOTING";
    }
    return "ON_PROGRESS";
  }

  // 7. Jika tugas status === "REQUESTED" atau merupakan request dari user lain yang belum dimulai:
  const isCreatedByOther = Boolean(
    (task.creatorId && task.userId && task.creatorId !== task.userId) ||
    (task.creator?.id && task.user?.id && task.creator.id !== task.user.id) ||
    task.status === "REQUESTED"
  );

  if (
    isCreatedByOther &&
    (!task.status || task.status === "REQUESTED" || task.status === "PENDING") &&
    (!task.kanbanStage || task.kanbanStage === "USER_REQUESTED" || task.kanbanStage === "NOT_STARTED")
  ) {
    if (customStages && customStages.some((s) => s.key === "USER_REQUESTED" || s.key === "REQUESTED")) {
      const match = customStages.find((s) => s.key === "USER_REQUESTED" || s.key === "REQUESTED");
      return match ? match.key : "USER_REQUESTED";
    }
    return "USER_REQUESTED";
  }

  if (customStages && customStages.some((s) => s.key === "CONTENT_BRIEF")) {
    return "CONTENT_BRIEF";
  }
  return "NOT_STARTED";
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task: initialTask,
  currentUser,
  onUpdate,
  onOpenDeadlineModal,
  onOpenDeliverableModal,
  onOpenRevisionModal,
  customStages,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<any>(initialTask);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"DISCUSSION" | "LOGS">("DISCUSSION");
  const [comments, setComments] = useState<TaskCommentItem[]>([]);
  const [logs, setLogs] = useState<TaskActivityLogItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<TaskCommentItem | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Time Tracker State for Modal
  const [isTracking, setIsTracking] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isUpdatingTimer, setIsUpdatingTimer] = useState(false);

  useEffect(() => {
    if (task) {
      const tracking = Boolean(task.isTracking);
      setIsTracking(tracking);
      let sec = Number(task.trackedSeconds) || 0;
      if (tracking && task.trackingStartedAt) {
        const elapsed = Math.floor(
          (Date.now() - new Date(task.trackingStartedAt).getTime()) / 1000
        );
        sec += Math.max(0, elapsed);
      }
      setActiveSeconds(sec);
    }
  }, [task?.id, task?.isTracking, task?.trackingStartedAt, task?.trackedSeconds, isOpen]);

  useEffect(() => {
    if (!isTracking) return;
    const interval = setInterval(() => {
      setActiveSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatTimerSeconds = (totalSeconds: number) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchComments = async (taskId: string) => {
    try {
      setIsLoadingComments(true);
      const res = await fetch(`/api/workspace/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load task comments:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchLogs = async (taskId: string) => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch(`/api/workspace/tasks/${taskId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load task logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && task?.id) {
      fetchComments(task.id);
      fetchLogs(task.id);
      setChatInput("");
      setReplyingTo(null);
      setSelectedAttachment(null);
    }
  }, [isOpen, task?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedAttachment({
        dataUrl: reader.result as string,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task?.id || isSendingComment) return;

    const trimmed = chatInput.trim();
    if (!trimmed && !selectedAttachment) return;

    try {
      setIsSendingComment(true);
      const payload = {
        message: trimmed,
        replyToId: replyingTo ? replyingTo.id : null,
        attachmentUrl: selectedAttachment?.dataUrl || null,
        attachmentName: selectedAttachment?.name || null,
        attachmentType: selectedAttachment?.type || null,
        attachmentSize: selectedAttachment?.size || null,
      };

      const res = await fetch(`/api/workspace/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [...prev, data.comment]);
        }
        setChatInput("");
        setReplyingTo(null);
        setSelectedAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchLogs(task.id);
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Gagal mengirim pesan.");
      }
    } catch (err) {
      console.error("Failed to send comment:", err);
      alert("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setIsSendingComment(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getLogBadge = (actionType: string) => {
    switch (actionType) {
      case "TASK_CREATED":
        return { label: "Tugas Dibuat", bg: "bg-indigo-100 text-indigo-800 border-indigo-300" };
      case "DEADLINE_CONSOLIDATION":
        return { label: "Negosiasi Deadline", bg: "bg-amber-100 text-amber-800 border-amber-300" };
      case "DEADLINE_AGREED":
        return { label: "Deadline Disepakati", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "STAGE_CHANGE":
        return { label: "Perpindahan Stage", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "STATUS_CHANGE":
        return { label: "Status Berubah", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "SUBMIT_DELIVERABLE":
        return { label: "Hasil Diserahkan", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "APPROVE_TASK":
        return { label: "ACC & Selesai", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "REQUEST_REVISION":
        return { label: "Permintaan Revisi", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case "DEADLINE_CHANGE":
        return { label: "Negosiasi Deadline", bg: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "COMMENT_ADDED":
        return { label: "Diskusi & Chat", bg: "bg-violet-50 text-violet-700 border-violet-200" };
      case "START_REVIEW":
        return { label: "Proses Review", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: "Aktivitas", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

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
    if (!task?.id) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          kanbanStage: "ON_PROGRESS",
        }),
      });
      const data = res.ok ? await res.json() : null;
      await fetch("/api/tasks/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: "START",
          trackedSeconds: activeSeconds,
        }),
      });
      setIsTracking(true);
      const updated = data?.task || {
        ...task,
        status: "IN_PROGRESS",
        kanbanStage: "ON_PROGRESS",
        isTracking: true,
      };
      setTask(updated);
      fetchLogs(task.id);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error("Failed to start task:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartReview = async () => {
    if (!task?.id) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "START_REVIEW" } }),
      });
      const data = res.ok ? await res.json() : null;
      const updated = data?.task || {
        ...task,
        reviewStatus: "UNDER_REVIEW",
      };
      setTask(updated);
      fetchLogs(task.id);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error("Failed to start review:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveReview = async () => {
    if (!task?.id) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction: { action: "APPROVE" } }),
      });
      const data = res.ok ? await res.json() : null;
      const updated = data?.task || {
        ...task,
        status: "COMPLETED",
        kanbanStage: "DONE",
        reviewStatus: "APPROVED",
      };
      setTask(updated);
      fetchLogs(task.id);
      if (onUpdate) onUpdate(updated);
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

  const formatRelativeTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const isSosmedTask = task?.departmentCard === "SOSMED" || Boolean(task?.isContentProduction);
  const stagesToRender =
    customStages && customStages.length > 0
      ? customStages
      : isSosmedTask
      ? SOSMED_WORKBOARD_STAGES
      : WORKBOARD_STAGES;
  const currentStageKey = getTaskStageKey(task, stagesToRender);
  const currentStageIndex = stagesToRender.findIndex((s) => s.key === currentStageKey);

  const handleToggleTimerModal = async () => {
    if (!task?.id) return;
    try {
      setIsUpdatingTimer(true);
      const action = isTracking ? "PAUSE" : "START";
      const res = await fetch("/api/tasks/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action,
          trackedSeconds: activeSeconds,
        }),
      });
      if (res.ok) {
        const nextTracking = !isTracking;
        setIsTracking(nextTracking);
        let updated = { ...task, isTracking: nextTracking, trackedSeconds: activeSeconds };
        if (nextTracking) {
          if (task.status !== "IN_PROGRESS" && task.status !== "COMPLETED") {
            const patchRes = await fetch(`/api/workspace/tasks/${task.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "IN_PROGRESS",
                ...(currentStageKey === "USER_REQUESTED" || currentStageKey === "NOT_STARTED"
                  ? { kanbanStage: "ON_PROGRESS" }
                  : {}),
              }),
            });
            const data = patchRes.ok ? await patchRes.json() : null;
            if (data?.task) {
              updated = data.task;
            } else {
              updated = {
                ...updated,
                status: "IN_PROGRESS",
                ...(currentStageKey === "USER_REQUESTED" || currentStageKey === "NOT_STARTED"
                  ? { kanbanStage: "ON_PROGRESS" }
                  : {}),
              };
            }
          }
        }
        setTask(updated);
        fetchLogs(task.id);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error("Failed to toggle timer in modal:", err);
    } finally {
      setIsUpdatingTimer(false);
    }
  };

  const handleAcceptDirectly = async () => {
    if (!task?.id) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consolidateDeadline: {
            action: "ACCEPT",
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data?.task || { ...task, suggestionStatus: "ACCEPTED" };
        setTask(updated);
        fetchLogs(task.id);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error("Failed to accept deadline:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMoveKanbanStage = async (newStage: string) => {
    if (!task?.id) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateKanbanStage: { stage: newStage } }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data?.task || { ...task, kanbanStage: newStage };
        setTask(updated);
        fetchLogs(task.id);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error("Failed to move kanban stage:", err);
    } finally {
      setIsUpdating(false);
    }
  };

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
                  onClick={() => {
                    if (isAssignee || isCreatorOrManager) {
                      if (stage.key === "ON_PROGRESS" && (currentStageKey === "USER_REQUESTED" || currentStageKey === "NOT_STARTED")) {
                        handleStartTask();
                      } else if (stage.key === "DONE" || stage.key === "APPROVAL") {
                        if (isCreatorOrManager) {
                          handleApproveReview();
                        } else {
                          alert("Pekerjaan harus di-ACC oleh pemberi tugas untuk masuk ke status Selesai.");
                        }
                      } else {
                        handleMoveKanbanStage(stage.key);
                      }
                    }
                  }}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2.5 text-xs relative transition select-none cursor-pointer hover:bg-slate-50/80 ${
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

            {/* Diskusi & Log Rekap Aktivitas */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              {/* Tab Header Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/90 px-4 py-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("DISCUSSION")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === "DISCUSSION"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Diskusi & Chat</span>
                    {comments.length > 0 && (
                      <span className="ml-0.5 rounded-full bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[10px] font-black">
                        {comments.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("LOGS")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeTab === "LOGS"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Log & Rekap Aktivitas</span>
                    {logs.length > 0 && (
                      <span className="ml-0.5 rounded-full bg-indigo-100 text-indigo-800 px-1.5 py-0.2 text-[10px] font-black">
                        {logs.length}
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                  <span>
                    {activeTab === "DISCUSSION"
                      ? "Koordinasi & instruksi langsung pengerja"
                      : "Riwayat perpindahan stage & aksi sistem"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "DISCUSSION") fetchComments(task.id);
                      else fetchLogs(task.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                    title="Muat ulang data"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingComments || isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* TAB 1: DISCUSSION */}
              {activeTab === "DISCUSSION" && (
                <div className="flex flex-col">
                  {/* Chat Stream List */}
                  <div className="max-h-[380px] min-h-[160px] overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {isLoadingComments ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-xs">Memuat obrolan diskusi...</span>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600">Belum ada obrolan atau catatan diskusi</p>
                        <p className="text-[11px] text-slate-400 max-w-sm">
                          Gunakan kolom di bawah untuk berdiskusi, memberikan feedback revisi, atau melampirkan file dokumen / screenshot.
                        </p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isMe = comment.userId === currentUser?.id;
                        const isImage =
                          comment.attachmentType?.startsWith("image/") ||
                          comment.attachmentUrl?.startsWith("data:image/") ||
                          Boolean(comment.attachmentName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));

                        return (
                          <div
                            key={comment.id}
                            className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {/* Avatar */}
                            <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs mt-0.5">
                              {comment.user?.avatarUrl ? (
                                <img
                                  src={comment.user.avatarUrl}
                                  alt={comment.user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (comment.user?.name || "?").charAt(0).toUpperCase()
                              )}
                            </div>

                            {/* Comment Bubble Container */}
                            <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                              {/* Sender Header */}
                              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                                <span className="font-bold text-slate-800">
                                  {isMe ? "Saya" : comment.user?.name || "Anggota Tim"}
                                </span>
                                {comment.user?.department && (
                                  <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9px] font-semibold border border-slate-200">
                                    {comment.user.department}
                                  </span>
                                )}
                                <span className="text-slate-400 text-[10px]">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                              </div>

                              {/* Quoted Reply Banner if this is a reply */}
                              {comment.replyTo && (
                                <div className="mb-1 rounded-xl bg-slate-100 border-l-2 border-blue-500 px-2.5 py-1 text-[10px] text-slate-600 max-w-full flex items-center gap-1.5 shadow-2xs">
                                  <CornerDownRight className="h-3 w-3 text-blue-600 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-bold text-slate-800">
                                      {comment.replyTo.user?.name || "Pengguna"}:{" "}
                                    </span>
                                    <span>
                                      {comment.replyTo.message || comment.replyTo.attachmentName || "Lampiran"}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Main Message Bubble */}
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                                  isMe
                                    ? "bg-blue-600 text-white rounded-tr-xs"
                                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                                }`}
                              >
                                {comment.message && (
                                  <p className="whitespace-pre-wrap select-text">{comment.message}</p>
                                )}

                                {/* Attachment Card inside Bubble */}
                                {comment.attachmentUrl && (
                                  <div className={comment.message ? "mt-2 pt-2 border-t border-black/10" : ""}>
                                    {isImage ? (
                                      <div className="space-y-1">
                                        <div
                                          onClick={() => setPreviewImageModal(comment.attachmentUrl!)}
                                          className="relative group rounded-xl overflow-hidden border border-black/10 bg-black/5 cursor-pointer max-w-[260px]"
                                        >
                                          <img
                                            src={comment.attachmentUrl}
                                            alt={comment.attachmentName || "Lampiran gambar"}
                                            className="max-h-48 object-cover rounded-xl transition duration-150 group-hover:scale-102"
                                          />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                            <ImageIcon className="h-3.5 w-3.5" />
                                            <span>Lihat Gambar</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] px-1 opacity-90">
                                          <span className="truncate max-w-[170px]">{comment.attachmentName || "Gambar"}</span>
                                          <a
                                            href={comment.attachmentUrl}
                                            download={comment.attachmentName || "gambar.png"}
                                            className={`hover:underline flex items-center gap-0.5 font-bold ${
                                              isMe ? "text-blue-100" : "text-blue-600"
                                            }`}
                                          >
                                            <Download className="h-2.5 w-2.5" /> Unduh
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                                          isMe
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-slate-50 border-slate-200 text-slate-800"
                                        }`}
                                      >
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                          <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                          <p className="text-[11px] font-bold truncate">
                                            {comment.attachmentName || "Dokumen Lampiran"}
                                          </p>
                                          <p className="text-[9px] opacity-75 font-mono">
                                            {formatFileSize(comment.attachmentSize)}
                                          </p>
                                        </div>
                                        <a
                                          href={comment.attachmentUrl}
                                          download={comment.attachmentName || "dokumen"}
                                          className={`p-1.5 rounded-lg transition shrink-0 ${
                                            isMe
                                              ? "bg-white/20 hover:bg-white/30 text-white"
                                              : "bg-white border border-slate-200 text-slate-600 hover:text-blue-600"
                                          }`}
                                          title="Unduh file"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Footer Action: Reply Button */}
                              <div className="flex items-center gap-2 mt-1 px-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(comment);
                                    textareaRef.current?.focus();
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-blue-600 font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <CornerDownRight className="h-2.5 w-2.5" />
                                  <span>Balas</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Active Replying Quoted Preview */}
                  {replyingTo && (
                    <div className="px-4 py-2 bg-blue-50/90 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                      <div className="flex items-center gap-2 truncate">
                        <CornerDownRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                          Membalas <strong>{replyingTo.user?.name || "Pengguna"}</strong>: "
                          {replyingTo.message?.substring(0, 60) || replyingTo.attachmentName}..."
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-blue-500 hover:text-blue-800 p-1 cursor-pointer"
                        title="Batal balas"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Active Selected Attachment Preview */}
                  {selectedAttachment && (
                    <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-800 animate-in fade-in">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold truncate max-w-xs">{selectedAttachment.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({formatFileSize(selectedAttachment.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttachment(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Hapus lampiran"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Comment Input Box */}
                  <form
                    onSubmit={handleSendComment}
                    className="p-3 bg-white border-t border-slate-200 flex items-end gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition cursor-pointer shrink-0"
                      title="Lampirkan File / Screenshot"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                        placeholder="Tulis pesan atau instruksi lembar kerja... (Enter kirim, Shift+Enter baris baru)"
                        className="w-full resize-none rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 min-h-[42px] max-h-32 leading-relaxed"
                        rows={1}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingComment || (!chatInput.trim() && !selectedAttachment)}
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-2xs flex items-center justify-center min-w-[40px]"
                      title="Kirim pesan"
                    >
                      {isSendingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: LOGS & ACTIVITY TIMELINE */}
              {activeTab === "LOGS" && (
                <div className="max-h-[420px] min-h-[160px] overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                  {isLoadingLogs ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      <span className="text-xs">Memuat rekap riwayat aktivitas...</span>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2">
                      <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <History className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600">Belum ada riwayat aktivitas tercatat</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Setiap perpindahan stage, serah terima deliverable, permintaan revisi, dan aksi akan otomatis tercatat di sini.
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const badge = getLogBadge(log.actionType);
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition"
                        >
                          {/* Actor avatar / icon */}
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 mt-0.5">
                            {log.user?.avatarUrl ? (
                              <img
                                src={log.user.avatarUrl}
                                alt={log.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (log.user?.name || "?").charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{log.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDateTime(log.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                              {log.description}
                            </p>

                            {/* From -> To Stage / Status Chips */}
                            {log.fromValue && log.toValue && (
                              <div className="flex items-center gap-1.5 mt-2 text-[10px]">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                  {log.fromValue}
                                </span>
                                <span className="text-slate-400 font-bold">&rarr;</span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 font-bold">
                                  {log.toValue}
                                </span>
                              </div>
                            )}

                            {/* Actor byline */}
                            <div className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                              <span>Oleh:</span>
                              <span className="font-semibold text-slate-600">
                                {log.user?.name || "Sistem"}
                              </span>
                              {log.user?.department && (
                                <span>({log.user.department})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
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

            {/* Target Deadline & Konsolidasi Negosiasi Dua Arah */}
            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold block text-[11px]">
                  Target Deadline
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    task.suggestionStatus === "AGREED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : task.suggestionStatus === "WAITING_ASSIGNEE_CONFIRMATION" ||
                        task.suggestionStatus === "WAITING_CREATOR_CONFIRMATION"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {task.suggestionStatus === "AGREED"
                    ? "✓ Disepakati (ACC)"
                    : task.suggestionStatus === "WAITING_CREATOR_CONFIRMATION"
                    ? "Menunggu Konfirmasi Pembuat"
                    : task.suggestionStatus === "WAITING_ASSIGNEE_CONFIRMATION"
                    ? "Menunggu Konfirmasi Pengerja"
                    : "Target Awal"}
                </span>
              </div>

              {/* Main Deadline Box */}
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {formatDateTime(task.expectedDeadline)}
                    </span>
                  </div>

                  {task.status !== "COMPLETED" && onOpenDeadlineModal && (
                    <button
                      type="button"
                      onClick={() => onOpenDeadlineModal(task)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>{task.suggestionStatus === "AGREED" ? "Konsolidasi Ulang" : "Negosiasi"}</span>
                    </button>
                  )}
                </div>

                {/* If Agreed */}
                {task.suggestionStatus === "AGREED" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Batas waktu ini telah disepakati bersama oleh kedua belah pihak.</span>
                  </div>
                )}
              </div>

              {/* Case 1: Pengerja (Ashabil) melihat usulan dari Pembuat (Avila) */}
              {task.suggestionStatus === "WAITING_ASSIGNEE_CONFIRMATION" && (
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Konfirmasi Target Deadline</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Pembuat tugas menetapkan target awal:{" "}
                    <strong>{formatDateTime(task.suggestedDeadline || task.expectedDeadline)}</strong>
                    {task.suggestionReason && <span> ({task.suggestionReason})</span>}.
                  </p>

                  {isAssignee && task.status !== "COMPLETED" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAcceptDirectly}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        <span>ACC Deadline</span>
                      </button>
                      {onOpenDeadlineModal && (
                        <button
                          type="button"
                          onClick={() => onOpenDeadlineModal(task)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-amber-900 font-bold text-[11px] hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Ajukan Negosiasi</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Pembuat (Avila) melihat usulan tandingan dari Pengerja (Ashabil) */}
              {task.suggestionStatus === "WAITING_CREATOR_CONFIRMATION" && (
                <div className="p-3 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>Usulan Perubahan Deadline</span>
                  </div>
                  <div className="text-[11px] text-blue-800 space-y-1">
                    <p>
                      Pengerja mengusulkan tanggal baru:{" "}
                      <strong className="text-blue-950">{formatDateTime(task.suggestedDeadline)}</strong>
                    </p>
                    {task.suggestionReason && (
                      <p className="italic text-blue-700 bg-white/70 p-1.5 rounded-lg border border-blue-100">
                        "{task.suggestionReason}"
                      </p>
                    )}
                  </div>

                  {isCreatorOrManager && task.status !== "COMPLETED" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAcceptDirectly}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        <span>ACC Usulan</span>
                      </button>
                      {onOpenDeadlineModal && (
                        <button
                          type="button"
                          onClick={() => onOpenDeadlineModal(task)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-blue-900 font-bold text-[11px] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Ajukan Tandingan</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tracking Waktu & Tombol Kerjakan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-blue-600" />
                  Waktu Pengerjaan
                </span>
                {isTracking ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 animate-pulse border border-blue-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    Live Running
                  </span>
                ) : activeSeconds > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Dijeda
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                    Belum Mulai
                  </span>
                )}
              </div>

              {/* Big Digital Timer Display */}
              <div className="text-center py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="font-mono text-2xl font-black tracking-wider text-slate-800">
                  {formatTimerSeconds(activeSeconds)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {task.actualHours ? `Tercatat: ${task.actualHours} jam` : "Jam kerja terlacak"}
                </div>
              </div>

              {/* Action Button: Kerjakan / Jeda */}
              {isAssignee && task.status !== "COMPLETED" && (
                <button
                  type="button"
                  disabled={isUpdatingTimer}
                  onClick={handleToggleTimerModal}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 ${
                    isTracking
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isTracking ? (
                    <>
                      <PauseCircle className="h-4 w-4" />
                      <span>Jeda Pengerjaan (Pause)</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      <span>{activeSeconds > 0 ? "Lanjutkan Kerjakan" : "Kerjakan (Mulai Timer)"}</span>
                    </>
                  )}
                </button>
              )}
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
            {/* SOSMED STAGE 1: CONTENT_BRIEF */}
            {currentStageKey === "CONTENT_BRIEF" && (
              <>
                {isAssignee || isCreatorOrManager ? (
                  <button
                    onClick={() => handleMoveKanbanStage("SHOOTING")}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Next: Lanjut Shooting &rarr;</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
                    Tahap 1: Ideasi & Content Brief
                  </span>
                )}
              </>
            )}

            {/* SOSMED STAGE 2: SHOOTING */}
            {currentStageKey === "SHOOTING" && (
              <>
                {isAssignee || isCreatorOrManager ? (
                  <button
                    onClick={() => handleMoveKanbanStage("DESIGN")}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-pink-700 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Next: Lanjut Desain &rarr;</span>
                  </button>
                ) : (
                  <span className="text-xs text-purple-700 font-bold bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200">
                    Tahap 2: Shooting & Rekaman
                  </span>
                )}
              </>
            )}

            {/* SOSMED STAGE 3: DESIGN */}
            {currentStageKey === "DESIGN" && (
              <>
                {isAssignee || isCreatorOrManager ? (
                  <button
                    onClick={() => handleMoveKanbanStage("VIDEO_EDITING")}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Next: Lanjut Editing Video &rarr;</span>
                  </button>
                ) : (
                  <span className="text-xs text-pink-700 font-bold bg-pink-50 px-3.5 py-2 rounded-xl border border-pink-200">
                    Tahap 3: Desain Grafis & Feed
                  </span>
                )}
              </>
            )}

            {/* SOSMED STAGE 4: VIDEO_EDITING */}
            {currentStageKey === "VIDEO_EDITING" && (
              <>
                {isAssignee && onOpenDeliverableModal ? (
                  <button
                    onClick={() => {
                      onOpenDeliverableModal(task);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Next: Submit File & Approval &rarr;</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleMoveKanbanStage("APPROVAL")}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Next: Siap Approval &rarr;</span>
                  </button>
                )}
              </>
            )}

            {/* SOSMED STAGE 6: APPROVAL */}
            {currentStageKey === "APPROVAL" && (
              <>
                {isCreatorOrManager ? (
                  <div className="flex items-center gap-2">
                    {onOpenRevisionModal && (
                      <button
                        onClick={() => {
                          onOpenRevisionModal(task);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Minta Revisi Konten</span>
                      </button>
                    )}
                    <button
                      onClick={handleApproveReview}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Konten (Done !)</span>
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-300">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                    <span>Tahap Approval: Menunggu ACC Reviewer</span>
                  </span>
                )}
              </>
            )}

            {/* STAGE: USER_REQUESTED */}
            {currentStageKey === "USER_REQUESTED" && (
              <>
                {isAssignee ? (
                  <button
                    onClick={handleStartTask}
                    disabled={isUpdating}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Terima & Mulai Kerjakan &rarr;</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200">
                    <Inbox className="h-3.5 w-3.5 text-purple-600" />
                    <span>User Requested: Menunggu Diterima PIC</span>
                  </span>
                )}
              </>
            )}

            {/* STAGE: NOT_STARTED */}
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

      {/* Image Preview Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
              title="Tutup preview"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImageModal}
              alt="Preview attachment"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/20 bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
