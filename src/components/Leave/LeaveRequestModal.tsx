"use client";

import { useState, useRef } from "react";
import {
  X,
  Send,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  Stethoscope,
  Palmtree,
  FileCheck2,
} from "lucide-react";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLeave: any) => void;
}

export default function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: LeaveRequestModalProps) {
  const [type, setType] = useState<"SICK" | "ANNUAL_LEAVE" | "SPECIAL_LEAVE">("SICK");
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  // Attachment state
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [attachmentSizeMb, setAttachmentSizeMb] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = isNaN(diffTime) ? 1 : Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit: 5MB
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 5.0) {
      setError("Ukuran file maksimal 5 MB. Mohon kompres file atau gunakan file yang lebih kecil.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Format file tidak didukung. Mohon unggah format Gambar (JPG/PNG/WEBP) atau Dokumen PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentDataUrl(reader.result as string);
      setAttachmentName(file.name);
      setAttachmentType(file.type);
      setAttachmentSizeMb(Number(sizeMb.toFixed(2)));
    };
    reader.onerror = () => {
      setError("Gagal membaca file lampiran. Silakan coba lagi.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentDataUrl(null);
    setAttachmentName(null);
    setAttachmentType(null);
    setAttachmentSizeMb(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Alasan dan rincian permohonan wajib diisi.");
      return;
    }

    if (type === "SICK" && !attachmentDataUrl) {
      setError("Pengajuan Izin Sakit WAJIB menyertakan lampiran Surat Keterangan Dokter atau Bukti Medis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        startDate,
        endDate,
        reason: reason.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
        attachmentUrl: attachmentDataUrl || undefined,
        attachmentName: attachmentName || undefined,
        attachmentType: attachmentType || undefined,
      };

      const res = await fetch("/api/leave/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim surat permohonan");
      }

      alert("Surat pengajuan izin/cuti berhasil dikirim ke manajemen!");
      onSuccess(data.leave);
      onClose();
    } catch (err: any) {
      console.error("Submit leave error:", err);
      setError(err.message || "Terjadi kesalahan saat memproses permohonan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Surat Pengajuan Izin & Cuti
              </h3>
              <p className="text-[11px] text-slate-500">
                Difitech Human Capital • Pengajuan Resmi ke Manajemen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setType("SICK")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
              type === "SICK"
                ? "bg-white text-red-600 shadow-xs border border-slate-200"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Izin Sakit</span>
          </button>
          <button
            type="button"
            onClick={() => setType("ANNUAL_LEAVE")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
              type === "ANNUAL_LEAVE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Palmtree className="h-3.5 w-3.5" />
            <span>Cuti Tahunan</span>
          </button>
          <button
            type="button"
            onClick={() => setType("SPECIAL_LEAVE")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
              type === "SPECIAL_LEAVE"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Izin Khusus</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Range & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Tanggal Mulai Izin / Cuti *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 font-mono focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 flex items-center justify-between text-blue-900">
            <span className="font-medium">Total Durasi Hari:</span>
            <span className="font-bold font-mono text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg border border-blue-200">
              {durationDays} Hari Kalender
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Alasan & Rincian Surat Permohonan *
            </label>
            <textarea
              required
              rows={3}
              placeholder={
                type === "SICK"
                  ? "Jelaskan diagnosa dokter, gejala sakit, atau instruksi istirahat..."
                  : type === "ANNUAL_LEAVE"
                  ? "Jelaskan keperluan cuti tahunan dan delegasi tugas harian..."
                  : "Jelaskan keperluan khusus (misal: acara keluarga, pernikahan, kedukaan, dll)..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Kontak Darurat / No. WhatsApp (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: 0812-3456-7890 (Keluarga / Kerabat)"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Attachment Box (Wajib untuk SICK) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Lampiran Berkas / Surat Dokter {type === "SICK" ? "(Wajib *)" : "(Opsional)"}
              </label>
              <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Maks 5MB)</span>
            </div>

            {!attachmentDataUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
                  type === "SICK"
                    ? "border-red-300 bg-red-50/40 hover:bg-red-50"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xs text-slate-600 mb-2">
                  <UploadCloud className="h-5 w-5 text-red-600" />
                </div>
                <p className="font-bold text-slate-800 text-xs">
                  {type === "SICK"
                    ? "Klik untuk upload Surat Dokter / Resep Medis"
                    : "Klik untuk upload Dokumen / Bukti Pendukung"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dapat berupa foto kamera HP atau dokumen scan PDF
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 text-xs truncate">
                      {attachmentName}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-mono">
                      {attachmentSizeMb} MB • Berkas Terlampir
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="rounded-xl border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 transition shadow-2xs"
                  title="Hapus Lampiran"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Mengirim Surat..." : "Kirim Surat Pengajuan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
