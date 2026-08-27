"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Settings,
  Users,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  ArrowLeft,
  Building2,
  Save,
} from "lucide-react";
import { formatRupiah } from "@/lib/payslip-pdf";
import Link from "next/link";

export default function ManagerPayrollSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form Fields
  const [basicSalary, setBasicSalary] = useState(8000000);
  const [positionAllowance, setPositionAllowance] = useState(1500000);
  const [transportAllowance, setTransportAllowance] = useState(1000000);
  const [communicationAllowance, setCommunicationAllowance] = useState(300000);
  const [otherAllowance, setOtherAllowance] = useState(0);
  const [latePenaltyRate, setLatePenaltyRate] = useState(50000);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState(75000);
  const [bpjsKesehatanActive, setBpjsKesehatanActive] = useState(true);
  const [bpjsKetenagakerjaanActive, setBpjsKetenagakerjaanActive] = useState(true);
  const [applyPph21, setApplyPph21] = useState(true);

  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [npwpNumber, setNpwpNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProfiles = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      if (authData.user.role !== "ADMIN" && authData.user.role !== "MANAGER") {
        router.push("/dashboard");
        return;
      }
      setUser(authData.user);

      const res = await fetch("/api/payroll/salary-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error("Fetch salary profiles error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenEdit = (emp: any) => {
    setSelectedUser(emp);
    const sp = emp.salaryProfile || {};
    setBasicSalary(sp.basicSalary || 8000000);
    setPositionAllowance(sp.positionAllowance || 1500000);
    setTransportAllowance(sp.transportAllowance || 1000000);
    setCommunicationAllowance(sp.communicationAllowance || 300000);
    setOtherAllowance(sp.otherAllowance || 0);
    setLatePenaltyRate(sp.latePenaltyRate || 50000);
    setOvertimeRatePerHour(sp.overtimeRatePerHour || 75000);
    setBpjsKesehatanActive(sp.bpjsKesehatanActive !== false);
    setBpjsKetenagakerjaanActive(sp.bpjsKetenagakerjaanActive !== false);
    setApplyPph21(sp.applyPph21 !== false);

    setBankName(emp.bankName || "BCA");
    setBankAccountNumber(emp.bankAccountNumber || "");
    setNpwpNumber(emp.npwpNumber || "");
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/payroll/salary-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          basicSalary,
          positionAllowance,
          transportAllowance,
          communicationAllowance,
          otherAllowance,
          latePenaltyRate,
          overtimeRatePerHour,
          bpjsKesehatanActive,
          bpjsKetenagakerjaanActive,
          applyPph21,
          bankName,
          bankAccountNumber,
          npwpNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan konfigurasi gaji");

      setEditModalOpen(false);
      await fetchProfiles();
      setFeedback({
        type: "success",
        text: `Konfigurasi gaji untuk ${selectedUser.name} berhasil diperbarui!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Konfigurasi Gaji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/50 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Settings className="h-4 w-4" />
                <span>Pengaturan Kompensasi & Rekening Karyawan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Struktur Komponen Gaji Pokok & Tunjangan
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Atur besaran gaji dasar, tunjangan jabatan, denda per keterlambatan presensi, dan rekening tujuan transfer.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/manager/payroll"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Master Payroll</span>
              </Link>
            </div>
          </div>

          {/* Toast Notification */}
          {feedback && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Karyawan</th>
                    <th className="px-4 py-4">Departemen</th>
                    <th className="px-4 py-4">Gaji Pokok</th>
                    <th className="px-4 py-4">Tunjangan Jabatan</th>
                    <th className="px-4 py-4">Tunj. Transport & Makan</th>
                    <th className="px-4 py-4">Denda Telat</th>
                    <th className="px-4 py-4">Tarif Lembur</th>
                    <th className="px-4 py-4">Rekening Transfer</th>
                    <th className="px-4 py-4 text-right">Ubah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {profiles.map((emp) => {
                    const sp = emp.salaryProfile || {};
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              {emp.avatarUrl ? (
                                <img src={emp.avatarUrl} alt={emp.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 whitespace-nowrap">{emp.name}</p>
                              <p className="text-[10px] text-slate-500">{emp.jobTitle || "Karyawan"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                          {emp.department || "Umum"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                          {formatRupiah(sp.basicSalary || 8000000)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-700">
                          {formatRupiah(sp.positionAllowance || 1500000)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-700">
                          {formatRupiah(sp.transportAllowance || 1000000)}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-red-600">
                          {formatRupiah(sp.latePenaltyRate || 50000)} / telat
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-blue-600">
                          {formatRupiah(sp.overtimeRatePerHour || 75000)} / jam
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-800">
                          <span className="font-bold text-slate-900">{emp.bankName || "BCA"}</span> - {emp.bankAccountNumber || "-"}
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit Gaji</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Salary Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Atur Komponen Gaji Karyawan</h4>
                <p className="text-xs text-slate-500">{selectedUser.name} • {selectedUser.department}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (IDR) *</label>
                  <input
                    type="number"
                    step="100000"
                    required
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan Jabatan (IDR)</label>
                  <input
                    type="number"
                    step="100000"
                    value={positionAllowance}
                    onChange={(e) => setPositionAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan Transport & Makan</label>
                  <input
                    type="number"
                    step="100000"
                    value={transportAllowance}
                    onChange={(e) => setTransportAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan Komunikasi</label>
                  <input
                    type="number"
                    step="50000"
                    value={communicationAllowance}
                    onChange={(e) => setCommunicationAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Denda per Keterlambatan (IDR)</label>
                  <input
                    type="number"
                    step="10000"
                    value={latePenaltyRate}
                    onChange={(e) => setLatePenaltyRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-red-600 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Lembur per Jam (IDR)</label>
                  <input
                    type="number"
                    step="10000"
                    value={overtimeRatePerHour}
                    onChange={(e) => setOvertimeRatePerHour(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-blue-600 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-800 mb-2">Informasi Bank & Pajak</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nama Bank</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      <option value="BNI">BNI (Bank Negara Indonesia)</option>
                      <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                      <option value="CIMB">CIMB Niaga</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block font-semibold text-slate-600 mb-1">Nomor NPWP Karyawan</label>
                  <input
                    type="text"
                    value={npwpNumber}
                    onChange={(e) => setNpwpNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Profil Gaji"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
