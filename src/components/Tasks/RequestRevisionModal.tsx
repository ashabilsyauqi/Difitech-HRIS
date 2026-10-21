"use client";

import { useState } from "react";
import { X, RefreshCw, AlertCircle, Send } from "lucide-react";

interface RequestRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  brandName: string;
  onSuccess: () => void;
}

export default function RequestRevisionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  brandName,
  onSuccess,
}: RequestRevisionModalProps) {
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg("Tuliskan poin-poin yang perlu direvisi.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewAction: {
            action: "REVISION",
            revisionNote: note.trim(),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengajukan revisi");
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
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instruksi Catatan Revisi</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                [{brandName}] {taskTitle}
              </p>
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

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 leading-relaxed">
            <span className="font-bold">Info Revisi:</span> Catatan revisi ini akan langsung muncul di kartu tugas pengerja dan mengubah statusnya menjadi <strong>Perlu Revisi</strong> agar pengerja dapat memperbaiki dan mengirimkan ulang hasilnya.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Poin & Instruksi Revisi <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan bagian mana yang perlu diperbaiki, misalnya: 'Cut video di detik 0:15 dipercepat, font judul ganti warna kuning'..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
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
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Kirim Permintaan Revisi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
