"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AttachmentPreviewModal from "@/components/Leave/AttachmentPreviewModal";
import {
  FileCheck2,
  Stethoscope,
  Palmtree,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Check,
  X,
  Filter,
  RefreshCw,
  AlertCircle,
  User,
} from "lucide-react";

export default function ManagerLeaveApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Attachment Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    url: string;
    name: string;
    type?: string;
    title?: string;
    applicantName?: string;
  } | null>(null);

  const fetchRequests = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      if (authData.user.role !== "ADMIN" && authData.user.role !== "MANAGER") {
        router.push("/dashboard");
        return;
      }

      const res = await fetch("/api/manager/leave");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Manager leave fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Antrean Persetujuan Izin & Cuti...</p>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q);

    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    const matchesType = selectedType === "ALL" || r.type === selectedType;
    const matchesDept = selectedDept === "ALL" || r.user?.department === selectedDept;

    return matchesSearch && matchesStatus && matchesType && matchesDept;
  });

  // Summary Metrics
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const sickCount = requests.filter((r) => r.type === "SICK" && r.status === "PENDING").length;
  const annualCount = requests.filter((r) => r.type === "ANNUAL_LEAVE" && r.status === "PENDING").length;
  const approvedTotal = requests.filter((r) => r.status === "APPROVED").length;

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
          label: "Disetujui",
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
        };
      case "REJECTED":
        return {
          label: "Ditolak",
          badge: "bg-rose-50 text-rose-800 border-rose-200 font-bold",
        };
      case "PENDING":
      default:
        return {
          label: "Menunggu Review",
          badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
        };
    }
  };

  const handleOpenActionModal = (reqItem: any, type: "APPROVE" | "REJECT") => {
    setSelectedRequest(reqItem);
    setActionType(type);
    setReviewNotes(
      type === "APPROVE"
        ? "Permohonan izin/cuti telah diverifikasi dan disetujui."
        : "Permohonan belum dapat disetujui."
    );
    setActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/manager/leave/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          reviewNotes: reviewNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses permohonan");

      alert(data.message || "Status permohonan berhasil diperbarui!");
      setActionModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPreview = (r: any) => {
    if (!r.attachmentUrl) return;
    setSelectedAttachment({
      url: r.attachmentUrl,
      name: r.attachmentName || "Lampiran_Dokumen",
      type: r.attachmentType,
      title: `Lampiran ${r.type === "SICK" ? "Surat Dokter" : "Dokumen"} - ${r.user?.name}`,
      applicantName: r.user?.name,
    });
    setPreviewModalOpen(true);
  };

  const departmentsList = Array.from(
    new Set(requests.map((r) => r.user?.department).filter(Boolean))
  );

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
                <span>Portal Persetujuan Izin & Cuti Karyawan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Verifikasi & Review Surat Izin / Cuti
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tinjau surat permohonan, periksa keabsahan lampiran surat dokter, dan berikan persetujuan resmi.
              </p>
            </div>

            <button
              onClick={fetchRequests}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Perbarui Data</span>
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold uppercase">Antrean Menunggu</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900 mt-2 font-mono">
                {pendingCount} Permohonan
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Izin Sakit Baru</span>
                <Stethoscope className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-2 font-mono">
                {sickCount} Menunggu
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Cuti Tahunan Baru</span>
                <Palmtree className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
                {annualCount} Menunggu
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase">Total Telah Disetujui</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                {approvedTotal} Permohonan
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Status Review
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">⏳ Menunggu Review ({pendingCount})</option>
                  <option value="APPROVED">✅ Disetujui</option>
                  <option value="REJECTED">❌ Ditolak</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Tipe Permohonan
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="SICK">🏥 Izin Sakit</option>
                  <option value="ANNUAL_LEAVE">🏖️ Cuti Tahunan</option>
                  <option value="SPECIAL_LEAVE">📌 Izin Keperluan Khusus</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Departemen
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="ALL">Semua Departemen</option>
                  {departmentsList.map((d: any) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Cari Karyawan / Alasan
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nama / alasan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table of Requests */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Karyawan & Pemohon</th>
                    <th className="px-4 py-4">Tipe Izin</th>
                    <th className="px-4 py-4">Rentang & Durasi</th>
                    <th className="px-4 py-4">Alasan Permohonan</th>
                    <th className="px-4 py-4">Dokumen Lampiran</th>
                    <th className="px-4 py-4">Status Review</th>
                    <th className="px-4 py-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400">
                        <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        Tidak ada permohonan izin/cuti pada filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => {
                      const typeInfo = getTypeBadge(r.type);
                      const statusInfo = getStatusBadge(r.status);
                      const TypeIcon = typeInfo.icon;
                      const isPending = r.status === "PENDING";

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          {/* Karyawan */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs flex-shrink-0">
                                {r.user?.name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{r.user?.name}</div>
                                <div className="text-[10px] text-slate-400">{r.user?.department || "Umum"} • {r.user?.jobTitle || "Karyawan"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Tipe Izin */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold ${typeInfo.badge}`}>
                              <TypeIcon className="h-3.5 w-3.5" />
                              <span>{typeInfo.label}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(r.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </td>

                          {/* Rentang & Durasi */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900">
                              {r.startDate} s/d {r.endDate}
                            </div>
                            <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                              Durasi: <span className="font-bold text-slate-900">{r.durationDays} Hari</span>
                            </div>
                          </td>

                          {/* Alasan */}
                          <td className="px-4 py-4 max-w-xs">
                            <p className="text-slate-700 line-clamp-2 leading-relaxed">
                              {r.reason}
                            </p>
                            {r.emergencyContact && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Kontak Darurat: {r.emergencyContact}
                              </p>
                            )}
                          </td>

                          {/* Lampiran Dokumen */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {r.attachmentUrl ? (
                              <button
                                onClick={() => handleOpenPreview(r)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>{r.type === "SICK" ? "Surat Dokter" : "Lihat Berkas"}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Tanpa Lampiran
                              </span>
                            )}
                          </td>

                          {/* Status Review */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] ${statusInfo.badge}`}>
                              <span>{statusInfo.label}</span>
                            </span>
                            {r.approvedBy && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Oleh: {r.approvedBy}
                              </div>
                            )}
                          </td>

                          {/* Aksi Manajemen */}
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenActionModal(r, "APPROVE")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  onClick={() => handleOpenActionModal(r, "REJECT")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Selesai Ditinjau
                              </span>
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

      {/* Review Action Modal */}
      {actionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {actionType === "APPROVE" ? "✅ Setujui Permohonan Izin / Cuti" : "❌ Tolak Permohonan Izin / Cuti"}
              </h3>
              <button
                onClick={() => setActionModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <p className="font-bold text-slate-900">{selectedRequest.user?.name}</p>
              <p className="text-slate-500">{selectedRequest.type === "SICK" ? "🏥 Izin Sakit" : selectedRequest.type === "ANNUAL_LEAVE" ? "🏖️ Cuti Tahunan" : "📌 Izin Khusus"} • {selectedRequest.durationDays} Hari ({selectedRequest.startDate} s/d {selectedRequest.endDate})</p>
              <p className="text-slate-700 italic mt-1">"{selectedRequest.reason}"</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Catatan dari Manajemen untuk Karyawan
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Tulis catatan atau arahan resmi..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                disabled={isProcessing}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isProcessing}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition ${
                  actionType === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isProcessing ? "Menyimpan..." : actionType === "APPROVE" ? "Konfirmasi Setujui" : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        attachmentUrl={selectedAttachment?.url}
        attachmentName={selectedAttachment?.name}
        attachmentType={selectedAttachment?.type}
        title={selectedAttachment?.title}
        applicantName={selectedAttachment?.applicantName}
      />
    </div>
  );
}
