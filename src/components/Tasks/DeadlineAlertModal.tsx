"use client";

import { AlertTriangle, Clock, Calendar, ArrowRight, MessageSquare, Check, X } from "lucide-react";

interface DeadlineAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  onSelectTask: (task: any) => void;
  onOpenDeadlineModal: (task: any) => void;
  formatDateTime: (iso?: string | null) => string;
}

export default function DeadlineAlertModal({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenDeadlineModal,
  formatDateTime,
}: DeadlineAlertModalProps) {
  if (!isOpen || !tasks || tasks.length === 0) return null;

  const getUrgencyBadge = (expectedDeadline: string) => {
    try {
      const now = new Date();
      const deadline = new Date(expectedDeadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
        return {
          label: "🚨 Terlewat Deadline",
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          cardBorder: "border-rose-300 bg-rose-50/40",
        };
      }
      if (diffHours <= 24) {
        return {
          label: "🔥 Hari Ini (< 24 Jam)",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          cardBorder: "border-amber-300 bg-amber-50/40",
        };
      }
      return {
        label: "⚠️ H-1 Mendekati Deadline",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
        cardBorder: "border-orange-200 bg-orange-50/30",
      };
    } catch {
      return {
        label: "Batas Waktu",
        badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
        cardBorder: "border-slate-200 bg-slate-50",
      };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with warning accent */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-sm">
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Peringatan Deadline Tugas
                </h3>
                <span className="rounded-full bg-white/30 backdrop-blur-xs px-2.5 py-0.5 text-xs font-black text-white">
                  {tasks.length} Tugas H-1
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                Ada tugas aktif yang mendekati atau telah mencapai batas waktu pengerjaan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          <p className="text-xs text-slate-500 font-medium">
            Segera selesaikan tugas di bawah ini atau kelola batas waktu pengerjaan Anda:
          </p>

          <div className="space-y-3 pt-1">
            {tasks.map((task) => {
              const urgency = getUrgencyBadge(task.expectedDeadline);
              const isSelfAssigned = Boolean(
                (task.userId && task.creatorId && task.userId === task.creatorId) ||
                (task.user && task.creator && task.user.id === task.creator.id) ||
                !task.creatorId ||
                !task.creator
              );

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition shadow-2xs space-y-3 ${urgency.cardBorder}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${urgency.badgeClass}`}
                        >
                          {urgency.label}
                        </span>
                        {isSelfAssigned && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            Tugas Mandiri
                          </span>
                        )}
                        {task.brandName && (
                          <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {task.brandName}
                          </span>
                        )}
                        {task.departmentCard && (
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {task.departmentCard}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-bold text-slate-700">
                        {formatDateTime(task.expectedDeadline)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Pembuat:{" "}
                      <span className="font-bold text-slate-700">
                        {isSelfAssigned ? "Saya Sendiri (Tugas Mandiri)" : (task.creator?.name || "Rekan Kerja")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!isSelfAssigned && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeadlineModal(task);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
                        <span>Ajukan Negosiasi Deadline</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectTask(task);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                    >
                      <span>Buka Lembar Kerja</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Peringatan ini otomatis muncul pada login pertama sesi kerja.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 transition cursor-pointer shadow-2xs"
          >
            Saya Mengerti / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
