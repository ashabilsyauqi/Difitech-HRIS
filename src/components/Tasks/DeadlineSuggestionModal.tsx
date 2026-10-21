"use client";

import { useState } from "react";
import { X, Clock, Calendar, Check, AlertCircle } from "lucide-react";

interface DeadlineSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  currentExpectedDeadline?: string | null;
  onSuccess: () => void;
}

export default function DeadlineSuggestionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  currentExpectedDeadline,
  onSuccess,
}: DeadlineSuggestionModalProps) {
  const [suggestedDeadline, setSuggestedDeadline] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedDeadline) {
      setErrorMsg("Pilih tanggal dan jam deadline yang diusulkan.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestDeadline: {
            suggestedDeadline,
            reason,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengajukan perubahan deadline");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ajukan Saran Deadline (Suggestion)</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentExpectedDeadline && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Target Deadline Awal:</span>{" "}
              {new Date(currentExpectedDeadline).toLocaleString("id-ID")}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Usulan Deadline Baru (Tanggal & Jam) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={suggestedDeadline}
                onChange={(e) => setSuggestedDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <Calendar className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Alasan Penyesuaian Deadline <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan alasan (misal: perlu waktu shooting tambahan, antrean render video, dsb)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Kirim Usulan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
