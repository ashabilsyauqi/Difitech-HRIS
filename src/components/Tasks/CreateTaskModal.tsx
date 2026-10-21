"use client";

import { useState, useEffect } from "react";
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
}

const DEPARTMENTS = [
  { key: "SOSMED", label: "Sosmed", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { key: "ADS", label: "Ads", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "SEO", label: "SEO", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "WEB", label: "Web", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { key: "MARKETPLACE", label: "Marketplace", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "HR", label: "HR", color: "bg-slate-100 text-slate-700 border-slate-300" },
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
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentCard, setDepartmentCard] = useState(initialDepartment || "SOSMED");
  const [brandName, setBrandName] = useState(initialBrand || "");
  const [assigneeId, setAssigneeId] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState(2.0);
  const [isContentProduction, setIsContentProduction] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialDepartment) setDepartmentCard(initialDepartment);
    if (initialBrand) setBrandName(initialBrand);
  }, [initialDepartment, initialBrand]);

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
        if (!assigneeId) {
          if (defaultToSelf && userObj) {
            setAssigneeId(userObj.id);
          } else if (userObj) {
            setAssigneeId(userObj.id);
          } else if (data.employees && data.employees.length > 0) {
            setAssigneeId(data.employees[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
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
    if (!assigneeId) {
      setErrorMsg("Pilih penerima tugas (Assignee).");
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
          assigneeId,
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
      setIsContentProduction(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentDeptConfig = DEPARTMENTS.find((d) => d.key === departmentCard) || DEPARTMENTS[0];
  const isSelfAssigned = currentUser && assigneeId === currentUser.id;
  const selectedAssignee = employees.find((e) => e.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        {/* Header Lembar Kerja */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Lembar Kerja Tugas Baru</h3>
                <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${currentDeptConfig.color}`}>
                  Card {currentDeptConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Workspace Task Management • Terintegrasi Otomatis dengan HRIS
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
                {(departmentCard === "SOSMED" && isContentProduction
                  ? CONTENT_PRODUCTION_STAGES
                  : STANDARD_STAGES
                ).map((stage, idx, arr) => (
                  <div key={stage.key} className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                        idx === 0
                          ? "bg-red-600 text-white shadow-xs font-bold"
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

        {/* Form Body: 2-Column Worksheet */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          <div>
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pilihan Card Divisi: Hanya muncul jika TIDAK ADA initialDepartment (global modal) */}
            {!initialDepartment && (
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Card Divisi Tujuan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DEPARTMENTS.map((dept) => {
                    const isSelected = departmentCard === dept.key;
                    return (
                      <button
                        key={dept.key}
                        type="button"
                        onClick={() => setDepartmentCard(dept.key)}
                        className={`rounded-xl py-2 px-1 text-xs font-bold transition border text-center cursor-pointer ${
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
                    Judul Pekerjaan / Tugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Optimasi Konten SEO Pilar X / Produksi Video Review Produk..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-300 border-0 border-b-2 border-slate-200 focus:border-red-500 focus:ring-0 outline-none pb-2 transition"
                  />
                </div>

                {/* Lembar Kerja WYSIWYG Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Lembar Kerja Brief & Catatan Pengerjaan</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (WYSIWYG: Dukungan format tebal, list, checklist & link)
                      </span>
                    </label>
                  </div>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Tuliskan spesifikasi detail, instruksi pengerjaan, checklist target, atau tempel link Figma/Drive di sini..."
                    minHeight="260px"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Properti Tugas (Sidebar) */}
              <div className="lg:col-span-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Properti Tugas</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${currentDeptConfig.color}`}>
                    {currentDeptConfig.label}
                  </span>
                </div>

                {/* 1. Penerima Tugas: Dropdown Otomatis 1-Klik */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Penerima Tugas (Assignee) <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none appearance-none bg-white font-medium"
                    >
                      <option value="" disabled>Pilih Penerima Tugas...</option>
                      {currentUser && (
                        <option value={currentUser.id}>
                          👤 Saya Sendiri ({currentUser.name})
                        </option>
                      )}
                      <optgroup label="Rekan Kerja / Anggota Tim">
                        {employees
                          .filter((emp) => !currentUser || emp.id !== currentUser.id)
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} — {emp.jobTitle || emp.department || "Karyawan"}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                    <User className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Reactive indicator */}
                  <div className="mt-1.5 text-[10px]">
                    {isSelfAssigned ? (
                      <p className="text-blue-700 bg-blue-50/80 border border-blue-200/80 p-2 rounded-lg leading-relaxed">
                        ✨ <strong>Tugas Pribadi:</strong> Otomatis masuk ke menu <strong>Tugas Pribadi</strong> Anda dan terpajang di Card <strong>{departmentCard}</strong>.
                      </p>
                    ) : (
                      <p className="text-purple-700 bg-purple-50/80 border border-purple-200/80 p-2 rounded-lg leading-relaxed">
                        📤 <strong>Delegasi Tim:</strong> Ditugaskan ke <strong>{selectedAssignee?.name || "Rekan Tim"}</strong>. Notifikasi otomatis akan dikirim ke akunnya.
                      </p>
                    )}
                  </div>
                </div>

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

                {/* 4. Prioritas & Estimasi Jam */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Prioritas
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-800 focus:border-red-500 outline-none bg-white font-medium"
                    >
                      <option value="LOW">Rendah</option>
                      <option value="MEDIUM">Sedang</option>
                      <option value="HIGH">Tinggi</option>
                      <option value="URGENT">Mendesak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Estimasi Jam
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-2 py-2 text-xs text-slate-800 focus:border-red-500 outline-none bg-white"
                      />
                      <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 5. Khusus Divisi Sosmed: Masukkan ke Kanban Content Production */}
                {departmentCard === "SOSMED" && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isContentProduction}
                        onChange={(e) => setIsContentProduction(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-pink-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-pink-900 block flex items-center gap-1">
                          <Clapperboard className="h-3 w-3 text-pink-600" />
                          Pipeline Kanban Konten
                        </span>
                        <span className="text-[10px] text-pink-700 leading-tight block mt-0.5">
                          Aktifkan jika tugas memerlukan alur Brief &rarr; Shooting &rarr; Editing &rarr; Approval.
                        </span>
                      </div>
                    </label>
                  </div>
                )}
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
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isLoading ? "Menyimpan Lembar Kerja..." : "Posting Lembar Kerja Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
