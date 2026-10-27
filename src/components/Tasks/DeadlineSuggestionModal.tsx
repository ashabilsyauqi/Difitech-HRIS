"use client";

import { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  Check,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";

interface DeadlineSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  currentExpectedDeadline?: string | null;
  currentlySuggestedDeadline?: string | null;
  suggestionReason?: string | null;
  suggestionStatus?: string | null;
  isCreator?: boolean;
  isAssignee?: boolean;
  isSelfAssigned?: boolean;
  onSuccess: () => void;
}

export default function DeadlineSuggestionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  currentExpectedDeadline,
  currentlySuggestedDeadline,
  suggestionReason,
  suggestionStatus,
  isCreator = false,
  isAssignee = false,
  isSelfAssigned = false,
  onSuccess,
}: DeadlineSuggestionModalProps) {
  const isSelf = Boolean(isSelfAssigned || (isCreator && isAssignee));
  const [proposedDeadline, setProposedDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      const targetDate = currentlySuggestedDeadline || currentExpectedDeadline;
      if (targetDate) {
        try {
          const d = new Date(targetDate);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            setProposedDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
          }
        } catch {}
      } else {
        setProposedDeadline("");
      }
      setReason("");
    }
  }, [isOpen, currentExpectedDeadline, currentlySuggestedDeadline]);

  if (!isOpen) return null;

  const formatDate = (val?: string | null) => {
    if (!val) return "Belum ditentukan";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "Format tanggal tidak valid";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPendingCreatorApproval = suggestionStatus === "WAITING_CREATOR_CONFIRMATION";
  const isPendingAssigneeApproval = suggestionStatus === "WAITING_ASSIGNEE_CONFIRMATION";

  const canDirectlyAccept =
    (isPendingCreatorApproval && isCreator) ||
    (isPendingAssigneeApproval && isAssignee) ||
    (!isPendingCreatorApproval && !isPendingAssigneeApproval && Boolean(currentlySuggestedDeadline));

  const activeProposalDate = currentlySuggestedDeadline || currentExpectedDeadline;

  // Handle Direct ACC (Accept)
  const handleAcceptDeadline = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consolidateDeadline: {
            action: "ACCEPT",
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyetujui deadline");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Propose or Counter-Propose
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDeadline) {
      setErrorMsg("Pilih tanggal dan jam deadline yang diajukan.");
      return;
    }
    if (!isSelf && !reason.trim()) {
      setErrorMsg("Tuliskan catatan atau alasan penyesuaian deadline.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consolidateDeadline: {
            action: isSelf ? "PROPOSE" : currentlySuggestedDeadline ? "COUNTER_PROPOSE" : "PROPOSE",
            proposedDeadline,
            reason: reason.trim() || (isSelf ? "Penyesuaian target waktu mandiri" : undefined),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui deadline");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-600 p-2 text-white shadow-xs">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isSelf ? "Atur Target Waktu Mandiri" : "Konsolidasi & Negosiasi Deadline"}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
                {taskTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSelf && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-[11px] text-emerald-800 leading-relaxed">
              <span className="font-bold">Tugas Mandiri / Pribadi:</span> Anda dapat langsung mengatur atau mengubah target batas waktu pengerjaan tugas Anda sendiri tanpa memerlukan negosiasi persetujuan dari pihak lain.
            </div>
          )}

          {/* Current Status Banner */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Status Tenggat Saat Ini
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isSelf || suggestionStatus === "AGREED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isPendingCreatorApproval || isPendingAssigneeApproval
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {isSelf
                  ? "✓ Target Mandiri"
                  : suggestionStatus === "AGREED"
                  ? "✓ Disepakati (ACC)"
                  : isPendingCreatorApproval
                  ? "Menunggu Konfirmasi Pembuat"
                  : isPendingAssigneeApproval
                  ? "Menunggu Konfirmasi Pengerja"
                  : "Target Awal"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  Target Awal
                </span>
                <span className="font-mono text-slate-700 font-bold">
                  {formatDate(currentExpectedDeadline)}
                </span>
              </div>

              {!isSelf && currentlySuggestedDeadline && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-600 block mb-0.5">
                    Ajuan Terkini
                  </span>
                  <span className="font-mono text-blue-900 font-bold">
                    {formatDate(currentlySuggestedDeadline)}
                  </span>
                </div>
              )}
            </div>

            {suggestionReason && (
              <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 italic">
                <span className="font-semibold text-slate-500 not-italic">Catatan: </span>
                "{suggestionReason}"
              </div>
            )}
          </div>

          {/* Direct ACC Button if the other party proposed and waiting for response */}
          {!isSelf && canDirectlyAccept && activeProposalDate && suggestionStatus !== "AGREED" && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Setujui Ajuan Deadline Ini?</span>
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Menyetujui <strong>{formatDate(activeProposalDate)}</strong> sebagai batas waktu final tugas ini.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAcceptDeadline}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>ACC Deadline Ini</span>
              </button>
            </div>
          )}

          {/* Counter Propose / New Proposal Form */}
          <form onSubmit={handleSubmitProposal} className="space-y-3.5 pt-1">
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800 block mb-1">
                {isSelf
                  ? "Pilih Batas Waktu Baru"
                  : currentlySuggestedDeadline
                  ? "Ajukan Tandingan Deadline Baru"
                  : "Ajukan Usulan Deadline Baru"}
              </span>
              <p className="text-[11px] text-slate-400 mb-2.5">
                {isSelf
                  ? "Tentukan tanggal dan jam target selesai untuk tugas mandiri Anda."
                  : "Tentukan tanggal baru jika ajuan saat ini belum sesuai dengan alur pengerjaan tim."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Deadline Baru (Tanggal & Jam) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={proposedDeadline}
                  onChange={(e) => setProposedDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isSelf ? "Catatan Tambahan (Opsional)" : "Alasan / Pertimbangan Penyesuaian"} {!isSelf && <span className="text-red-500">*</span>}
              </label>
              <textarea
                required={!isSelf}
                rows={2}
                placeholder={
                  isSelf
                    ? "Keterangan opsional untuk pengingat pribadi Anda..."
                    : "Misal: butuh waktu shooting tambahan 2 hari, antrean render video, review aset klien, dsb..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>
                  {isSelf
                    ? "Simpan Target Waktu Baru"
                    : currentlySuggestedDeadline
                    ? "Kirim Tandingan Deadline"
                    : "Kirim Usulan Deadline"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
