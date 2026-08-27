"use client";

export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Wallet,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Eye,
  Clock,
} from "lucide-react";
import { generatePayslipPdf, formatRupiah } from "@/lib/payslip-pdf";

export default function EmployeePayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/login");
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const payRes = await fetch("/api/payroll/my-payslips");
      if (payRes.ok) {
        const pData = await payRes.json();
        setPayslips(pData.payslips);
        if (pData.payslips.length > 0) {
          setSelectedPayslip(pData.payslips[0]);
        }
      }
    } catch (err) {
      console.error("Fetch employee payroll error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Slip Gaji...</p>
        </div>
      </div>
    );
  }

  const handleDownloadPdf = (ps: any) => {
    generatePayslipPdf({
      periodLabel: ps.payrollPeriod.periodLabel,
      paymentDate: ps.payrollPeriod.paymentDate,
      employeeName: user.name,
      employeeEmail: user.email,
      jobTitle: user.jobTitle || "Karyawan",
      department: user.department || "Teknologi",
      bankName: ps.bankName || user.bankName || "BCA",
      bankAccountNumber: ps.bankAccountNumber || user.bankAccountNumber || "-",
      npwpNumber: user.npwpNumber || "09.123.456.7-012.000",
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
                <span>Kompensasi & Slip Gaji Karyawan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Slip Gaji & Rincian Take-Home Pay
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dokumen kompensasi resmi Difitech HRIS dengan rincian pendapatan, potongan BPJS, PPh 21, dan integrasi presensi CamStamp.
              </p>
            </div>

            {selectedPayslip && (
              <button
                onClick={() => handleDownloadPdf(selectedPayslip)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Slip Gaji PDF ({selectedPayslip.payrollPeriod.periodLabel})</span>
              </button>
            )}
          </div>

          {payslips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Slip Gaji Diterbitkan</h3>
              <p className="text-xs text-slate-400 mt-1">
                Slip gaji akan otomatis muncul setelah periode penggajian bulanan diproses oleh divisi Human Capital.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Payslip Highlight */}
              {selectedPayslip && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-lg">
                            Periode: {selectedPayslip.payrollPeriod.periodLabel}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              selectedPayslip.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {selectedPayslip.status === "PAID" ? "SUDAH DITRANSFER" : "DALAM PROSES"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ditransfer ke <b>{selectedPayslip.bankName}</b> - Rek. <b>{selectedPayslip.bankAccountNumber}</b> (Tgl: {selectedPayslip.payrollPeriod.paymentDate})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Gaji Bersih Diterima (Take Home Pay)
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-red-600 font-mono mt-0.5">
                        {formatRupiah(selectedPayslip.netSalary)}
                      </p>
                    </div>
                  </div>

                  {/* Attendance sync banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-medium">
                      <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span>
                        Presensi Terverifikasi CamStamp: <b>{selectedPayslip.attendanceDaysCount} Hari Kerja</b> | Keterlambatan: <b>{selectedPayslip.lateCount} kali</b> | Lembur: <b>{selectedPayslip.overtimeHours} Jam</b>
                      </span>
                    </div>
                    {selectedPayslip.notes && (
                      <span className="text-slate-500 italic text-[11px]">&ldquo;{selectedPayslip.notes}&rdquo;</span>
                    )}
                  </div>

                  {/* Breakdown Grid: Earnings VS Deductions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. Penerimaan (Earnings) */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            Penerimaan (Earnings)
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {formatRupiah(selectedPayslip.grossSalary)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">Gaji Pokok (Basic Salary)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.basicSalary)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">Tunjangan Jabatan & Keahlian</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.positionAllowance)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">Tunjangan Transport & Makan</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.transportAllowance)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">Tunjangan Komunikasi & Pulsa</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.communicationAllowance)}</span>
                        </div>

                        {selectedPayslip.overtimePay > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                            <span>Upah Lembur ({selectedPayslip.overtimeHours} Jam)</span>
                            <span className="font-mono font-bold">{formatRupiah(selectedPayslip.overtimePay)}</span>
                          </div>
                        )}

                        {selectedPayslip.otherAllowance > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                            <span>Tunjangan Lainnya / Bonus</span>
                            <span className="font-mono font-bold">{formatRupiah(selectedPayslip.otherAllowance)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex justify-between text-xs font-bold text-slate-900">
                        <span>Total Pendapatan Kotor</span>
                        <span className="font-mono text-emerald-700">{formatRupiah(selectedPayslip.grossSalary)}</span>
                      </div>
                    </div>

                    {/* 2. Potongan (Deductions) */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            Potongan (Deductions)
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-red-600 font-mono">
                          - {formatRupiah(selectedPayslip.totalDeductions)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100 text-red-700">
                          <span>Potongan Keterlambatan ({selectedPayslip.lateCount}x Presensi)</span>
                          <span className="font-mono font-bold">{formatRupiah(selectedPayslip.latePenaltyTotal)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">BPJS Kesehatan Karyawan (1%)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.bpjsKesehatanEmp)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">BPJS Ketenagakerjaan (2% JHT + 1% JP)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.bpjsKetenagakerjaanEmp)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">Pajak Penghasilan PPh 21 (TER)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedPayslip.pph21Amount)}</span>
                        </div>

                        {selectedPayslip.otherDeductions > 0 && (
                          <div className="flex justify-between py-1 border-b border-slate-100 text-red-700">
                            <span>Potongan Lainnya / Kasbon</span>
                            <span className="font-mono font-bold">{formatRupiah(selectedPayslip.otherDeductions)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex justify-between text-xs font-bold text-slate-900">
                        <span>Total Potongan</span>
                        <span className="font-mono text-red-600">- {formatRupiah(selectedPayslip.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Arsip Riwayat Slip Gaji</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Periode</th>
                        <th className="px-3 py-3">Tgl Pembayaran</th>
                        <th className="px-3 py-3">Hari Kerja</th>
                        <th className="px-3 py-3">Gaji Kotor</th>
                        <th className="px-3 py-3">Potongan</th>
                        <th className="px-3 py-3">Gaji Bersih (THP)</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {payslips.map((ps) => (
                        <tr key={ps.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {ps.payrollPeriod.periodLabel}
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-600">
                            {ps.payrollPeriod.paymentDate}
                          </td>
                          <td className="px-3 py-3 font-mono">
                            {ps.attendanceDaysCount} Hari
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-900">
                            {formatRupiah(ps.grossSalary)}
                          </td>
                          <td className="px-3 py-3 font-mono text-red-600">
                            - {formatRupiah(ps.totalDeductions)}
                          </td>
                          <td className="px-3 py-3 font-mono font-bold text-red-600">
                            {formatRupiah(ps.netSalary)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              {ps.status === "PAID" ? "Lunas" : "Proses"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedPayslip(ps)}
                                className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                                title="Lihat Rincian"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(ps)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition"
                              >
                                <Download className="h-3 w-3" />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
