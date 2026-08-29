"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import LeaveRequestModal from "@/components/Leave/LeaveRequestModal";
import AttachmentPreviewModal from "@/components/Leave/AttachmentPreviewModal";
import {
  FileCheck2,
  Plus,
  Stethoscope,
  Palmtree,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Paperclip,
  Eye,
  AlertCircle,
} from "lucide-react";

export default function EmployeeLeavePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    url: string;
    name: string;
    type?: string;
    title?: string;
  } | null>(null);

  const fetchLeaveRequests = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const res = await fetch("/api/leave/request");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Fetch leave page error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Surat Izin & Cuti Difitech HRIS...</p>
        </div>
      </div>
    );
  }

  // Summary counts
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const sickDaysTotal = requests
    .filter((r) => r.type === "SICK" && r.status === "APPROVED")
    .reduce((acc, r) => acc + (r.durationDays || 1), 0);
  const annualLeaveDaysTotal = requests
    .filter((r) => r.type === "ANNUAL_LEAVE" && r.status === "APPROVED")
    .reduce((acc, r) => acc + (r.durationDays || 1), 0);

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "SICK":
        return {
          label: "Izin Sakit",
          icon: Stethoscope,
          badge: "bg-red-50 text-red-700 border-red-200",
        };
      case "ANNUAL_LEAVE":
        return {
          label: "Cuti Tahunan",
          icon: Palmtree,
          badge: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "SPECIAL_LEAVE":
        return {
          label: "Izin Khusus",
          icon: FileText,
          badge: "bg-purple-50 text-purple-700 border-purple-200",
        };
      default:
        return {
          label: t,
          icon: FileText,
          badge: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "APPROVED":
        return {
          label: "Disetujui Management",
          icon: CheckCircle2,
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
        };
      case "REJECTED":
        return {
          label: "Ditolak",
          icon: XCircle,
          badge: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
        };
      case "PENDING":
      default:
        return {
          label: "Menunggu Review",
          icon: Clock,
          badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
        };
    }
  };

  const handleOpenPreview = (r: any) => {
    if (!r.attachmentUrl) return;
    setSelectedAttachment({
      url: r.attachmentUrl,
      name: r.attachmentName || "Lampiran_Dokumen",
      type: r.attachmentType,
      title: `Lampiran ${r.type === "SICK" ? "Surat Dokter" : "Dokumen"} - ${r.startDate}`,
    });
    setPreviewModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-red-100 bg-gradient-to-r from-red-50/70 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <FileCheck2 className="h-4 w-4" />
                <span>Portal Pengajuan Surat Izin & Cuti</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Pengajuan Izin Sakit, Cuti & Keperluan Khusus
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kirimkan surat permohonan resmi langsung ke pihak manajemen dilengkapi dokumen lampiran.
              </p>
            </div>

            <button
              onClick={() => setRequestModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Surat Pengajuan</span>
            </button>
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Izin Sakit Disetujui</span>
                <Stethoscope className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {sickDaysTotal} Hari
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Cuti Tahunan Digunakan</span>
                <Palmtree className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {annualLeaveDaysTotal} Hari
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Menunggu Review</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
                {pendingCount} Permohonan
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Total Disetujui</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                {approvedCount} Disetujui
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Riwayat Surat Pengajuan Izin & Cuti Anda
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {requests.length} Catatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Tipe Pengajuan</th>
                    <th className="px-4 py-4">Rentang Tanggal</th>
                    <th className="px-4 py-4">Durasi</th>
                    <th className="px-4 py-4">Alasan Permohonan</th>
                    <th className="px-4 py-4">Dokumen Lampiran</th>
                    <th className="px-4 py-4">Status & Catatan Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                        <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        Belum ada surat pengajuan izin atau cuti yang dibuat.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => {
                      const typeInfo = getTypeBadge(r.type);
                      const statusInfo = getStatusBadge(r.status);
                      const TypeIcon = typeInfo.icon;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          {/* Tipe Pengajuan */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold ${typeInfo.badge}`}>
                              <TypeIcon className="h-3.5 w-3.5" />
                              <span>{typeInfo.label}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Diajukan: {new Date(r.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </td>

                          {/* Rentang Tanggal */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900">
                              {r.startDate} s/d {r.endDate}
                            </div>
                            {r.emergencyContact && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Kontak: {r.emergencyContact}
                              </div>
                            )}
                          </td>

                          {/* Durasi */}
                          <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                            {r.durationDays} Hari
                          </td>

                          {/* Alasan */}
                          <td className="px-4 py-4 max-w-xs">
                            <p className="text-slate-700 line-clamp-2 leading-relaxed">
                              {r.reason}
                            </p>
                          </td>

                          {/* Lampiran Dokumen */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {r.attachmentUrl ? (
                              <button
                                onClick={() => handleOpenPreview(r)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Lihat Lampiran</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Tanpa Lampiran
                              </span>
                            )}
                          </td>

                          {/* Status & Review Notes */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] ${statusInfo.badge}`}>
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo.label}</span>
                            </span>
                            {r.reviewNotes && (
                              <p className="text-[11px] text-slate-500 mt-1 italic">
                                "{r.reviewNotes}"
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Leave Request Form Modal */}
      <LeaveRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSuccess={() => fetchLeaveRequests()}
      />

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachmentUrl={selectedAttachment?.url}
        attachmentName={selectedAttachment?.name}
        attachmentType={selectedAttachment?.type}
        title={selectedAttachment?.title}
        applicantName={user?.name}
      />
    </div>
  );
}
