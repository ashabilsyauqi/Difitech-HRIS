"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Wallet,
  Download,
  Calculator,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Users,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Edit2,
  X,
} from "lucide-react";
import { generatePayslipPdf, formatRupiah } from "@/lib/payslip-pdf";
import { exportAttendanceToExcel } from "@/lib/export-utils";
import Link from "next/link";

export default function ManagerPayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<any>(null);
  const [editOtherAllowance, setEditOtherAllowance] = useState(0);
  const [editOtherDeductions, setEditOtherDeductions] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  const fetchData = async () => {
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

      const periodRes = await fetch("/api/payroll/periods");
      if (periodRes.ok) {
        const pData = await periodRes.json();
        setPeriods(pData.periods);
        if (pData.periods.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(pData.periods[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch payroll error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayslips = async (periodId: string) => {
    if (!periodId) return;
    try {
      const res = await fetch(`/api/payroll/payslips?periodId=${periodId}`);
      if (res.ok) {
        const data = await res.json();
        setPayslips(data.payslips);
      }
    } catch (err) {
      console.error("Fetch payslips error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchPayslips(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const handleCalculatePayroll = async () => {
    if (!selectedPeriodId) return;
    setIsCalculating(true);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghitung payroll");

      alert(`✅ ${data.message}`);
      await fetchData();
      await fetchPayslips(selectedPeriodId);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm("Tandai seluruh slip gaji periode ini sebagai SUDAH DITRANSFER / LUNAS?")) return;
    try {
      const res = await fetch("/api/payroll/payslips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId, status: "PAID" }),
      });
      if (res.ok) {
        alert("✅ Seluruh slip gaji berhasil ditandai Lunas!");
        fetchData();
        fetchPayslips(selectedPeriodId);
      }
    } catch (err) {
      console.error("Mark as paid error:", err);
    }
  };

  const handleExportBankTransfer = () => {
    const transferRows = payslips.map((ps, idx) => ({
      No: idx + 1,
      NamaKaryawan: ps.user.name,
      BankTujuan: ps.bankName || ps.user.bankName || "BCA",
      NomorRekening: ps.bankAccountNumber || ps.user.bankAccountNumber || "-",
      JumlahTransfer: ps.netSalary,
      BeritaAcara: `Gaji ${currentPeriod?.periodLabel || "Difitech"} - ${ps.user.name}`,
      EmailKaryawan: ps.user.email,
    }));

    exportAttendanceToExcel(transferRows, `Transfer_Bank_Payroll_Difitech_${currentPeriod?.periodLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleDownloadSinglePdf = (ps: any) => {
    generatePayslipPdf({
      periodLabel: currentPeriod?.periodLabel || "Agustus 2026",
      paymentDate: currentPeriod?.paymentDate || "2026-08-28",
      employeeName: ps.user.name,
      employeeEmail: ps.user.email,
      jobTitle: ps.user.jobTitle || "Karyawan",
      department: ps.user.department || "Teknologi",
      bankName: ps.bankName || ps.user.bankName || "BCA",
      bankAccountNumber: ps.bankAccountNumber || ps.user.bankAccountNumber || "-",
      npwpNumber: ps.user.npwpNumber || "09.123.456.7-012.000",
      attendanceDaysCount: ps.attendanceDaysCount,
      lateCount: ps.lateCount,
      overtimeHours: ps.overtimeHours,
      basicSalary: ps.basicSalary,
      positionAllowance: ps.positionAllowance,
      transportAllowance: ps.transportAllowance,
      communicationAllowance: ps.communicationAllowance,
      overtimePay: ps.overtimePay,
      otherAllowance: ps.otherAllowance,
      grossSalary: ps.grossSalary,
      latePenaltyTotal: ps.latePenaltyTotal,
      bpjsKesehatanEmp: ps.bpjsKesehatanEmp,
      bpjsKetenagakerjaanEmp: ps.bpjsKetenagakerjaanEmp,
      pph21Amount: ps.pph21Amount,
      otherDeductions: ps.otherDeductions,
      totalDeductions: ps.totalDeductions,
      netSalary: ps.netSalary,
      notes: ps.notes,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPayslip) return;
    try {
      const res = await fetch(`/api/payroll/payslips/${editingPayslip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherAllowance: editOtherAllowance,
          otherDeductions: editOtherDeductions,
          notes: editNotes,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan penyesuaian gaji");
      setEditModalOpen(false);
      fetchPayslips(selectedPeriodId);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Modul Payroll...</p>
        </div>
      </div>
    );
  }

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

  const totalGross = payslips.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalDeductions = payslips.reduce((acc, p) => acc + p.totalDeductions, 0);
  const totalNet = payslips.reduce((acc, p) => acc + p.netSalary, 0);
  const totalLatePenalty = payslips.reduce((acc, p) => acc + p.latePenaltyTotal, 0);

  const filteredPayslips = payslips.filter((p) => {
    const matchesSearch =
      p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "ALL" || p.user.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = ["ALL", "Engineering & Teknologi", "Human Capital & People", "Produk & Desain", "Quality Assurance", "Pemasaran & Growth"];

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
                <Wallet className="h-4 w-4" />
                <span>Pusat Manajemen Penggajian & Kompensasi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Penggajian & Payroll Difitech HRIS
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kalkulasi otomatis gaji karyawan terintegrasi presensi CamStamp, BPJS, PPh 21, dan ekspor transfer bank.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/manager/payroll/settings"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Konfigurasi Gaji Karyawan</span>
              </Link>

              <button
                onClick={handleCalculatePayroll}
                disabled={isCalculating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50"
              >
                {isCalculating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                <span>{isCalculating ? "Menghitung Presensi..." : "Hitung Ulang Payroll (1-Klik)"}</span>
              </button>
            </div>
          </div>

          {/* Period Selector & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Pilih Periode Penggajian:</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.periodLabel} ({p.status === "PAID" ? "Lunas" : p.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportBankTransfer}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Format Transfer Bank (.xlsx)</span>
              </button>

              <button
                onClick={handleMarkAsPaid}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100 transition shadow-2xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Tandai Lunas / Selesai Transfer</span>
              </button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Net Payout */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Total Pengeluaran Gaji Bersih</span>
                <Wallet className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-red-600 font-mono">
                  {formatRupiah(totalNet)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total Take-Home Pay {payslips.length} Karyawan
                </p>
              </div>
            </div>

            {/* Total Gross */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Total Gaji Kotor (Gross)</span>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatRupiah(totalGross)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Gaji pokok + tunjangan + lembur
                </p>
              </div>
            </div>

            {/* Total Deductions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Total Potongan BPJS & Pajak</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-700 font-mono">
                  - {formatRupiah(totalDeductions)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  BPJS Kesehatan, BPJS TK, dan PPh 21
                </p>
              </div>
            </div>

            {/* Late Penalties */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Denda Keterlambatan Presensi</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatRupiah(totalLatePenalty)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Otomatis terpotong dari log CamStamp
                </p>
              </div>
            </div>
          </div>

          {/* Master Table Container */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Rekapitulasi Slip Gaji Karyawan</h3>
                <p className="text-xs text-slate-500">Daftar penerimaan, potongan keterlambatan, dan status transfer</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-500 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === "ALL" ? "Semua Departemen" : d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Karyawan</th>
                    <th className="px-3 py-3">Departemen</th>
                    <th className="px-3 py-3">Rekening Bank</th>
                    <th className="px-3 py-3">Gaji Pokok</th>
                    <th className="px-3 py-3">Tunjangan</th>
                    <th className="px-3 py-3">Telat</th>
                    <th className="px-3 py-3">BPJS & Pajak</th>
                    <th className="px-3 py-3">Gaji Bersih (THP)</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPayslips.map((ps) => {
                    const allowances = ps.positionAllowance + ps.transportAllowance + ps.communicationAllowance + ps.otherAllowance + ps.overtimePay;
                    const taxAndBpjs = ps.bpjsKesehatanEmp + ps.bpjsKetenagakerjaanEmp + ps.pph21Amount;

                    return (
                      <tr key={ps.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              {ps.user.avatarUrl ? (
                                <img src={ps.user.avatarUrl} alt={ps.user.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                                  {ps.user.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 whitespace-nowrap">{ps.user.name}</p>
                              <p className="text-[10px] text-slate-500">{ps.user.jobTitle || "Karyawan"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                          {ps.user.department || "Umum"}
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{ps.bankName || ps.user.bankName}</span> - {ps.bankAccountNumber || ps.user.bankAccountNumber}
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-900 whitespace-nowrap">
                          {formatRupiah(ps.basicSalary)}
                        </td>

                        <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">
                          +{formatRupiah(allowances)}
                        </td>

                        <td className="px-3 py-3 font-mono text-red-600 whitespace-nowrap">
                          {ps.lateCount > 0 ? `-${formatRupiah(ps.latePenaltyTotal)} (${ps.lateCount}x)` : "0"}
                        </td>

                        <td className="px-3 py-3 font-mono text-amber-700 whitespace-nowrap">
                          -{formatRupiah(taxAndBpjs)}
                        </td>

                        <td className="px-3 py-3 font-mono font-black text-red-600 whitespace-nowrap">
                          {formatRupiah(ps.netSalary)}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              ps.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {ps.status === "PAID" ? "Lunas" : "Draft"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPayslip(ps);
                                setEditOtherAllowance(ps.otherAllowance);
                                setEditOtherDeductions(ps.otherDeductions);
                                setEditNotes(ps.notes || "");
                                setEditModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit Penyesuaian / Bonus"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadSinglePdf(ps)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 border border-red-200 px-2 py-1 text-[11px] font-semibold hover:bg-red-100 transition shadow-2xs"
                            >
                              <Download className="h-3 w-3" />
                              <span>Slip PDF</span>
                            </button>
                          </div>
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

      {/* Edit Adjustment Modal */}
      {editModalOpen && editingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Penyesuaian Gaji Karyawan</h4>
                <p className="text-xs text-slate-500">{editingPayslip.user.name} ({currentPeriod?.periodLabel})</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bonus / Tunjangan Tambahan (IDR):
                </label>
                <input
                  type="number"
                  step="50000"
                  value={editOtherAllowance}
                  onChange={(e) => setEditOtherAllowance(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Potongan Lainnya / Kasbon (IDR):
                </label>
                <input
                  type="number"
                  step="50000"
                  value={editOtherDeductions}
                  onChange={(e) => setEditOtherDeductions(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Slip Gaji:
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700"
              >
                Simpan Penyesuaian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
