"use client";

import { X, ShieldCheck, MapPin, Clock, Smartphone, Download, User } from "lucide-react";

interface AttendanceRecord {
  id: string;
  user: {
    name: string;
    email: string;
    department?: string | null;
  };
  date: string;
  clockInTime: string;
  clockInPhoto: string;
  clockInLat: number;
  clockInLng: number;
  clockInAddress?: string | null;
  clockInStatus: string;
  clockInDistance?: number | null;
  clockOutTime?: string | null;
  clockOutPhoto?: string | null;
  clockOutLat?: number | null;
  clockOutLng?: number | null;
  clockOutAddress?: string | null;
  workDurationMinutes?: number | null;
}

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceRecord | null;
  viewType?: "CLOCK_IN" | "CLOCK_OUT";
}

export default function PhotoViewerModal({
  isOpen,
  onClose,
  attendance,
  viewType = "CLOCK_IN",
}: PhotoViewerModalProps) {
  if (!isOpen || !attendance) return null;

  const isClockIn = viewType === "CLOCK_IN";
  const photoUrl = isClockIn ? attendance.clockInPhoto : attendance.clockOutPhoto;
  const time = isClockIn ? attendance.clockInTime : attendance.clockOutTime;
  const lat = isClockIn ? attendance.clockInLat : attendance.clockOutLat;
  const lng = isClockIn ? attendance.clockInLng : attendance.clockOutLng;
  const address = isClockIn ? attendance.clockInAddress : attendance.clockOutAddress;
  const status = isClockIn ? attendance.clockInStatus : "COMPLETED";

  const handleDownload = () => {
    if (!photoUrl) return;
    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = `Difitech_CamStamp_${attendance.user.name.replace(/\s+/g, "_")}_${attendance.date}_${viewType}.jpg`;
    link.click();
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "ON_TIME":
        return { label: "Tepat Waktu (Terverifikasi)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "LATE":
        return { label: "Terlambat Masuk", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "OUT_OF_GEOFENCE":
        return { label: "Di Luar Geofence Kantor", color: "bg-red-100 text-red-800 border-red-200" };
      default:
        return { label: st, color: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const statusInfo = getStatusBadge(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Inspeksi Forensik Foto CamStamp Difitech HRIS
              </h3>
              <p className="text-[11px] text-slate-500">
                Stempel Terverifikasi: {isClockIn ? "Presensi Masuk" : "Presensi Pulang"} • {attendance.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1">
          {/* Photo Display */}
          <div className="md:col-span-7 bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto Stempel CamStamp"
                className="max-h-[460px] w-full object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Foto tidak tersedia untuk data ini.
              </div>
            )}
          </div>

          {/* Metadata Sidebar */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/70 p-5 space-y-4 text-xs">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2">
                <User className="h-3.5 w-3.5" />
                <span>Identitas Karyawan</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
                <p className="font-bold text-slate-900 text-sm">{attendance.user.name}</p>
                <p className="text-slate-500">{attendance.user.email}</p>
                <p className="text-[11px] font-semibold text-slate-700">
                  Divisi: {attendance.user.department || "Teknologi"}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>Validasi Lokasi & Geofence</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 shadow-2xs">
                <div>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Koordinat Terbakar</p>
                  <p className="font-mono text-slate-800 font-bold">
                    {lat ? lat.toFixed(6) : "--"}, {lng ? lng.toFixed(6) : "--"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Alamat Terbakar</p>
                  <p className="text-slate-700 leading-snug">
                    {address || "Lokasi terverifikasi oleh server GPS"}
                  </p>
                </div>

                {isClockIn && attendance.clockInDistance !== undefined && (
                  <div className="border-t border-slate-100 pt-2 flex justify-between">
                    <span className="text-slate-500">Jarak dari Titik HQ:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {attendance.clockInDistance ? `${attendance.clockInDistance.toFixed(0)} meter` : "--"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Waktu Presensi</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu ISO Client:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB" : "--:--:--"}
                  </span>
                </div>
                {attendance.workDurationMinutes && !isClockIn && (
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <span className="text-slate-500">Durasi Shift:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.floor(attendance.workDurationMinutes / 60)} Jam {attendance.workDurationMinutes % 60} Menit
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Foto Bukti</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
