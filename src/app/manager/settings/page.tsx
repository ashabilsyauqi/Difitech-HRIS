"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Settings,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function ManagerSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("Difitech HQ (Jakarta)");
  const [address, setAddress] = useState("Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan");
  const [latitude, setLatitude] = useState(-6.224647);
  const [longitude, setLongitude] = useState(106.809592);
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("17:00");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
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

        const offRes = await fetch("/api/settings/office");
        if (offRes.ok) {
          const data = await offRes.json();
          if (data.office) {
            setName(data.office.name);
            setAddress(data.office.address || "");
            setLatitude(data.office.latitude);
            setLongitude(data.office.longitude);
            setRadiusMeters(data.office.radiusMeters);
            setWorkStartTime(data.office.workStartTime || "09:00");
            setWorkEndTime(data.office.workEndTime || "17:00");
          }
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation tidak didukung oleh browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setSuccessMsg(`Koordinat berhasil diperbarui ke lokasi Anda saat ini: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setTimeout(() => setSuccessMsg(null), 4000);
      },
      (err) => {
        setErrorMsg("Gagal mengambil lokasi GPS saat ini: " + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/settings/office", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          workStartTime,
          workEndTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan kantor");

      setSuccessMsg("Pengaturan Geofence & Jam Kerja Kantor Difitech berhasil disimpan!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Pengaturan Kantor...</p>
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
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Settings className="h-4 w-4 text-red-600" />
                <span>Pengaturan Parameter Kantor Difitech & Shift</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Lokasi Geofence & Jam Standar Shift
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Konfigurasi titik pusat GPS kantor, batas toleransi radius presensi (meter), dan jam acuan keterlambatan.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Titik GPS & Radius Geofence Difitech</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Kantor
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Radius Geofence (Meter)
                  </label>
                  <input
                    type="number"
                    required
                    min={20}
                    max={5000}
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Lengkap Kantor
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Latitude Kantor (6 Desimal)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Longitude Kantor (6 Desimal)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-600" />
                  <span>Ambil Titik Koordinat Saya Sekarang</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Aturan Jam Masuk & Pulang</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jam Standar Mulai Kerja (24 Jam)
                  </label>
                  <input
                    type="time"
                    required
                    value={workStartTime}
                    onChange={(e) => setWorkStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Presensi setelah jam ini akan berstatus TERLAMBAT</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jam Standar Selesai Kerja (24 Jam)
                  </label>
                  <input
                    type="time"
                    required
                    value={workEndTime}
                    onChange={(e) => setWorkEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Presensi pulang sebelum jam ini akan berstatus PULANG LEBIH AWAL</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Pengaturan Kantor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
