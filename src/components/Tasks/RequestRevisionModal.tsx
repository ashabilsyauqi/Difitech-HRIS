"use client";

import { useState } from "react";
import { X, RefreshCw, AlertCircle, Send, Sparkles } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

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
  const [noteHtml, setNoteHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = noteHtml.replace(/<[^>]*>?/gm, "").trim();
    const hasMedia = noteHtml.includes("<img") || noteHtml.includes("<input");

    if (!cleanText && !hasMedia) {
      setErrorMsg("Tuliskan instruksi atau sertakan screenshot poin-poin yang perlu direvisi.");
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
            revisionNote: noteHtml,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instruksi & Catatan Revisi</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-md">
                [{brandName}] {taskTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-3 text-xs text-rose-900 leading-relaxed flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">WYSIWYG Revisi & Screenshot:</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Anda dapat menulis instruksi, memberi checklist target revisi, dan <strong>menempel langsung screenshot (Ctrl+V / Cmd+V)</strong> atau mengunggah gambar bagian mana yang perlu diperbaiki.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Poin & Instruksi Revisi (Dapat Tempel Screenshot) <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={noteHtml}
              onChange={setNoteHtml}
              placeholder="Jelaskan detail yang perlu diperbaiki, buat checklist poin revisi, atau langsung tekan Ctrl+V untuk menempel screenshot..."
              minHeight="220px"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isLoading ? "Mengirim..." : "Kirim Instruksi Revisi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
