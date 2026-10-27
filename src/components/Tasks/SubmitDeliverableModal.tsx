"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Link2,
  AlertCircle,
  ImageIcon,
  Upload,
  Trash2,
  Loader2,
  Maximize2,
} from "lucide-react";
import { compressImageFile } from "@/lib/deliverable-utils";

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
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setDeliverableUrl("");
      setCompletionNote("");
      setScreenshots([]);
      setPreviewZoomImage(null);
      setErrorMsg("");
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle Ctrl+V / Cmd+V paste screenshot directly
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) return;

      e.preventDefault();
      await processFiles(imageFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, screenshots.length]);

  if (!isOpen) return null;

  const processFiles = async (files: File[]) => {
    const remainingSlots = 3 - screenshots.length;
    if (remainingSlots <= 0) {
      setErrorMsg("Maksimal 3 screenshot sudah tercapai (3/3). Hapus salah satu jika ingin mengganti.");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMsg(`Hanya ${remainingSlots} gambar yang ditambahkan karena batas maksimal 3 gambar.`);
    } else {
      setErrorMsg("");
    }

    try {
      setIsCompressing(true);
      const compressedList: string[] = [];
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;
        const compressedBase64 = await compressImageFile(file, 1600, 0.85);
        compressedList.push(compressedBase64);
      }

      setScreenshots((prev) => [...prev, ...compressedList]);
    } catch (err: any) {
      console.error("Compression error:", err);
      setErrorMsg("Gagal memproses gambar. Pastikan format gambar valid (PNG/JPG/WebP).");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    await processFiles(fileList);
  };

  const handleRemoveScreenshot = (indexToRemove: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg("");

      const trimmedUrl = deliverableUrl.trim();
      const hasScreenshots = screenshots.length > 0;

      if (!trimmedUrl && !hasScreenshots) {
        setErrorMsg("Wajib melampirkan minimal 1 Screenshot bukti pengerjaan ATAU Tautan Link!");
        setIsLoading(false);
        return;
      }

      const deliverableAttachment = hasScreenshots ? JSON.stringify(screenshots) : undefined;

      let payload: any = {};
      if (isApprovalAction) {
        payload = {
          updateKanbanStage: {
            stage: "APPROVAL",
            deliverableUrl: trimmedUrl || undefined,
            deliverableAttachment,
            completionNote: completionNote.trim() || undefined,
          },
        };
      } else {
        payload = {
          submitDeliverable: {
            deliverableUrl: trimmedUrl || undefined,
            deliverableAttachment,
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
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                <p className="text-[11px] text-slate-500 truncate max-w-[280px]">{taskTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSelfAssigned ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-800 leading-relaxed">
                <span className="font-bold">Tugas Mandiri / Pribadi:</span> Anda tidak memerlukan proses review dari pihak lain. Lampirkan screenshot (maks. 3) atau link bukti hasil kerja untuk menyelesaikan tugas ini secara resmi (<strong>Done !</strong>).
              </div>
            ) : (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-800 leading-relaxed">
                <span className="font-bold">Info Review Pemberi Tugas:</span> Bukti kerja Anda akan diteruskan ke pemberi tugas untuk direview. Begitu disetujui, tugas Anda otomatis berstatus <strong>Done !</strong>.
              </div>
            )}

            {/* Upload Screenshot Hasil Kerja (Maksimal 3 Gambar) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                  <span>Upload Screenshot Hasil Kerja (Maks. 3 Gambar)</span>
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  screenshots.length === 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {screenshots.length} / 3 Gambar
                </span>
              </div>

              {/* Grid Thumbnail Gambar yang Diupload */}
              {screenshots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  {screenshots.map((ss, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ss}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        SS #{idx + 1}
                      </span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewZoomImage(ss)}
                          className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white transition cursor-pointer"
                          title="Lihat ukuran penuh"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(idx)}
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                          title="Hapus gambar ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropzone & Tombol Upload */}
              {screenshots.length < 3 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 rounded-xl p-3 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-600 disabled:opacity-50"
                  >
                    {isCompressing ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-600 py-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Mengompres & memproses gambar...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Klik untuk pilih screenshot atau drag ke sini</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Tips: Bisa juga langsung tekan <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[9px]">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[9px]">Cmd+V</kbd> untuk paste screenshot langsung
                        </p>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Input Link Bukti Kerja (Google Drive / Canva / Web) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Link Hasil Akhir (Google Drive, Canva, Web)
                {screenshots.length > 0 ? (
                  <span className="text-[10px] font-normal text-slate-500 ml-1.5">(Opsional karena sudah ada screenshot)</span>
                ) : (
                  <span className="text-[10px] font-normal text-slate-500 ml-1.5">(Wajib jika tanpa screenshot)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau link hasil kerja"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <Link2 className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Catatan Penyelesaian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Catatan Penyelesaian (Opsional)
              </label>
              <textarea
                rows={2}
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
                disabled={isLoading || isCompressing}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || isCompressing}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-2xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
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

      {/* Lightbox Zoom Preview untuk Screenshot di Modal */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                Preview Screenshot Deliverable
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center bg-slate-900/90 rounded-b-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewZoomImage}
                alt="Zoom Screenshot"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
