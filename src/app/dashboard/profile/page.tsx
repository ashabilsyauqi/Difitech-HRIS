"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  User,
  Phone,
  Mail,
  Building,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BellRing,
  ShieldCheck,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : Promise.reject("Gagal memuat profil")))
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setWhatsappNumber(data.user.whatsappNumber || "");
        }
      })
      .catch((err) => {
        setErrorMsg(typeof err === "string" ? err : "Gagal memuat data pengguna.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsappNumber: whatsappNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan profil.");
      }

      setUser(data.user);
      setWhatsappNumber(data.user.whatsappNumber || "");
      setSuccessMsg("Nomor WhatsApp dan profil berhasil diperbarui! Sinkronisasi aktif di DWB & HRIS.");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {user && (
        <Navbar
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <div className="flex flex-1">
        {user && (
          <Sidebar
            role={user.role}
            department={user.department}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Pengaturan Profil Akun
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola nomor WhatsApp notifikasi dan data akun kerja Anda.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs text-slate-500">Memuat profil...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMsg && (
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 border border-rose-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Card 1: Identitas Kerja */}
              <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Informasi Akun
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat Email (Login)</label>
                    <input
                      type="text"
                      value={user?.email || ""}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Divisi / Departemen</label>
                    <input
                      type="text"
                      value={user?.department || "Umum"}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role / Jabatan</label>
                    <input
                      type="text"
                      value={`${user?.role || "EMPLOYEE"} - ${user?.jobTitle || "Karyawan"}`}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: WhatsApp Settings */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Nomor WhatsApp Notifikasi</h2>
                      <p className="text-xs text-slate-500">Pusat notifikasi instan langsung ke HP Anda</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    ⚡ Auto-Sync DWB & HRIS
                  </span>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp (Aktif)
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Contoh: 087871976694 atau 62878..."
                    className="w-full max-w-md rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white p-3.5 text-xs text-slate-600 border border-emerald-200/80">
                  <BellRing className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">Fungsi Notifikasi WhatsApp:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      <li>Pengingat follow-up tugas dari rekan tim & manajemen</li>
                      <li>Penugasan tugas baru & update deadline</li>
                      <li>Notifikasi review tugas, approval (DONE), dan catatan revisi</li>
                      <li>Diskusi & komentar pada kartu kerja</li>
                    </ul>
                    <p className="text-[11px] text-slate-500 pt-1">
                      <em>Catatan: Nomor ini otomatis sinkron. Anda dapat mengisinya di portal DWB atau HRIS, data akan langsung terhubung di keduanya.</em>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan Data...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Profil
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}