"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Calendar,
  Clock,
  User,
  Tag,
  Layers,
  AlertCircle,
  Clapperboard,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Users,
  Check,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  role: string;
  jobTitle?: string | null;
  avatarUrl: string | null;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDepartment?: string;
  initialBrand?: string;
  defaultToSelf?: boolean;
  initialIsContentProduction?: boolean;
}

import { canAccessBoard } from "@/lib/executive-boards";

interface DepartmentOption {
  key: string;
  label: string;
  color: string;
}

const ALL_DEPARTMENTS: DepartmentOption[] = [
  { key: "SOSMED", label: "Sosmed", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { key: "ADS", label: "Ads", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "SEO", label: "SEO", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "WEB", label: "Web", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { key: "MARKETPLACE", label: "Marketplace", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "HR", label: "HR", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { key: "CEO", label: "CEO", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { key: "DM_EXECUTIVE", label: "DM Executive", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

const STANDARD_STAGES = [
  { key: "INBOX", label: "1. Tugas Masuk", sublabel: "Inbox / Antrean" },
  { key: "IN_PROGRESS", label: "2. Dikerjakan", sublabel: "Sedang Berjalan" },
  { key: "COMPLETED", label: "3. Selesai", sublabel: "Review & Hasil" },
];

const CONTENT_PRODUCTION_STAGES = [
  { key: "CONTENT_BRIEF", label: "1. Brief" },
  { key: "SHOOTING", label: "2. Shooting" },
  { key: "DESIGN", label: "3. Design" },
  { key: "VIDEO_EDITING", label: "4. Editing" },
  { key: "REVISION", label: "5. Revisi" },
  { key: "APPROVAL", label: "6. Approval" },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  initialDepartment,
  initialBrand,
  defaultToSelf = false,
  initialIsContentProduction = false,
}: CreateTaskModalProps) {
  const [taskMode, setTaskMode] = useState<"PERSONAL" | "TEAM">(
    initialIsContentProduction ? "TEAM" : defaultToSelf ? "PERSONAL" : "PERSONAL"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentCard, setDepartmentCard] = useState(
    initialIsContentProduction ? "SOSMED" : initialDepartment || "SOSMED"
  );
  const [brandName, setBrandName] = useState(initialBrand || "");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [isContentProduction, setIsContentProduction] = useState(initialIsContentProduction);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialIsContentProduction) {
      setIsContentProduction(true);
      setDepartmentCard("SOSMED");
      setTaskMode("TEAM");
    } else {
      setIsContentProduction(false);
      if (initialDepartment) setDepartmentCard(initialDepartment);
      setTaskMode(defaultToSelf ? "PERSONAL" : "PERSONAL");
    }
    if (initialBrand) setBrandName(initialBrand);
  }, [initialDepartment, initialBrand, initialIsContentProduction, isOpen, defaultToSelf]);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen, defaultToSelf]);

  const fetchMetadata = async () => {
    try {
      const [metaRes, authRes] = await Promise.all([
        fetch("/api/workspace/metadata"),
        fetch("/api/auth/me"),
      ]);

      let userObj: any = null;
      if (authRes.ok) {
        const aData = await authRes.json();
        userObj = aData.user;
        setCurrentUser(aData.user);
      }

      if (metaRes.ok) {
        const data = await metaRes.json();
        setEmployees(data.employees || []);
        setBrands(data.brands || []);
        if (!brandName && data.brands && data.brands.length > 0) {
          setBrandName(data.brands[0]);
        }
        if (selectedAssigneeIds.length === 0) {
          if (defaultToSelf && userObj) {
            setSelectedAssigneeIds([userObj.id]);
          } else if (userObj) {
            setSelectedAssigneeIds([userObj.id]);
          } else if (data.employees && data.employees.length > 0) {
            setSelectedAssigneeIds([data.employees[0].id]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  };

  const toggleAssignee = (id: string) => {
    if (selectedAssigneeIds.includes(id)) {
      if (selectedAssigneeIds.length > 1) {
        setSelectedAssigneeIds(selectedAssigneeIds.filter((x) => x !== id));
      }
    } else {
      setSelectedAssigneeIds([...selectedAssigneeIds, id]);
    }
  };

  const selectOnlySelf = () => {
    if (currentUser) {
      setSelectedAssigneeIds([currentUser.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Judul tugas wajib diisi.");
      return;
    }
    if (!brandName.trim()) {
      setErrorMsg("Nama Brand wajib diisi.");
      return;
    }
    const finalAssigneeIds =
      taskMode === "PERSONAL" && currentUser
        ? [currentUser.id]
        : selectedAssigneeIds;

    if (finalAssigneeIds.length === 0) {
      setErrorMsg("Pilih minimal satu penerima tugas (Assignee).");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/workspace/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          departmentCard,
          brandName,
          assigneeIds: finalAssigneeIds,
          assigneeId: finalAssigneeIds[0],
          expectedDeadline: expectedDeadline || null,
          priority,
          estimatedHours,
          isContentProduction: departmentCard === "SOSMED" ? isContentProduction : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat tugas");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setExpectedDeadline("");
      setIsContentProduction(Boolean(initialIsContentProduction));
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const availableDepartments = useMemo(() => {
    return ALL_DEPARTMENTS.filter((d) => canAccessBoard(d.key, currentUser));
  }, [currentUser]);

  const currentDeptConfig =
    availableDepartments.find((d) => d.key === departmentCard) ||
    availableDepartments[0] ||
    ALL_DEPARTMENTS[0];
  const isSelfOnly =
    currentUser &&
    selectedAssigneeIds.length === 1 &&
    selectedAssigneeIds[0] === currentUser.id;
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(assigneeSearch.toLowerCase()))
  );
  const assignedNamesSummary = selectedAssigneeIds
    .map((id) => employees.find((e) => e.id === id)?.name || (currentUser?.id === id ? currentUser.name : ""))
    .filter(Boolean)
    .join(", ");
  const isSelfAssigned = isSelfOnly;
  const selectedAssignee = employees.find((e) => e.id === selectedAssigneeIds[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-7xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col h-[94vh] max-h-[96vh]">
        {/* Header Lembar Kerja */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${isContentProduction ? "bg-pink-100 text-pink-600" : "bg-red-100 text-red-600"}`}>
              {isContentProduction ? <Clapperboard className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {isContentProduction
                    ? "Lembar Kerja: Request Konten Baru (Sosmed)"
                    : taskMode === "PERSONAL"
                    ? "Lembar Kerja: Catat Tugas Pribadi"
                    : `Tambah / Delegasikan Tugas ke Tim ${currentDeptConfig.label}`}
                </h3>
                <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isContentProduction
                    ? "bg-pink-100 text-pink-700 border-pink-200"
                    : taskMode === "PERSONAL"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : currentDeptConfig.color
                }`}>
                  {isContentProduction
                    ? "🎬 Kanban Konten (Sosmed)"
                    : taskMode === "PERSONAL"
                    ? "👤 Tugas Mandiri"
                    : `Card ${currentDeptConfig.label}`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isContentProduction
                  ? "Pipeline Produksi Konten Tim Sosmed & Kreatif • DifWorkBoard System"
                  : taskMode === "PERSONAL"
                  ? "To-Do & Catatan Kerja Mandiri • Tanpa antrean review, langsung tuntas ke Done"
                  : `Workspace Task Management Tim ${currentDeptConfig.label} • DifWorkBoard System`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visual Pipeline Stages Bar */}
        <div className="bg-slate-900 text-white px-6 py-2.5 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tahapan Pipeline:
              </span>
              <div className="flex items-center gap-1.5">
                {(isContentProduction
                  ? CONTENT_PRODUCTION_STAGES
                  : STANDARD_STAGES
                ).map((stage, idx, arr) => (
                  <div key={stage.key} className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                        idx === 0
                          ? isContentProduction
                            ? "bg-pink-600 text-white shadow-xs font-bold"
                            : taskMode === "PERSONAL"
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "bg-red-600 text-white shadow-xs font-bold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx === 0 && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                      {stage.label}
                    </span>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-400 hidden lg:inline">
              Tugas baru akan diinisialisasi pada tahap pertama
            </span>
          </div>
        </div>

        {/* Segmented Switcher: Mode Tugas Pribadi vs Tugas Tim/Kolaborasi */}
        {!isContentProduction && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2 flex items-center justify-center shrink-0">
            <div className="inline-flex items-center bg-slate-200/90 p-1 rounded-2xl w-full max-w-lg shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => {
                  setTaskMode("PERSONAL");
                  if (currentUser) setSelectedAssigneeIds([currentUser.id]);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer select-none whitespace-nowrap ${
                  taskMode === "PERSONAL"
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="whitespace-nowrap">Tugas Pribadi (Mandiri)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskMode("TEAM");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer select-none whitespace-nowrap ${
                  taskMode === "TEAM"
                    ? "bg-white text-purple-700 shadow-sm ring-1 ring-purple-100"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="whitespace-nowrap">Tugas Tim / Kolaborasi</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body: 2-Column Worksheet */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div>
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pilihan Card Divisi: Hanya muncul jika TIDAK ADA initialDepartment dan bukan request konten */}
            {!initialDepartment && !isContentProduction && (
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Card Divisi Tujuan <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableDepartments.map((dept) => {
                    const isSelected = departmentCard === dept.key;
                    return (
                      <button
                        key={dept.key}
                        type="button"
                        onClick={() => setDepartmentCard(dept.key)}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition border text-center cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {dept.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Kolom Kiri: Canvas Lembar Kerja (Judul & WYSIWYG Editor) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Judul Tugas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isContentProduction ? "Judul Konten / Proyek Kreatif" : "Judul Pekerjaan / Tugas"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      isContentProduction
                        ? "Contoh: Video Reels Edukasi Fitur Produk / Desain Banner Kampanye..."
                        : "Contoh: Optimasi Konten SEO Pilar X / Maintenance Server..."
                    }
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-300 border-0 border-b-2 border-slate-200 focus:border-red-500 focus:ring-0 outline-none pb-2 transition"
                  />
                </div>

                {/* Lembar Kerja WYSIWYG Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>{isContentProduction ? "Lembar Kerja Brief Konten & Arahan Kreatif" : "Lembar Kerja Brief & Catatan Pengerjaan"}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (WYSIWYG: Dukungan format tebal, list, checklist & link)
                      </span>
                    </label>
                  </div>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={
                      isContentProduction
                        ? "Tuliskan konsep video/desain, hook pembuka, referensi visual, draft copy teks, durasi target, atau tempel link Figma/Drive di sini..."
                        : "Tuliskan spesifikasi detail, instruksi pengerjaan, checklist target, atau tempel link Figma/Drive di sini..."
                    }
                    minHeight="380px"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Properti Tugas (Sidebar) */}
              <div className="lg:col-span-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    {isContentProduction ? "Properti Konten" : "Properti Tugas"}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    isContentProduction ? "bg-pink-100 text-pink-700 border-pink-200" : currentDeptConfig.color
                  }`}>
                    {isContentProduction ? "Kanban Sosmed" : currentDeptConfig.label}
                  </span>
                </div>

                {/* 1. Penerima Tugas: Personal vs Team Multi-Assignee */}
                {taskMode === "PERSONAL" ? (
                  <div className="rounded-2xl bg-blue-50/90 border border-blue-200 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0">
                        {currentUser?.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          (currentUser?.name || "U").charAt(0)
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                          Pelaksana Tugas (PIC):
                        </span>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {currentUser?.name || "Saya Sendiri"} (Anda)
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {currentUser?.department || currentDeptConfig.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] text-blue-900 bg-white/90 p-2.5 rounded-xl border border-blue-100 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-blue-800 text-[11px]">
                        <span>✨ Alur Lembar Kerja Mandiri</span>
                      </p>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        Tugas ini otomatis masuk ke <strong>BigBoard Pribadi</strong> dan terpajang di <strong>BigBoard Divisi {currentDeptConfig.label}</strong>. Tanpa review dari orang lain, Anda dapat menyelesaikannya sendiri secara fleksibel dengan submit bukti pengerjaan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span>{isContentProduction ? "Tim Konten / PIC (Bisa >1 Orang)" : "Penerima Tugas (Bisa >1 Orang)"}</span>
                        <span className="text-red-500">*</span>
                      </label>
                      {currentUser && (
                        <button
                          type="button"
                          onClick={selectOnlySelf}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                        >
                          Pilih Saya Sendiri
                        </button>
                      )}
                    </div>

                    {/* Selected Assignees Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-white rounded-xl border border-slate-200 min-h-[42px] items-center">
                      {selectedAssigneeIds.map((id) => {
                        const emp = employees.find((e) => e.id === id) || (currentUser?.id === id ? currentUser : null);
                        const isSelf = currentUser?.id === id;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center overflow-hidden">
                              {emp?.avatarUrl ? (
                                <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                (emp?.name || "?").charAt(0)
                              )}
                            </span>
                            <span>{isSelf ? `${emp?.name || "Saya"} (Saya)` : emp?.name || "Anggota"}</span>
                            {selectedAssigneeIds.length > 1 && (
                              <button
                                type="button"
                                onClick={() => toggleAssignee(id)}
                                className="text-slate-400 hover:text-red-500 text-xs font-bold ml-0.5 cursor-pointer"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    {/* Search filter for team members */}
                    <div className="relative mb-1.5">
                      <input
                        type="text"
                        placeholder="Cari anggota tim (klik untuk tambah/kurang)..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-1.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
                      />
                      <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>

                    {/* Scrollable Members List */}
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-white p-1.5">
                      {filteredEmployees.map((emp) => {
                        const isChecked = selectedAssigneeIds.includes(emp.id);
                        const isMe = currentUser?.id === emp.id;
                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => toggleAssignee(emp.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                              isChecked
                                ? "bg-slate-900 text-white font-medium"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isChecked ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                {emp.name.charAt(0)}
                              </span>
                              <span className="truncate">
                                {emp.name} {isMe ? "(Saya)" : ""}
                              </span>
                              <span className={`text-[10px] truncate ${isChecked ? "text-slate-300" : "text-slate-400"}`}>
                                • {emp.jobTitle || emp.department || "Karyawan"}
                              </span>
                            </div>
                            {isChecked && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Corong Funnel Explainer */}
                    <div className="mt-2 text-[10px]">
                      <p className="text-purple-700 bg-purple-50/80 border border-purple-200/80 p-2 rounded-lg leading-relaxed">
                        🌪️ <strong>Corong Tim:</strong> Otomatis terpajang di <strong>BigBoard Divisi {currentDeptConfig.label}</strong> dan masuk ke <strong>BigBoard Pribadi {assignedNamesSummary}</strong>. Anda dapat memantau & mereview hasilnya di tab <strong>Delegasi Saya</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Label Nama Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Label Nama Brand <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="brand-suggestions"
                      placeholder="Ketik atau pilih brand..."
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
                    />
                    <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <datalist id="brand-suggestions">
                      {brands.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* 3. Deadline Expectation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Deadline
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={expectedDeadline}
                      onChange={(e) => setExpectedDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
                    />
                    <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition cursor-pointer ${
                isContentProduction
                  ? "bg-pink-600 hover:bg-pink-700"
                  : taskMode === "PERSONAL"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isContentProduction ? (
                <Clapperboard className="h-3.5 w-3.5" />
              ) : taskMode === "PERSONAL" ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>
                {isLoading
                  ? isContentProduction
                    ? "Menyimpan Request Konten..."
                    : taskMode === "PERSONAL"
                    ? "Menyimpan Tugas Pribadi..."
                    : "Menyimpan & Mengirim Tugas Tim..."
                  : isContentProduction
                  ? "🎬 Submit Request Konten ke Kanban"
                  : taskMode === "PERSONAL"
                  ? "Simpan ke Board Pribadi"
                  : `Kirim & Delegasikan ke Tim (${selectedAssigneeIds.length} Orang)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
