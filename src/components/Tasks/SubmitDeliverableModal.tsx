"use client";

import { useState } from "react";
import { X, CheckCircle2, Link2, AlertCircle } from "lucide-react";

interface SubmitDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  isApprovalAction?: boolean;
  isSelfAssigned?: boolean;
  onSuccess: () => void;
}

export default function SubmitDeliverableModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  isApprovalAction = false,
  isSelfAssigned = false,
  onSuccess,
}: SubmitDeliverableModalProps) {
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg("");

      if (!deliverableUrl.trim()) {
        setErrorMsg("Link bukti pengerjaan (Google Drive / Canva / Web) wajib diisi untuk menyelesaikan tugas!");
        setIsLoading(false);
        return;
      }

      let payload: any = {};
      if (isApprovalAction) {
        payload = {
          updateKanbanStage: {
            stage: "APPROVAL",
            deliverableUrl: deliverableUrl.trim() || undefined,
            completionNote: completionNote.trim() || undefined,
          },
        };
      } else {
        payload = {
          submitDeliverable: {
            deliverableUrl: deliverableUrl.trim() || undefined,
            completionNote: completionNote.trim() || undefined,
          },
        };
      }

      const res = await fetch(`/api/workspace/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyelesaikan tugas");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isSelfAssigned
                  ? "Submit Bukti Pengerjaan (Selesai)"
                  : isApprovalAction
                  ? "Approve & Submit Hasil Akhir"
                  : "Submit Hasil Kerja (Untuk Direview)"}
              </h3>
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

          {isSelfAssigned ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800 leading-relaxed">
              <span className="font-bold">Tugas Mandiri / Pribadi:</span> Anda tidak memerlukan proses review dari pihak lain. Cukup lampirkan link bukti hasil kerja (Google Drive, Canva, link website/dokumen) untuk menyelesaikan tugas ini secara resmi (<strong>Done !</strong>).
            </div>
          ) : (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-800 leading-relaxed">
              <span className="font-bold">Info Review Pemberi Tugas:</span> Hasil kerja Anda akan diteruskan ke pemberi tugas untuk direview (status <em>To Be Reviewed</em>). Begitu disetujui, tugas Anda otomatis berstatus <strong>Done !</strong> dan tercatat tuntas di lembar kerja Anda.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isSelfAssigned
                ? "Link Bukti Hasil Kerja (Wajib diisi)"
                : "Link Hasil Akhir / Deliverables (Google Drive, Canva, Video, Dokumen)"}
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://drive.google.com/... atau link hasil kerja"
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <Link2 className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Penyelesaian (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Tambahkan keterangan singkat hasil pengerjaan..."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
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
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isSelfAssigned
                  ? "Simpan Bukti & Selesai (Done !)"
                  : isApprovalAction
                  ? "Setujui & Selesaikan"
                  : "Kirim Hasil & Ajukan Review"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
