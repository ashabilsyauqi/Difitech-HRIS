"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  ActivitySquare,
  Calendar,
  Clock,
  User,
  Tag,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CeoHrTaskRadarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");

  const fetchSessionAndData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const uData = await res.json();
      setUser(uData.user);

      if (uData.user.role !== "ADMIN" && uData.user.role !== "MANAGER") {
        router.push("/dashboard");
        return;
      }

      const radarRes = await fetch("/api/workspace/executive-summary");
      if (radarRes.ok) {
        const rData = await radarRes.json();
        setData(rData);
      }
    } catch (err) {
      console.error("Failed to load executive radar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getDayNameWIB = (iso?: string | null) => {
    if (!iso) return "Mingguan";
    try {
      return new Date(iso).toLocaleDateString("id-ID", { weekday: "long" });
    } catch {
      return "-";
    }
  };

  const filteredTasks = (data?.weeklyTasks || []).filter((t: any) => {
    if (selectedDivision === "ALL") return true;
    return (t.departmentCard || "").toUpperCase() === selectedDivision;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {user && <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex flex-1">
        {user && <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 tracking-wider uppercase">
                  Executive Suite
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-semibold text-slate-500">Monitoring Khusus CEO & HR</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Radar Tugas & Follow-Up Tim
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau seluruh tugas minggu ini (Senin - Minggu) dan deteksi hambatan melalui log Follow Up tim.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSessionAndData}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-purple-600" : "text-slate-500"}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-xs">Menganalisis matriks tugas mingguan dan radar follow-up...</p>
            </div>
          ) : (
            <>
              {/* Executive Metrics Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Tugas Minggu Ini</span>
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {data?.summary?.totalWeeklyTasks || 0}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Periode: {data?.weekRange?.startDate} s.d. {data?.weekRange?.endDate}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Selesai (Completed)</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">
                    {data?.summary?.completedWeeklyTasks || 0}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Deliverables telah terverifikasi
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Sedang Dikerjakan</span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 mt-2">
                    {data?.summary?.inProgressWeeklyTasks || 0}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Aktif dalam proses pengerjaan
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Total Aksi Follow Up</span>
                    <BellRing className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 mt-2">
                    {data?.summary?.totalFollowUpsRecorded || 0}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sinyal saling mengingatkan & push
                  </p>
                </div>
              </div>

              {/* 6 Divisi Load Progress Bar */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Distribusi Beban Kerja 6 Divisi (Minggu Ini)
                  </h3>
                  <span className="text-xs text-slate-400">Target Senin - Minggu</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(data?.divisionStats || {}).map(([key, stat]: [string, any]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedDivision(selectedDivision === key ? "ALL" : key)}
                      className={`p-3 rounded-2xl border transition cursor-pointer ${
                        selectedDivision === key
                          ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800">{key}</span>
                        <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                          {stat.total}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Selesai:</span>
                          <strong className="text-emerald-600">{stat.completed}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Proses:</span>
                          <strong className="text-amber-600">{stat.inProgress}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <strong className="text-slate-600">{stat.pending}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 1: Top Bottlenecks (High Follow-Up Alert) */}
              {data?.highFollowUpTasks && data.highFollowUpTasks.length > 0 && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <div>
                      <h3 className="font-bold text-sm">Radar Bottleneck (Tugas Paling Sering Di-Follow Up)</h3>
                      <p className="text-xs text-rose-600">
                        Tugas-tugas di bawah ini sering ditagih oleh rekan tim. Perlu perhatian CEO / HR untuk memperlancar hambatan.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.highFollowUpTasks.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-rose-200 bg-white p-3.5 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-rose-100 text-rose-800 font-black text-[10px] px-2 py-0.5">
                            {item.count}x Follow Up
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.task?.departmentCard}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.task?.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          Brand: <strong className="text-slate-700">{item.task?.brandName || "General"}</strong>
                        </p>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          Ditagih oleh: <span className="text-slate-700 font-semibold">{item.senders.join(", ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Log Follow-Up Lengkap (Oleh Siapa, Ke Siapa, Tentang Apa, Kapan) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-rose-600" />
                      Daftar Tugas Follow Up (Audit Log Aktivitas)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rekam jejak transparan: siapa yang menekan follow up, kepada siapa, tentang tugas apa, dan tanggal/jamnya.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-3">Waktu & Tanggal</th>
                        <th className="p-3">Oleh Siapa (Penagih)</th>
                        <th className="p-3">Ke Siapa (Penerima)</th>
                        <th className="p-3">Tentang Tugas Apa</th>
                        <th className="p-3">Divisi & Brand</th>
                        <th className="p-3">Catatan / Pesan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(data?.followUps || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Belum ada riwayat tombol Follow Up yang ditekan.
                          </td>
                        </tr>
                      ) : (
                        data.followUps.map((fu: any) => (
                          <tr key={fu.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                              {formatDateTime(fu.createdAt)}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{fu.sender?.name}</div>
                              <div className="text-[10px] text-slate-400">{fu.sender?.department || "HRIS"}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{fu.recipient?.name || "-"}</div>
                              <div className="text-[10px] text-slate-400">{fu.recipient?.department || "-"}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate">
                              {fu.task?.title || "Tugas Dihapus"}
                            </td>
                            <td className="p-3">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 mr-1">
                                {fu.task?.departmentCard || "GENERAL"}
                              </span>
                              <span className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-[9px] font-bold">
                                {fu.task?.brandName || "Brand"}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 italic max-w-[220px] truncate">
                              "{fu.message || "Tolong di-update segera"}"
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Daftar Tugas Minggu Ini (Senin - Minggu) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Daftar Tugas Minggu Ini ({data?.weekRange?.startDate} s.d. {data?.weekRange?.endDate})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Daftar komprehensif seluruh tugas operasional yang dijadwalkan atau berjalan dalam 7 hari ini.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Filter Divisi:</span>
                    <select
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 bg-white outline-none font-semibold"
                    >
                      <option value="ALL">Semua Divisi (6 Card)</option>
                      <option value="SOSMED">Sosmed</option>
                      <option value="ADS">Ads</option>
                      <option value="SEO">SEO</option>
                      <option value="WEB">Web</option>
                      <option value="MARKETPLACE">Marketplace</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-3">Hari & Tanggal</th>
                        <th className="p-3">Judul Tugas</th>
                        <th className="p-3">Divisi & Brand</th>
                        <th className="p-3">Penerima (Assignee)</th>
                        <th className="p-3">Pembuat (Creator)</th>
                        <th className="p-3">Target Deadline</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredTasks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            Tidak ada tugas yang terjadwal pada filter ini untuk minggu ini.
                          </td>
                        </tr>
                      ) : (
                        filteredTasks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 whitespace-nowrap">
                              <span className="rounded-md bg-blue-50 text-blue-800 font-bold px-2 py-0.5 text-[10px]">
                                {getDayNameWIB(t.expectedDeadline || t.createdAt)}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900 max-w-[220px]">
                              <div>{t.title}</div>
                              {t.revisionTag && (
                                <span className="inline-block mt-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold px-1.5">
                                  {t.revisionTag}
                                </span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 mr-1">
                                {t.departmentCard || "GENERAL"}
                              </span>
                              <span className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-[9px] font-bold">
                                {t.brandName || "Brand"}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap font-medium text-slate-800">
                              {t.user?.name || "-"}
                            </td>
                            <td className="p-3 whitespace-nowrap text-slate-500">
                              {t.creator?.name || "Kolega"}
                            </td>
                            <td className="p-3 whitespace-nowrap text-[11px] font-mono text-slate-600">
                              {formatDateTime(t.expectedDeadline)}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  t.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : t.status === "IN_PROGRESS"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
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
