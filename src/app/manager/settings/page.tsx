"use client";

export const dynamic = "force-dynamic";


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
  Plus,
  Trash2,
  Sparkles,
  Info,
  Sliders,
  CalendarRange,
  Layers,
  Building2,
} from "lucide-react";

export default function ManagerSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Office Location & Geofence Fields
  const [name, setName] = useState("Difitech HQ (Jakarta)");
  const [address, setAddress] = useState("Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan");
  const [latitude, setLatitude] = useState(-6.224647);
  const [longitude, setLongitude] = useState(106.809592);
  const [radiusMeters, setRadiusMeters] = useState(150);

  // Shift & Flexible Hours Configuration
  const [flexibleStartWindowStart, setFlexibleStartWindowStart] = useState("08:00");
  const [flexibleStartWindowEnd, setFlexibleStartWindowEnd] = useState("10:00");
  const [lateGraceMinutes, setLateGraceMinutes] = useState(5);
  const [standardWorkDurationHours, setStandardWorkDurationHours] = useState(8.0);
  const [clockInSlots, setClockInSlots] = useState<string[]>(["08:00", "09:00", "10:00"]);
  const [newSlotTime, setNewSlotTime] = useState("08:30");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Department Management
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  const fetchDepts = async () => {
    try {
      const dRes = await fetch("/api/manager/departments");
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

        fetchDepts();

        const offRes = await fetch("/api/settings/office");
        if (offRes.ok) {
          const data = await offRes.json();
          if (data.office) {
            setName(data.office.name);
            setAddress(data.office.address || "");
            setLatitude(data.office.latitude);
            setLongitude(data.office.longitude);
            setRadiusMeters(data.office.radiusMeters);
            setFlexibleStartWindowStart(data.office.flexibleStartWindowStart || "08:00");
            setFlexibleStartWindowEnd(data.office.flexibleStartWindowEnd || "10:00");
            setLateGraceMinutes(data.office.lateGraceMinutes !== undefined ? data.office.lateGraceMinutes : 5);
            setStandardWorkDurationHours(data.office.standardWorkDurationHours || 8.0);

            if (data.office.allowedClockInOptions) {
              const parsed = data.office.allowedClockInOptions
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
              if (parsed.length > 0) {
                setClockInSlots(parsed);
              }
            }
          }
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

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

  const handleAddClockInSlot = () => {
    if (!newSlotTime) return;
    if (clockInSlots.includes(newSlotTime)) {
      setErrorMsg(`Slot jam ${newSlotTime} sudah ada di daftar.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const updated = [...clockInSlots, newSlotTime].sort();
    setClockInSlots(updated);
  };

  const handleRemoveClockInSlot = (slotToRemove: string) => {
    if (clockInSlots.length <= 1) {
      setErrorMsg("Minimal harus ada 1 opsi jam masuk.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setClockInSlots(clockInSlots.filter((slot) => slot !== slotToRemove));
  };

  const handleApplyPreset = (preset: "standard" | "flexible3" | "early") => {
    if (preset === "standard") {
      setFlexibleStartWindowStart("09:00");
      setFlexibleStartWindowEnd("09:00");
      setLateGraceMinutes(5);
      setStandardWorkDurationHours(8.0);
      setClockInSlots(["09:00"]);
    } else if (preset === "flexible3") {
      setFlexibleStartWindowStart("08:00");
      setFlexibleStartWindowEnd("10:00");
      setLateGraceMinutes(5);
      setStandardWorkDurationHours(8.0);
      setClockInSlots(["08:00", "09:00", "10:00"]);
    } else if (preset === "early") {
      setFlexibleStartWindowStart("07:30");
      setFlexibleStartWindowEnd("09:30");
      setLateGraceMinutes(10);
      setStandardWorkDurationHours(8.0);
      setClockInSlots(["07:30", "08:30", "09:30"]);
    }
    setSuccessMsg(`Preset shift berhasil dimuat. Jangan lupa klik tombol 'Simpan Pengaturan'!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsAddingDept(true);
    try {
      const res = await fetch("/api/manager/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim() || undefined,
          description: newDeptDesc.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah divisi");
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptDesc("");
      await fetchDepts();
      setSuccessMsg("Divisi baru berhasil ditambahkan!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus divisi "${name}"? Karyawan di divisi ini akan dipindahkan ke "Umum".`)) return;
    try {
      const res = await fetch(`/api/manager/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus divisi");
      await fetchDepts();
      setSuccessMsg(`Divisi ${name} berhasil dihapus.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const allowedClockInOptionsStr = clockInSlots.join(", ");

      const res = await fetch("/api/settings/office", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters),
          flexibleStartWindowStart,
          flexibleStartWindowEnd,
          lateGraceMinutes: Number(lateGraceMinutes),
          standardWorkDurationHours: Number(standardWorkDurationHours),
          allowedClockInOptions: allowedClockInOptionsStr,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan kantor");

      setSuccessMsg("Pengaturan Jam Masuk Fleksibel & Durasi Kerja berhasil disimpan!");
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

  // Calculate example end times based on standard duration
  const calculateEndTime = (startStr: string, durationHours: number) => {
    const [h, m] = startStr.split(":").map((v) => parseInt(v, 10) || 0);
    const totalMinutes = h * 60 + m + Math.round(durationHours * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
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
                <Sliders className="h-4 w-4 text-red-600" />
                <span>Pusat Konfigurasi Shift & Parameter Kantor</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Pengaturan Jam Masuk Fleksibel & Durasi Kerja
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Atur opsi jam masuk fleksibel (08:00, 09:00, 10:00), toleransi keterlambatan, batas durasi kerja harian, dan geofence kantor.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("flexible3")}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
              >
                ⚡ Fleksibel (08, 09, 10)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("early")}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
              >
                🌅 Pagi (07:30 - 09:30)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("standard")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                🏢 Standar 09:00
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-8">
            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 font-semibold shadow-2xs animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold shadow-2xs animate-in fade-in">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SECTION 1: JAM MASUK KERJA FLEKSIBEL & OPSI SHIFT */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">1. Konfigurasi Jam Masuk & Rentang Waktu Fleksibel</h3>
                    <p className="text-xs text-slate-500">Tentukan rentang jam presensi masuk dan opsi pilihan shift yang diizinkan</p>
                  </div>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                  Kebijakan Presensi
                </span>
              </div>

              {/* Slot Tags Editor */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Daftar Opsi Jam Masuk yang Diizinkan (Bisa ditambah / dihapus seleluasa mungkin)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {clockInSlots.length} Opsi Jam Aktif
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {clockInSlots.map((slot) => (
                    <div
                      key={slot}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-800 shadow-2xs group hover:border-red-400 transition"
                    >
                      <Clock className="h-3.5 w-3.5 text-red-600" />
                      <span>{slot} WIB</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClockInSlot(slot)}
                        className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title={`Hapus opsi ${slot}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add New Slot Input */}
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white/60 p-1">
                    <input
                      type="time"
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddClockInSlot}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 transition shadow-2xs"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Tambah Slot</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  💡 Karyawan bebas memilih atau masuk di antara slot-slot ini (misalnya masuk jam 08:00, 09:00, atau 10:00).
                </p>
              </div>

              {/* Window Start, Window End, & Grace Period */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jam Buka Presensi Paling Pagi
                  </label>
                  <input
                    type="time"
                    required
                    value={flexibleStartWindowStart}
                    onChange={(e) => setFlexibleStartWindowStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Kamera CamStamp mulai menerima presensi (contoh: 08:00 WIB)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Batas Akhir Jam Masuk Tepat Waktu
                  </label>
                  <input
                    type="time"
                    required
                    value={flexibleStartWindowEnd}
                    onChange={(e) => setFlexibleStartWindowEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Batas akhir shift masuk normal (contoh: 10:00 WIB)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Toleransi Keterlambatan (Menit)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      required
                      value={lateGraceMinutes}
                      onChange={(e) => setLateGraceMinutes(parseInt(e.target.value, 10) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-red-500 focus:outline-none pr-12"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">Menit</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lewat dari jam {flexibleStartWindowEnd}:+{lateGraceMinutes}m = Status <b>TERLAMBAT</b>
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: LAMA JAM KERJA STANDAR & SIMULASI SHIFT */}
            <div className="space-y-5 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <CalendarRange className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">2. Lama Jam Kerja Standar & Aturan Lembur</h3>
                    <p className="text-xs text-slate-500">Durasi wajib kerja harian yang harus dipenuhi sebelum sesi lembur aktif</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  Durasi Harian
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lama Jam Kerja Standar per Hari (Jam)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="14"
                      required
                      value={standardWorkDurationHours}
                      onChange={(e) => setStandardWorkDurationHours(parseFloat(e.target.value) || 8.0)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-red-500 focus:outline-none pr-12"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">Jam</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Standar umum adalah <b>{standardWorkDurationHours} Jam</b> ({Math.round(standardWorkDurationHours * 60)} menit kerja reguler).
                  </p>
                </div>

                {/* Live Simulation Matrix */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20 p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    <span>Simulasi Jam Selesai & Lembur ({standardWorkDurationHours} Jam Kerja):</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {clockInSlots.slice(0, 4).map((slot) => {
                      const endTime = calculateEndTime(slot, standardWorkDurationHours);
                      return (
                        <div key={slot} className="flex items-center justify-between rounded-lg bg-white border border-blue-100 px-2.5 py-1 text-slate-700">
                          <span>Masuk jam <b>{slot} WIB</b></span>
                          <span className="text-slate-400">→</span>
                          <span className="font-semibold text-blue-800">Selesai Reguler: <b>{endTime} WIB</b> (Lembur mulai setelahnya)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: LOKASI GEOFENCE KANTOR & GPS */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">3. Titik GPS & Radius Geofence Kantor</h3>
                    <p className="text-xs text-slate-500">Perimeter validasi lokasi presensi masuk/pulang fisik di kantor</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Kantor / Cabang
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
                    Radius Toleransi Geofence (Meter)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Presensi di luar radius ini ditandai LUAR GEOFENCE</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Lengkap Kantor
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none resize-none"
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
                  <span>Ambil Titik Koordinat GPS Saya Saat Ini</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-rose-700 active:scale-[0.99] transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Konfigurasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Pengaturan Kantor & Shift</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* SECTION 3: MANAJEMEN DIVISI & DEPARTEMEN PERUSAHAAN */}
          <div className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3. Struktur Divisi & Departemen Perusahaan</h3>
                  <p className="text-xs text-slate-500">Tambah divisi baru atau kelola divisi yang tersedia untuk penempatan karyawan</p>
                </div>
              </div>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                {departments.length} Divisi Aktif
              </span>
            </div>

            {/* Form Tambah Divisi */}
            <form onSubmit={handleAddDept} className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-purple-600" />
                <span>Tambah Divisi / Departemen Baru</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Divisi Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tim IT Support & Helpdesk"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    placeholder="IT"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 uppercase font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deskripsi Divisi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Bertanggung jawab atas pengelolaan infrastruktur IT dan perangkat kantor"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  disabled={isAddingDept || !newDeptName.trim()}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isAddingDept ? "Menambahkan..." : "+ Simpan Divisi Baru"}
                </button>
              </div>
            </form>

            {/* List Existing Departments */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">Daftar Divisi Saat Ini</h5>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {departments.map((dept) => (
                  <div key={dept.id || dept.name} className="flex items-center justify-between p-4 hover:bg-slate-50 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                        {dept.code && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
                            {dept.code}
                          </span>
                        )}
                      </div>
                      {dept.description && <p className="text-xs text-slate-500 mt-1">{dept.description}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-50 text-blue-800 px-3 py-1 text-xs font-bold border border-blue-200">
                        {dept.employeeCount || 0} Anggota
                      </span>
                      {user.role === "ADMIN" && (
                        <button
                          onClick={() => handleDeleteDept(dept.id, dept.name)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Hapus Divisi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
