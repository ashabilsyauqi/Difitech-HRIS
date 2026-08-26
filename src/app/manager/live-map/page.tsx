"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AttendanceMap from "@/components/Maps/AttendanceMap";
import PhotoViewerModal from "@/components/CamStamp/PhotoViewerModal";
import { MapPin, RefreshCw } from "lucide-react";

export default function ManagerLiveMapPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [office, setOffice] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inspector Modal
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchLocations = async () => {
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

      const res = await fetch("/api/manager/live-locations");
      if (res.ok) {
        const data = await res.json();
        setOffice(data.office);
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error("Map fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Peta Radar GPS...</p>
        </div>
      </div>
    );
  }

  const insideCount = attendances.filter((a) => a.clockInStatus !== "OUT_OF_GEOFENCE").length;
  const violationCount = attendances.filter((a) => a.clockInStatus === "OUT_OF_GEOFENCE").length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-4 overflow-hidden h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex-shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                <MapPin className="h-4 w-4" />
                <span>Pemantauan Geofence Kantor</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Peta Presensi Karyawan Real-Time
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Di Kantor: <b>{insideCount}</b></span>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Luar Radius: <b>{violationCount}</b></span>
              </div>

              <button
                onClick={fetchLocations}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Perbarui Pin</span>
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 min-h-[400px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            <AttendanceMap
              office={office}
              attendances={attendances}
              onInspectPhoto={(att) => {
                setSelectedAttendance(att);
                setPhotoViewerOpen(true);
              }}
            />
          </div>
        </main>
      </div>

      <PhotoViewerModal
        isOpen={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        attendance={selectedAttendance}
        viewType="CLOCK_IN"
      />
    </div>
  );
}
