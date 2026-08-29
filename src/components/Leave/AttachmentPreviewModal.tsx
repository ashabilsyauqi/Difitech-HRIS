"use client";

import { X, Download, FileText, ExternalLink, Paperclip } from "lucide-react";

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  title?: string;
  applicantName?: string;
}

export default function AttachmentPreviewModal({
  isOpen,
  onClose,
  attachmentUrl,
  attachmentName,
  attachmentType,
  title = "Lampiran Surat Izin / Cuti",
  applicantName,
}: AttachmentPreviewModalProps) {
  if (!isOpen || !attachmentUrl) return null;

  const isPdf =
    attachmentType === "application/pdf" ||
    attachmentName?.toLowerCase().endsWith(".pdf") ||
    attachmentUrl.startsWith("data:application/pdf");

  const fileName = attachmentName || (isPdf ? "lampiran_dokumen.pdf" : "lampiran_surat.jpg");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = attachmentUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Paperclip className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {applicantName ? `Pemohon: ${applicantName} • ` : ""}
                {fileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh Berkas</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-950 flex items-center justify-center p-3 sm:p-4 min-h-[350px]">
          {isPdf ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-3 border border-red-500/30">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{fileName}</h4>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Dokumen PDF resmi lampiran surat izin/dokter. Anda dapat melihat langsung atau mengunduhnya.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition border border-white/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka di Tab Baru</span>
                </a>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-md shadow-red-600/30"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh PDF</span>
                </button>
              </div>
              <div className="w-full mt-6 h-[400px] rounded-xl overflow-hidden border border-slate-800">
                <iframe
                  src={attachmentUrl}
                  title="PDF Preview"
                  className="w-full h-full"
                />
              </div>
            </div>
          ) : (
            <img
              src={attachmentUrl}
              alt="Lampiran Dokumen"
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
            />
          )}
        </div>
      </div>
    </div>
  );
}
