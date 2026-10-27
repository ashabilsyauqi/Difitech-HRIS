import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Home,
  MapPin,
  Clock,
  Camera,
  Zap,
  CheckCircle2,
  Users,
  X,
  Eye,
  Info,
  CalendarRange,
  Layers,
  Settings,
  SlidersHorizontal,
  Save,
  Loader2,
} from "lucide-react";

interface AttendanceCalendarViewProps {
  attendances: any[];
  usersList: any[];
  selectedUser: string;
  onSelectUser: (userId: string) => void;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onViewPhoto: (attendance: any, type: "CLOCK_IN" | "CLOCK_OUT") => void;
  isLoading?: boolean;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function AttendanceCalendarView({
  attendances,
  usersList,
  selectedUser,
  onSelectUser,
  startDate,
  endDate,
  onDateRangeChange,
  onViewPhoto,
  isLoading = false,
}: AttendanceCalendarViewProps) {
  // Preset Mode: "MONTH" (1-31), "CYCLE" (cutoffStartDay of prev month to cutoffEndDay of current month), or "CUSTOM"
  const [periodMode, setPeriodMode] = useState<"MONTH" | "CYCLE" | "CUSTOM">("MONTH");

  // Dynamic Cutoff Settings
  const [cutoffStartDay, setCutoffStartDay] = useState(17);
  const [cutoffEndDay, setCutoffEndDay] = useState(16);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Settings Modal State
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const [tempStartDay, setTempStartDay] = useState(17);
  const [tempEndDay, setTempEndDay] = useState(16);
  const [isSavingCutoff, setIsSavingCutoff] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    // 1. Fetch current office settings for cutoff
    fetch("/api/settings/office")
      .then((res) => res.json())
      .then((data) => {
        if (data?.office?.cutoffStartDay) {
          const s = Number(data.office.cutoffStartDay) || 17;
          const e = Number(data.office.cutoffEndDay) || (s === 1 ? 31 : s - 1);
          setCutoffStartDay(s);
          setCutoffEndDay(e);
          setTempStartDay(s);
          setTempEndDay(e);
        }
      })
      .catch((err) => console.error("Failed to load cutoff settings:", err));

    // 2. Fetch authenticated user for admin access
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error("Failed to load user:", err));
  }, []);

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  // Reference year & month (for Month or Cycle navigation)
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [refYear, setRefYear] = useState(initialDate.getFullYear());
  const [refMonth, setRefMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Custom date inputs
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  // Inspector Day Modal
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    items: any[];
  } | null>(null);

  // Switch Period Mode
  const handleSelectPeriodMode = (mode: "MONTH" | "CYCLE" | "CYCLE_17" | "CUSTOM") => {
    const normalizedMode = mode === "CYCLE_17" ? "CYCLE" : mode;
    setPeriodMode(normalizedMode);
    if (normalizedMode === "MONTH") {
      applyMonth(refYear, refMonth);
    } else if (normalizedMode === "CYCLE") {
      applyCycle(refYear, refMonth);
    }
  };

  // Apply Month: 1st to last day of refMonth/refYear
  const applyMonth = (year: number, month: number) => {
    setRefYear(year);
    setRefMonth(month);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const sDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const eDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    onDateRangeChange(sDate, eDate);
  };

  // Apply Cutoff Cycle: startDay of previous month to endDay of current month
  const applyCycle = (year: number, month: number, startDay = cutoffStartDay, endDay = cutoffEndDay) => {
    setRefYear(year);
    setRefMonth(month);
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const sDayStr = String(startDay).padStart(2, "0");
    const eDayStr = String(endDay).padStart(2, "0");
    const sDate = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${sDayStr}`;
    const eDate = `${year}-${String(month + 1).padStart(2, "0")}-${eDayStr}`;
    onDateRangeChange(sDate, eDate);
  };

  // Navigation handlers
  const handlePrev = () => {
    const nextM = refMonth === 0 ? 11 : refMonth - 1;
    const nextY = refMonth === 0 ? refYear - 1 : refYear;
    if (periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17") {
      applyCycle(nextY, nextM);
    } else {
      applyMonth(nextY, nextM);
    }
  };

  const handleNext = () => {
    const nextM = refMonth === 11 ? 0 : refMonth + 1;
    const nextY = refMonth === 11 ? refYear + 1 : refYear;
    if (periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17") {
      applyCycle(nextY, nextM);
    } else {
      applyMonth(nextY, nextM);
    }
  };

  const handleCurrent = () => {
    const now = new Date();
    if (periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17") {
      let cycleMonth = now.getMonth();
      let cycleYear = now.getFullYear();
      if (now.getDate() >= cutoffStartDay) {
        cycleMonth = cycleMonth === 11 ? 0 : cycleMonth + 1;
        cycleYear = cycleMonth === 0 ? cycleYear + 1 : cycleYear;
      }
      applyCycle(cycleYear, cycleMonth);
    } else {
      applyMonth(now.getFullYear(), now.getMonth());
    }
  };

  const handleSaveCutoffSettings = async () => {
    try {
      setIsSavingCutoff(true);
      const res = await fetch("/api/settings/office", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutoffStartDay: tempStartDay,
          cutoffEndDay: tempEndDay,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan pengaturan cut-off");
      }

      setCutoffStartDay(tempStartDay);
      setCutoffEndDay(tempEndDay);
      setSaveSuccessMsg("Siklus cut-off berhasil diperbarui!");

      if (periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17") {
        applyCycle(refYear, refMonth, tempStartDay, tempEndDay);
      }

      setTimeout(() => {
        setSaveSuccessMsg("");
        setIsCutoffModalOpen(false);
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan cut-off");
    } finally {
      setIsSavingCutoff(false);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onDateRangeChange(customStart, customEnd);
    }
  };

  // Group attendances by date (YYYY-MM-DD)
  const attendancesByDate: Record<string, any[]> = {};
  attendances.forEach((att) => {
    if (!att.date) return;
    if (!attendancesByDate[att.date]) {
      attendancesByDate[att.date] = [];
    }
    attendancesByDate[att.date].push(att);
  });

  // Calculate Accumulation Metrics for the selected date range
  const wfaList = attendances.filter((a) => a.attendanceType === "WFA");
  const officeList = attendances.filter((a) => !a.attendanceType || a.attendanceType === "OFFICE");
  const clientList = attendances.filter((a) => a.attendanceType === "CLIENT_VISIT");
  const overtimeList = attendances.filter((a) => (a.overtimeMinutes || 0) > 0 || a.isOvertime);

  // Check if range spans multiple months
  const spansMultipleMonths =
    startDate && endDate && startDate.slice(0, 7) !== endDate.slice(0, 7);

  // Format date chip
  const formatChipDate = (dStr: string) => {
    const parts = dStr.split("-");
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return spansMultipleMonths ? `${d} ${SHORT_MONTH_NAMES[m]}` : `${d}`;
  };

  const getUniqueDateLabels = (items: any[]) => {
    const dates = Array.from(new Set(items.map((i) => i.date))).sort();
    return dates.map(formatChipDate);
  };

  const wfaDateLabels = getUniqueDateLabels(wfaList);
  const officeDateLabels = getUniqueDateLabels(officeList);
  const clientDateLabels = getUniqueDateLabels(clientList);

  // Active User Object
  const activeUserObj = usersList.find((u) => u.id === selectedUser);

  // Format nice human-readable range
  const formatHumanDate = (dStr: string) => {
    if (!dStr) return "";
    const [y, m, d] = dStr.split("-").map(Number);
    return `${d} ${SHORT_MONTH_NAMES[m - 1]} ${y}`;
  };

  // Build Continuous Calendar Grid from Monday before startDate to Sunday after endDate
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const buildGrid = () => {
    if (!startDate || !endDate) return [];
    const [sY, sM, sD] = startDate.split("-").map(Number);
    const [eY, eM, eD] = endDate.split("-").map(Number);

    const startObj = new Date(sY, sM - 1, sD);
    const endObj = new Date(eY, eM - 1, eD);

    // Monday on or before startObj (Monday = 0)
    const startDayOfWeek = (startObj.getDay() + 6) % 7;
    const gridStart = new Date(startObj);
    gridStart.setDate(gridStart.getDate() - startDayOfWeek);

    // Sunday on or after endObj
    const endDayOfWeek = (endObj.getDay() + 6) % 7;
    const gridEnd = new Date(endObj);
    gridEnd.setDate(gridEnd.getDate() + (6 - endDayOfWeek));

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      month: number;
      year: number;
      isWithinRange: boolean;
      isWeekend: boolean;
      isFirstOfMonthOrRange: boolean;
    }> = [];

    const curr = new Date(gridStart);

    while (curr <= gridEnd) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const d = curr.getDate();
      const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = (curr.getDay() + 6) % 7;

      const isWithinRange = dStr >= startDate && dStr <= endDate;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const isFirstOfMonthOrRange = d === 1 || dStr === startDate;

      cells.push({
        dateStr: dStr,
        dayNumber: d,
        month: m,
        year: y,
        isWithinRange,
        isWeekend,
        isFirstOfMonthOrRange,
      });

      curr.setDate(curr.getDate() + 1);
    }

    return cells;
  };

  const gridCells = buildGrid();

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Mode Selector, Employee, & Period Navigation */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        {/* Row 1: Period Mode Tabs & Employee Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          {/* Employee Selector */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 font-bold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Karyawan
              </span>
              <select
                value={selectedUser}
                onChange={(e) => onSelectUser(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">🌐 Semua Karyawan ({usersList.length})</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} {u.jobTitle ? `(${u.jobTitle})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Mode Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleSelectPeriodMode("MONTH")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                periodMode === "MONTH"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🗓️ 1 Bulan Penuh (1 - 31)
            </button>

            <button
              type="button"
              onClick={() => handleSelectPeriodMode("CYCLE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17"
                  ? "bg-white text-blue-700 shadow-2xs border border-blue-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              <span>Siklus Cut-off {cutoffStartDay} ({cutoffStartDay} - {cutoffEndDay})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPeriodMode("CUSTOM")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                periodMode === "CUSTOM"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📅 Kustom Rentang Tanggal
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setTempStartDay(cutoffStartDay);
                  setTempEndDay(cutoffEndDay);
                  setIsCutoffModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs ml-1"
                title="Atur Tanggal Siklus Cut-off (Khusus Admin/Manager)"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span>Atur Siklus</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Period Controls according to PeriodMode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {periodMode === "MONTH" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <select
                value={refMonth}
                onChange={(e) => applyMonth(refYear, parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-red-500 focus:outline-none shadow-2xs"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={refYear}
                onChange={(e) => applyMonth(parseInt(e.target.value, 10), refMonth)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-red-500 focus:outline-none shadow-2xs"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrent}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition active:scale-95 shadow-2xs"
              >
                Bulan Ini
              </button>
            </div>
          )}

          {(periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17") && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
                title="Siklus Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 rounded-xl bg-blue-50/80 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-900">
                <Zap className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Siklus: {cutoffStartDay} {SHORT_MONTH_NAMES[refMonth === 0 ? 11 : refMonth - 1]} s.d. {cutoffEndDay} {SHORT_MONTH_NAMES[refMonth]} {refYear}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDay(cutoffStartDay);
                      setTempEndDay(cutoffEndDay);
                      setIsCutoffModalOpen(true);
                    }}
                    className="ml-1 inline-flex items-center gap-1 rounded-md bg-blue-100/90 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-200 transition"
                    title="Ubah Siklus Cut-off"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Ubah</span>
                  </button>
                )}
              </div>

              <select
                value={refMonth}
                onChange={(e) => applyCycle(refYear, parseInt(e.target.value, 10))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-red-500 focus:outline-none shadow-2xs"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    Cut-off {name}
                  </option>
                ))}
              </select>

              <select
                value={refYear}
                onChange={(e) => applyCycle(parseInt(e.target.value, 10), refMonth)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-red-500 focus:outline-none shadow-2xs"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
                title="Siklus Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrent}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition active:scale-95 shadow-2xs"
              >
                Siklus Berjalan
              </button>
            </div>
          )}

          {periodMode === "CUSTOM" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold text-[11px] uppercase">Dari:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold text-[11px] uppercase">Sampai:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-2xs"
              >
                Terapkan Rentang
              </button>
            </div>
          )}

          {/* Active Date Range Indicator */}
          <div className="text-right text-[11px] font-semibold text-slate-500">
            Rentang Aktif: <strong className="text-slate-800 font-mono">{formatHumanDate(startDate)}</strong> s.d.{" "}
            <strong className="text-slate-800 font-mono">{formatHumanDate(endDate)}</strong>
          </div>
        </div>
      </div>

      {/* 2. Instant Accumulation & Rekap Otomatis */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {periodMode === "CYCLE" || (periodMode as any) === "CYCLE_17"
                ? `Akumulasi Siklus ${cutoffStartDay} (${formatHumanDate(startDate)} - ${formatHumanDate(endDate)})`
                : `Akumulasi Presensi: ${formatHumanDate(startDate)} s.d. ${formatHumanDate(endDate)}`}
              {activeUserObj ? ` — ${activeUserObj.name}` : ""}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Dihitung otomatis untuk rentang {startDate} s.d. {endDate}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Card 1: WFA / Remote (Blue) */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-blue-100/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                WFA / Remote
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Home className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-900">{wfaList.length}</span>
              <span className="text-xs font-bold text-blue-700">Hari</span>
            </div>
            {wfaDateLabels.length > 0 ? (
              <p
                className="mt-1 text-[10px] text-blue-700/80 font-medium truncate"
                title={`Tanggal: ${wfaDateLabels.join(", ")}`}
              >
                Tgl: {wfaDateLabels.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-blue-400">Belum ada WFA</p>
            )}
          </div>

          {/* Card 2: Kantor / Difitech HQ (Emerald) */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Kantor HQ
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Building2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-900">{officeList.length}</span>
              <span className="text-xs font-bold text-emerald-700">Hari</span>
            </div>
            {officeDateLabels.length > 0 ? (
              <p
                className="mt-1 text-[10px] text-emerald-700/80 font-medium truncate"
                title={`Tanggal: ${officeDateLabels.join(", ")}`}
              >
                Tgl: {officeDateLabels.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-emerald-400">Belum ada di kantor</p>
            )}
          </div>

          {/* Card 3: Dinas Luar / Klien / WFC (Purple) */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 to-purple-100/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                Dinas / Klien (WFC)
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <MapPin className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-900">{clientList.length}</span>
              <span className="text-xs font-bold text-purple-700">Hari</span>
            </div>
            {clientDateLabels.length > 0 ? (
              <p
                className="mt-1 text-[10px] text-purple-700/80 font-medium truncate"
                title={`Tanggal: ${clientDateLabels.join(", ")}`}
              >
                Tgl: {clientDateLabels.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-purple-400">Belum ada kunjungan</p>
            )}
          </div>

          {/* Card 4: Lembur (Amber) */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-amber-100/30 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Lembur
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-900">{overtimeList.length}</span>
              <span className="text-xs font-bold text-amber-700">Sesi</span>
            </div>
            <p className="mt-1 text-[10px] text-amber-600 font-medium truncate">
              {overtimeList.length > 0
                ? `${Math.round(overtimeList.reduce((acc, a) => acc + (a.overtimeMinutes || 0), 0) / 60)} Jam lembur`
                : "Tidak ada lembur"}
            </p>
          </div>

          {/* Card 5: Total Hari Kerja Aktif (Slate) */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Hadir
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{attendances.length}</span>
              <span className="text-xs font-bold text-slate-600">Presensi</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 font-medium truncate">
              {wfaList.length} WFA, {officeList.length} HQ
            </p>
          </div>
        </div>
      </div>

      {/* 3. Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500">Keterangan Warna Tag Kalender:</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700 text-[11px]">WFA (Biru)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700 text-[11px]">Kantor HQ (Hijau)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span className="font-semibold text-slate-700 text-[11px]">Dinas Luar / Klien (Ungu)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold text-slate-700 text-[11px]">Lembur (Amber)</span>
          </div>
        </div>
      </div>

      {/* 4. Monthly / Period Calendar Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Day-of-week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase text-slate-500">
          {DAY_NAMES.map((dName, idx) => (
            <div
              key={dName}
              className={`py-3 ${idx >= 5 ? "bg-slate-100/60 text-slate-400" : ""}`}
            >
              <span className="hidden sm:inline">{dName}</span>
              <span className="sm:hidden">{dName.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100">
          {gridCells.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const items = attendancesByDate[cell.dateStr] || [];

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => {
                  if (items.length > 0 && cell.isWithinRange) {
                    setSelectedDayDetail({
                      dateStr: cell.dateStr,
                      items,
                    });
                  }
                }}
                className={`min-h-[105px] sm:min-h-[125px] p-2 flex flex-col justify-between transition group ${
                  !cell.isWithinRange
                    ? "bg-slate-50/40 text-slate-300 opacity-40 select-none"
                    : cell.isWeekend
                    ? "bg-slate-50/50 hover:bg-slate-100/60"
                    : "bg-white hover:bg-slate-50/80"
                } ${items.length > 0 && cell.isWithinRange ? "cursor-pointer" : ""}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-red-600 text-white shadow-xs shadow-red-500/30"
                          : !cell.isWithinRange
                          ? "text-slate-300"
                          : cell.isWeekend
                          ? "text-slate-400 font-medium"
                          : "text-slate-700"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Show Month badge when month changes or on first day */}
                    {(cell.isFirstOfMonthOrRange || cell.dayNumber === 1) && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                        {SHORT_MONTH_NAMES[cell.month]}
                      </span>
                    )}
                  </div>

                  {cell.isWithinRange && items.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {items.length} {items.length === 1 ? "log" : "logs"}
                    </span>
                  )}
                </div>

                {/* Day Content: Attendance Tags */}
                <div className="mt-1 space-y-1 flex-1">
                  {cell.isWithinRange &&
                    items.slice(0, 3).map((att) => {
                      const isWfa = att.attendanceType === "WFA";
                      const isClient = att.attendanceType === "CLIENT_VISIT";

                      // Style configuration
                      let tagBg = "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
                      let icon = <Building2 className="h-3 w-3 text-emerald-600 shrink-0" />;
                      let label = "Kantor";

                      if (isWfa) {
                        tagBg = "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100";
                        icon = <Home className="h-3 w-3 text-blue-600 shrink-0" />;
                        label = "WFA";
                      } else if (isClient) {
                        tagBg = "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100";
                        icon = <MapPin className="h-3 w-3 text-purple-600 shrink-0" />;
                        label = att.clientName ? `Klien: ${att.clientName}` : "Dinas Luar";
                      }

                      const inTime = att.clockInTime
                        ? new Date(att.clockInTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--";

                      return (
                        <div
                          key={att.id}
                          className={`group/item flex items-center justify-between rounded-lg border px-1.5 py-1 text-[10px] font-semibold transition ${tagBg}`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {icon}
                            <span className="truncate">
                              {selectedUser === "ALL" ? `${att.user?.name?.split(" ")[0]} (${label})` : label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
                            <span>{inTime}</span>
                            {att.clockInPhoto && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewPhoto(att, "CLOCK_IN");
                                }}
                                className="text-slate-500 hover:text-red-600 p-0.5 rounded transition"
                                title="Lihat CamStamp"
                              >
                                <Camera className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {cell.isWithinRange && items.length > 3 && (
                    <div className="text-[10px] font-bold text-slate-500 text-center py-0.5">
                      +{items.length - 3} lainnya...
                    </div>
                  )}
                </div>

                {/* Day Footer / Overtime Indicator */}
                {cell.isWithinRange && items.some((a) => (a.overtimeMinutes || 0) > 0) && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 rounded px-1 py-0.5 border border-amber-200">
                    <Zap className="h-2.5 w-2.5" />
                    <span>Ada Lembur</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Date Detail Drawer / Modal (When a Day is Clicked) */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                  Rincian Presensi Harian
                </span>
                <h4 className="text-base font-black text-slate-900">
                  📅 {formatHumanDate(selectedDayDetail.dateStr)}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Attendance List on this date */}
            <div className="space-y-3">
              {selectedDayDetail.items.map((att) => {
                const isWfa = att.attendanceType === "WFA";
                const isClient = att.attendanceType === "CLIENT_VISIT";

                let badgeCls = "bg-emerald-100 text-emerald-800 border-emerald-200";
                let badgeText = "🏢 Kantor HQ";

                if (isWfa) {
                  badgeCls = "bg-blue-100 text-blue-800 border-blue-200";
                  badgeText = "🏠 WFA / Remote";
                } else if (isClient) {
                  badgeCls = "bg-purple-100 text-purple-800 border-purple-200";
                  badgeText = "📍 Dinas Luar / Klien";
                }

                return (
                  <div
                    key={att.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                  >
                    {/* User & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-xs">
                          {att.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{att.user?.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {att.user?.jobTitle || att.user?.department || "Karyawan"}
                          </p>
                        </div>
                      </div>

                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeCls}`}>
                        {badgeText}
                      </span>
                    </div>

                    {/* Time & Duration Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white rounded-xl p-2.5 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Jam Masuk</span>
                        <span className="font-mono font-bold text-slate-800">
                          {att.clockInTime
                            ? `${new Date(att.clockInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB`
                            : "--"}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          {att.clockInStatus === "ON_TIME"
                            ? "✓ Tepat Waktu"
                            : att.clockInStatus === "LATE"
                            ? "⚠️ Terlambat"
                            : att.clockInStatus}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Jam Pulang</span>
                        <span className="font-mono font-bold text-slate-800">
                          {att.clockOutTime
                            ? `${new Date(att.clockOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB`
                            : "Masih Bekerja"}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Durasi:{" "}
                          {att.workDurationMinutes
                            ? `${Math.floor(att.workDurationMinutes / 60)}j ${att.workDurationMinutes % 60}m`
                            : "--"}
                        </span>
                      </div>
                    </div>

                    {/* Location / Geofence Info */}
                    <div className="text-[10px] text-slate-600 space-y-1">
                      {isWfa ? (
                        <p className="flex items-center gap-1.5 text-blue-700">
                          <Home className="h-3 w-3 shrink-0" />
                          <span>WFA / Bebas Geofence ({att.clientName || "Remote"})</span>
                        </p>
                      ) : isClient ? (
                        <p className="flex items-center gap-1.5 text-purple-700">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>
                            Klien: <strong>{att.clientName || "Dinas Luar"}</strong>
                          </span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-emerald-700">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>
                            {att.office?.name || "Difitech HQ"} (Radius:{" "}
                            {att.clockInDistance ? `${att.clockInDistance.toFixed(0)}m` : "--"})
                          </span>
                        </p>
                      )}

                      {att.overtimeMinutes > 0 && (
                        <p className="flex items-center gap-1.5 text-amber-700 font-bold">
                          <Zap className="h-3 w-3 shrink-0" />
                          <span>
                            Lembur: {Math.floor(att.overtimeMinutes / 60)}j {att.overtimeMinutes % 60}m
                          </span>
                        </p>
                      )}
                    </div>

                    {/* CamStamp Photos Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                      {att.clockInPhoto && (
                        <button
                          type="button"
                          onClick={() => onViewPhoto(att, "CLOCK_IN")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-2xs"
                        >
                          <Camera className="h-3.5 w-3.5 text-red-600" />
                          <span>Foto CamStamp Masuk</span>
                        </button>
                      )}

                      {att.clockOutPhoto && (
                        <button
                          type="button"
                          onClick={() => onViewPhoto(att, "CLOCK_OUT")}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                        >
                          <Camera className="h-3.5 w-3.5 text-blue-600" />
                          <span>Foto CamStamp Pulang</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cut-off Settings Modal (Admin / Manager only) */}
      {isCutoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan Siklus Cut-off
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi rentang siklus presensi & absensi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCutoffModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilihan Cepat (Preset Standar)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDay(17);
                      setTempEndDay(16);
                    }}
                    className={`rounded-xl border p-2 text-left font-bold transition ${
                      tempStartDay === 17 && tempEndDay === 16
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    17 s.d. 16
                    <span className="block text-[10px] font-normal text-slate-500">
                      Standar HRIS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDay(21);
                      setTempEndDay(20);
                    }}
                    className={`rounded-xl border p-2 text-left font-bold transition ${
                      tempStartDay === 21 && tempEndDay === 20
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    21 s.d. 20
                    <span className="block text-[10px] font-normal text-slate-500">
                      Cut-off tgl 20
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDay(26);
                      setTempEndDay(25);
                    }}
                    className={`rounded-xl border p-2 text-left font-bold transition ${
                      tempStartDay === 26 && tempEndDay === 25
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    26 s.d. 25
                    <span className="block text-[10px] font-normal text-slate-500">
                      Gajian Akhir Bulan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTempStartDay(1);
                      setTempEndDay(31);
                    }}
                    className={`rounded-xl border p-2 text-left font-bold transition ${
                      tempStartDay === 1 && tempEndDay === 31
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    1 s.d. Akhir Bulan
                    <span className="block text-[10px] font-normal text-slate-500">
                      Bulan Penuh (1-31)
                    </span>
                  </button>
                </div>
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={tempStartDay}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(28, parseInt(e.target.value, 10) || 1));
                      setTempStartDay(val);
                      if (val === 1) {
                        setTempEndDay(31);
                      } else {
                        setTempEndDay(val - 1);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bulan sebelumnya (1 - 28)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Selesai (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={tempEndDay}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1));
                      setTempEndDay(val);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Bulan berjalan (1 - 31)
                  </span>
                </div>
              </div>

              {/* Preview Box */}
              <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900">
                <span className="font-bold block mb-1">Simulasi Periode:</span>
                <p className="font-mono text-[11px]">
                  {tempStartDay} [Bulan Lalu] s.d. {tempEndDay} [Bulan Berjalan]
                </p>
                <p className="text-[10px] text-blue-700 mt-1">
                  Semua kartu akumulasi dan kalender presensi akan otomatis disesuaikan secara dinamis.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsCutoffModalOpen(false)}
                disabled={isSavingCutoff}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCutoffSettings}
                disabled={isSavingCutoff}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
              >
                {isSavingCutoff ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
