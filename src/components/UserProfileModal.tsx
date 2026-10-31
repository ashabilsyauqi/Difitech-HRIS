"use client";

import { useState, useEffect } from "react";
import { X, Phone, User, Mail, Building, Briefcase, CheckCircle2, AlertCircle, Loader2, BellRing } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: any) => void;
}

export default function UserProfileModal({ isOpen, onClose, onUserUpdated }: UserProfileModalProps) {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSuccessMsg(null);
      setErrorMsg(null);
      return;
    }

    setIsLoading(true);
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
  }, [isOpen]);

  if (!isOpen) return null;

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
        throw new Error(data.error || "Gagal menyimpan nomor WhatsApp.");
      }

      setUser(data.user);
      setWhatsappNumber(data.user.whatsappNumber || "");
      setSuccessMsg("Nomor WhatsApp berhasil disimpan dan disinkronkan ke DWB & HRIS!");

      if (onUserUpdated) {
        onUserUpdated(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pengaturan Profil & WhatsApp</h2>
              <p className="text-xs text-slate-500">Kelola identitas dan nomor kontak notifikasi otomatis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">Memuat data profil...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Feedback Messages */}
            {successMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Readonly Identity Overview */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Akun
                </span>
                <span className="font-semibold text-slate-700">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> Divisi / Departemen
                </span>
                <span className="font-semibold text-slate-700">{user?.department || "Umum"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Jabatan & Hak Akses
                </span>
                <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  {user?.role} • {user?.jobTitle || "Karyawan"}
                </span>
              </div>
            </div>

            {/* Editable Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Nama Anda"
              />
            </div>

            {/* WhatsApp Field (Primary Focus) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Phone className="h-3 w-3" />
                </div>
                <label className="text-xs font-bold text-slate-800">
                  Nomor WhatsApp Notifikasi
                </label>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                  Auto-Sync DWB & HRIS
                </span>
              </div>

              <div className="relative mt-2">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Contoh: 087871976694 atau 62878..."
                  className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="mt-2.5 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                <BellRing className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Nomor ini dipakai bot WhatsApp Difitech untuk mengirim pengingat follow-up, penugasan tugas baru, revisi, komentar, dan alert deadline. <strong>Bebas diisi di DWB atau HRIS</strong>, otomatis tersimpan ke dua platform sekaligus.
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}