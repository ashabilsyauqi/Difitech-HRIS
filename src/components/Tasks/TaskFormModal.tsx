"use client";

import { useState, useEffect, useRef } from "react";
import { X, PlusCircle, CheckCircle2, Clock, Link as LinkIcon, AlertCircle, Image as ImageIcon, Trash2, Upload } from "lucide-react";

export interface TaskItem {
  id?: string;
  title: string;
  description?: string | null;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  estimatedHours: number;
  actualHours?: number | null;
  deliverableUrl?: string | null;
  deliverableAttachment?: string | null;
  completionNote?: string | null;
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<TaskItem>) => Promise<void>;
  initialData?: TaskItem | null;
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Difitech");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED">("PENDING");
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [actualHours, setActualHours] = useState<number | undefined>(undefined);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableAttachment, setDeliverableAttachment] = useState<string>("");
  const [completionNote, setCompletionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "Difitech");
      setPriority(initialData.priority || "MEDIUM");
      setStatus(initialData.status || "PENDING");
      setEstimatedHours(initialData.estimatedHours || 1.0);
      setActualHours(initialData.actualHours || undefined);
      setDeliverableUrl(initialData.deliverableUrl || "");
      setDeliverableAttachment(initialData.deliverableAttachment || "");
      setCompletionNote(initialData.completionNote || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("Difitech");
      setPriority("MEDIUM");
      setStatus("PENDING");
      setEstimatedHours(2.0);
      setActualHours(undefined);
      setDeliverableUrl("");
      setDeliverableAttachment("");
      setCompletionNote("");
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  // Handle clipboard paste for screenshots anywhere in the modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setDeliverableAttachment(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa format gambar (PNG, JPG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDeliverableAttachment(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Judul tugas wajib diisi");
      return;
    }

    if (status === "COMPLETED") {
      if (!deliverableUrl.trim() && !deliverableAttachment) {
        setErrorMsg("Deliverables wajib diisi saat status selesai! Lampirkan Link Google Drive ATAU Unggah/Paste Screenshot bukti.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        id: initialData?.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status,
        estimatedHours: Number(estimatedHours) || 1.0,
        actualHours: actualHours ? Number(actualHours) : null,
        deliverableUrl: deliverableUrl.trim() || null,
        deliverableAttachment: deliverableAttachment || null,
        completionNote: completionNote.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["Development", "Design", "Quality Assurance", "Operations", "Meeting", "Marketing", "Research"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <PlusCircle className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {initialData ? "Ubah Tugas Harian" : "Daftarkan Tugas Harian Baru"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Judul Tugas *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Implementasi modul CamStamp Canvas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Brand / Klien *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Difitech, Client A, Brand X"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
              >
                <option value="LOW">Rendah (Low)</option>
                <option value="MEDIUM">Sedang (Medium)</option>
                <option value="HIGH">Tinggi (High)</option>
                <option value="URGENT">Mendesak (Urgent ⚡)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Status Tugas
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
            >
              <option value="PENDING">Belum Dikerjakan (Backlog)</option>
              <option value="IN_PROGRESS">Sedang Berjalan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="BLOCKED">Terkendala (Blocked)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Deskripsi & Rincian Tugas
            </label>
            <textarea
              rows={2}
              placeholder="Rincian yang perlu diselesaikan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Bukti Deliverable */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Bukti Hasil Kerja (Deliverables)
                {status === "COMPLETED" && <span className="text-red-500 font-bold">*</span>}
              </span>
              {status === "COMPLETED" && (
                <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                  Wajib Diisi (Link Drive / SS)
                </span>
              )}
            </div>

            {/* Option A: Link Drive / Dokumen */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                1. Link Google Drive / Figma / GitHub / Dokumen:
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau https://github.com/..."
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Option B: Screenshot / Image File */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                2. Screenshot Bukti Kerja (Unggah atau Tekan Ctrl+V / Cmd+V untuk Paste Langsung):
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {deliverableAttachment ? (
                <div className="relative rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={deliverableAttachment}
                      alt="Deliverable"
                      className="h-12 w-12 rounded object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="text-[11px] text-slate-700 truncate">
                      <span className="font-bold text-emerald-600">✓ Screenshot terlampir</span>
                      <p className="text-[10px] text-slate-400">Siap disimpan sebagai bukti hasil</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliverableAttachment("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded px-2 py-1 transition cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-red-400 bg-white rounded-lg p-3 text-center transition flex flex-col items-center justify-center gap-1 group"
                >
                  <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-red-600">
                    <Upload className="h-4 w-4" />
                    <span className="text-xs font-semibold">Klik untuk pilih gambar, atau Paste (Ctrl+V)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Mendukung PNG, JPG, JPEG, WEBP langsung dari clipboard</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Waktu Aktual Terpakai (Jam):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Contoh: 2.5"
                  value={actualHours || ""}
                  onChange={(e) => setActualHours(parseFloat(e.target.value) || undefined)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Catatan Selesai:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Telah diuji di staging"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{initialData ? "Simpan Perubahan" : "Daftarkan Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
