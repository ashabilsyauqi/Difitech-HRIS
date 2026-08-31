"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, AlertCircle, RefreshCw, X, ShieldCheck, Building, Briefcase } from "lucide-react";
import {
  CamStampWatermarkData,
  renderCamStampWatermark,
  renderCamStampCanvas,
} from "@/lib/camstamp-engine";
import { getReverseGeocodeAddress } from "@/lib/geofence";

interface CameraStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "CLOCK_IN" | "CLOCK_OUT" | "RETAKE_CLOCK_IN";
  user: {
    id: string;
    name: string;
    department?: string | null;
  };
  office?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  } | null;
  onSuccess: (attendanceData: any) => void;
  lockedTimestampIso?: string | Date | null;
}

export default function CameraStreamModal({
  isOpen,
  onClose,
  type,
  user,
  office,
  onSuccess,
  lockedTimestampIso,
}: CameraStreamModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("Mendeteksi lokasi...");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stampedPreviewUrl, setStampedPreviewUrl] = useState<string | null>(null);
  
  // Attendance Type Mode: OFFICE, WFA, CLIENT_VISIT
  const [attendanceType, setAttendanceType] = useState<"OFFICE" | "WFA" | "CLIENT_VISIT">("OFFICE");
  const [clientName, setClientName] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [wfaLocation, setWfaLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Kamera tidak dapat diakses. Mohon izinkan akses kamera di peramban Anda.");
    }
  };

  // Start GPS Tracking
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ lat: latitude, lng: longitude, accuracy });

        // Reverse geocoding for clean location display
        try {
          const addr = await getReverseGeocodeAddress(latitude, longitude);
          setLocationAddress(addr);
        } catch (e) {
          setLocationAddress("Jakarta, Indonesia");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGpsError(`Gagal mengambil GPS (${err.message}). Pastikan izin lokasi aktif.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      requestLocation();
    } else {
      stopCamera();
      setStampedPreviewUrl(null);
      setIsProcessing(false);
      setAttendanceType("OFFICE");
      setClientName("");
      setVisitPurpose("");
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Take Snapshot & Burn Watermark
  const handleCapture = async () => {
    if (!videoRef.current || !coords) return;

    if (attendanceType === "CLIENT_VISIT" && !clientName.trim()) {
      alert("Silakan masukkan Nama Klien / Perusahaan yang dikunjungi.");
      return;
    }

    setIsProcessing(true);
    try {
      const nowIso = lockedTimestampIso ? new Date(lockedTimestampIso).toISOString() : new Date().toISOString();
      const localTimeString = lockedTimestampIso
        ? new Date(lockedTimestampIso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
        : undefined;

      const watermarkData: CamStampWatermarkData = {
        timestampIso: nowIso,
        localTimeString: localTimeString,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracyMeters: coords.accuracy,
        address: locationAddress,
        userId: user.id,
        userName: user.name,
        deviceSignature: `${navigator.platform} | CamStamp v1.0 | Difitech HRIS`,
        type: type === "RETAKE_CLOCK_IN" ? "CLOCK_IN" : type,
        attendanceType,
        clientName: attendanceType === "CLIENT_VISIT" ? clientName.trim() : attendanceType === "WFA" ? wfaLocation.trim() : undefined,
        visitPurpose: attendanceType === "CLIENT_VISIT" ? visitPurpose.trim() : undefined,
        wfaLocation: attendanceType === "WFA" ? wfaLocation.trim() : undefined,
        statusLabel:
          attendanceType === "WFA"
            ? `WFA / REMOTE: ${wfaLocation.trim() || "WORK FROM ANYWHERE"}`
            : attendanceType === "CLIENT_VISIT"
            ? `KUNJUNGAN KLIEN: ${clientName.trim()}`
            : (type === "CLOCK_IN" || type === "RETAKE_CLOCK_IN")
            ? "DIFITECH CLOCK-IN"
            : "DIFITECH CLOCK-OUT",
      };

      let dataUrl: string;
      if (typeof renderCamStampWatermark === "function") {
        const finalCanvas = await renderCamStampWatermark(
          videoRef.current,
          canvasRef.current,
          watermarkData
        );
        dataUrl = finalCanvas.toDataURL("image/jpeg", 0.88);
      } else {
        dataUrl = renderCamStampCanvas(videoRef.current, watermarkData);
      }

      setStampedPreviewUrl(dataUrl);
    } catch (err: any) {
      console.error("Capture failure:", err);
      alert("Gagal memproses stempel foto: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit to Server API
  const handleSubmitAttendance = async () => {
    if (!stampedPreviewUrl || !coords) return;

    setIsProcessing(true);
    try {
      const endpoint =
        type === "RETAKE_CLOCK_IN"
          ? "/api/attendance/retake-photo"
          : type === "CLOCK_IN"
          ? "/api/attendance/clock-in"
          : "/api/attendance/clock-out";

      const payload = {
        photo: stampedPreviewUrl,
        photoDataUrl: stampedPreviewUrl,
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        address: locationAddress,
        clientTimestamp: lockedTimestampIso ? new Date(lockedTimestampIso).toISOString() : new Date().toISOString(),
        attendanceType,
        clientName: attendanceType === "CLIENT_VISIT" ? clientName.trim() : attendanceType === "WFA" ? (wfaLocation.trim() || "Work From Anywhere") : undefined,
        visitPurpose: attendanceType === "CLIENT_VISIT" ? visitPurpose.trim() : undefined,
        notes: notes.trim() || (attendanceType === "WFA" ? (wfaLocation ? `WFA di: ${wfaLocation}` : "WFA / Remote") : undefined),
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mencatat presensi");
      }

      onSuccess(data.attendance);
      onClose();
    } catch (err: any) {
      console.error("Submit attendance error:", err);
      alert(err.message || "Terjadi kesalahan saat memproses presensi.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {type === "RETAKE_CLOCK_IN"
                  ? "Foto Ulang Presensi Masuk (Stempel Pagi)"
                  : type === "CLOCK_IN"
                  ? "Presensi Masuk CamStamp"
                  : "Presensi Pulang CamStamp"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {type === "RETAKE_CLOCK_IN"
                  ? "Stempel waktu tetap menggunakan jam masuk pagi Anda"
                  : "Difitech Anti-Buddy Punching & Geofence"}
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

        {/* Tab Selection: Kantor vs WFA vs Kunjungan Klien */}
        {!stampedPreviewUrl && (
          <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setAttendanceType("OFFICE")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
                attendanceType === "OFFICE"
                  ? "bg-white text-red-600 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Kantor SCBD</span>
            </button>
            <button
              type="button"
              onClick={() => setAttendanceType("WFA")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
                attendanceType === "WFA"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">🏠</span>
              <span>WFA / Remote</span>
            </button>
            <button
              type="button"
              onClick={() => setAttendanceType("CLIENT_VISIT")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition text-center ${
                attendanceType === "CLIENT_VISIT"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Dinas Luar</span>
            </button>
          </div>
        )}

        {/* Video / Snapshot Area */}
        <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-900 min-h-[260px]">
          {cameraError ? (
            <div className="p-6 text-center text-xs text-red-400">
              <AlertCircle className="mx-auto h-8 w-8 mb-2 text-red-500" />
              <p>{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
              >
                Coba Lagi
              </button>
            </div>
          ) : !stampedPreviewUrl ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover max-h-[300px]"
              />
              <div className="absolute top-3 left-3 rounded-md bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/30 flex items-center gap-1.5 backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>KAMERA LIVE AKTIF</span>
              </div>
            </>
          ) : (
            <img
              src={stampedPreviewUrl}
              alt="Hasil Stempel"
              className="h-full w-full object-contain max-h-[300px]"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Info & Geolocation Data */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3 max-h-[280px] overflow-y-auto">
          {/* WFA / Remote Additional Inputs */}
          {attendanceType === "WFA" && !stampedPreviewUrl && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-cyan-900">
                <span className="text-sm">🏠</span>
                <span>Detail Lokasi Kerja WFA / Remote</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-cyan-800 mb-0.5">
                  Keterangan Lokasi WFA (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rumah / Co-working Space / Cafe / Bandung"
                  value={wfaLocation}
                  onChange={(e) => setWfaLocation(e.target.value)}
                  className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Client Visit Additional Inputs */}
          {attendanceType === "CLIENT_VISIT" && !stampedPreviewUrl && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-purple-900">
                <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                <span>Detail Kunjungan Klien / Dinas Luar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-purple-800 mb-0.5">Nama Klien / Perusahaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Telkom Indonesia"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-purple-800 mb-0.5">Keperluan / Agenda</label>
                  <input
                    type="text"
                    placeholder="Contoh: Meeting integrasi sistem"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GPS Info */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs">
            <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {coords ? "GPS Akurat Terkunci" : "Mencari Titik GPS..."}
                </span>
                {coords && (
                  <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Akurasi ±{coords.accuracy.toFixed(0)}m
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 truncate">{locationAddress}</p>
              {coords && (
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {gpsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
              {gpsError}
            </div>
          )}

          {/* Notes Input */}
          <div>
            <input
              type="text"
              placeholder="Catatan tambahan (opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            {stampedPreviewUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => setStampedPreviewUrl(null)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Ulangi Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={isProcessing || !coords}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 transition hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {isProcessing ? "Menyimpan Presensi..." : "Kirim Presensi Terverifikasi"}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={!coords || isProcessing || !!cameraError}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                  attendanceType === "CLIENT_VISIT"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/25"
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-600/25"
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>
                  {isProcessing
                    ? "Membakar Watermark CamStamp..."
                    : !coords
                    ? "Menunggu Sinyal GPS..."
                    : attendanceType === "CLIENT_VISIT"
                    ? "Ambil Foto Presensi Kunjungan Klien"
                    : "Ambil Foto Presensi (CamStamp)"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
