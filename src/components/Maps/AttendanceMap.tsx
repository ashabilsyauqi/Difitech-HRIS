"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ShieldCheck, MapPin, Navigation, Layers } from "lucide-react";

interface EmployeeLocation {
  id: string;
  user: {
    name: string;
    email: string;
    department?: string | null;
    avatarUrl?: string | null;
  };
  clockInTime: string;
  clockInPhoto: string;
  clockInLat: number;
  clockInLng: number;
  clockInAddress?: string | null;
  clockInStatus: string;
  clockInDistance?: number | null;
  clockOutTime?: string | null;
  tasks?: { title: string; status: string }[];
}

interface OfficeInfo {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address?: string | null;
}

interface AttendanceMapProps {
  office: OfficeInfo | null;
  attendances: EmployeeLocation[];
  onInspectPhoto?: (att: any) => void;
}

function LeafletMapInner({
  office,
  attendances,
  onInspectPhoto,
}: AttendanceMapProps) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const defaultCenter: [number, number] = office
      ? [office.latitude, office.longitude]
      : [-6.224647, 106.809592];

    const map = L.map("attendance-leaflet-map", {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
    });

    // Clean Bright OpenStreetMap tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> OpenStreetMap',
        maxZoom: 19,
      }
    ).addTo(map);

    // 1. Office Geofence Circle & Marker with Taharica Red Pin & Blue Circle
    if (office) {
      const officeIcon = L.divIcon({
        className: "office-marker-pin",
        html: `
          <div style="background-color: #dc2626; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(220,38,38,0.4); font-size: 16px;">
            🏢
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([office.latitude, office.longitude], { icon: officeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px; padding: 2px;">
            <div style="font-weight: bold; color: #dc2626; font-size: 13px;">🏢 ${office.name}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${office.address || "Kantor Pusat"}</div>
            <div style="font-size: 11px; color: #2563eb; margin-top: 4px; font-weight: bold;">Radius Geofence: ${office.radiusMeters} meter</div>
          </div>
        `);

      // Geofence Circle Overlay in Blue
      L.circle([office.latitude, office.longitude], {
        radius: office.radiusMeters,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 2,
        dashArray: "4, 4",
      }).addTo(map);
    }

    // 2. Employee Markers
    attendances.forEach((att) => {
      const isOut = att.clockInStatus === "OUT_OF_GEOFENCE";
      const isLate = att.clockInStatus === "LATE";
      const pinColor = isOut ? "#dc2626" : isLate ? "#d97706" : "#16a34a";
      const statusText = isOut ? "Luar Geofence" : isLate ? "Terlambat" : "Tepat Waktu (Kantor)";

      const empIcon = L.divIcon({
        className: "emp-marker-pin",
        html: `
          <div style="background-color: ${pinColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.25); font-size: 14px; font-weight: bold;">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = document.createElement("div");
      popupContent.style.fontFamily = "sans-serif";
      popupContent.style.minWidth = "200px";
      popupContent.innerHTML = `
        <div style="font-weight: bold; color: #0f172a; font-size: 13px;">${att.user.name}</div>
        <div style="font-size: 11px; color: #64748b;">${att.user.department || "Karyawan"}</div>
        <div style="margin-top: 5px; display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: ${pinColor}18; color: ${pinColor}; border: 1px solid ${pinColor}33;">
          ${statusText}
        </div>
        <div style="font-size: 11px; color: #334155; margin-top: 6px;">
          ⏱ Jam Masuk: <b>${new Date(att.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WIB</b>
        </div>
        <div style="font-size: 11px; color: #334155;">
          📏 Jarak Kantor: <b>${att.clockInDistance ? att.clockInDistance.toFixed(0) + "m" : "--"}</b>
        </div>
        <div style="margin-top: 8px;">
          <button id="inspect-btn-${att.id}" style="width: 100%; background: #dc2626; color: white; border: none; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
            🔍 Lihat Foto CamStamp
          </button>
        </div>
      `;

      const marker = L.marker([att.clockInLat, att.clockInLng], { icon: empIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`inspect-btn-${att.id}`);
        if (btn && onInspectPhoto) {
          btn.onclick = () => onInspectPhoto(att);
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [L, office, attendances]);

  return <div id="attendance-leaflet-map" className="h-full w-full rounded-2xl" />;
}

export default function AttendanceMap(props: AttendanceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <Navigation className="h-6 w-6 animate-spin text-red-600" />
          <p className="text-xs font-semibold">Memuat Peta Radar Taharica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <LeafletMapInner {...props} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-2">
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          <span>Keterangan Status</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600 border border-white" />
            <span className="text-slate-700">Taharica HQ (SCBD)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-600 border border-white" />
            <span className="text-slate-700">Tepat Waktu di Kantor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-600 border border-white" />
            <span className="text-slate-700">Terlambat Masuk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600 border border-white" />
            <span className="text-slate-700">Di Luar Geofence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
