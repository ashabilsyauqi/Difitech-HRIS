"use client";

import { useState, useEffect } from "react";
import { X, Send, Calendar, Clock, User, Tag, Layers, AlertCircle } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  role: string;
  avatarUrl: string | null;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDepartment?: string;
  initialBrand?: string;
}

const DEPARTMENTS = [
  { key: "SOSMED", label: "Sosmed", color: "from-pink-500 to-rose-600" },
  { key: "ADS", label: "Ads", color: "from-blue-500 to-indigo-600" },
  { key: "SEO", label: "SEO", color: "from-amber-500 to-orange-600" },
  { key: "WEB", label: "Web", color: "from-emerald-500 to-teal-600" },
  { key: "MARKETPLACE", label: "Marketplace", color: "from-purple-500 to-violet-600" },
  { key: "HR", label: "HR", color: "from-slate-600 to-slate-800" },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  initialDepartment,
  initialBrand,
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
  }, [isOpen]);

  const fetchMetadata = async () => {
    try {
      const res = await fetch("/api/workspace/metadata");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setBrands(data.brands || []);
        if (!brandName && data.brands && data.brands.length > 0) {
          setBrandName(data.brands[0]);
        }
        if (!assigneeId && data.employees && data.employees.length > 0) {
          setAssigneeId(data.employees[0].id);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-red-100 p-2 text-red-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Buat Tugas Baru (Cross-Department)</h3>
              <p className="text-xs text-slate-500">Posting tugas ke 6 Card Divisi terhubung HRIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Pilih Divisi Card Tujuan */}
          <div>
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
                    className={`rounded-xl py-2 px-1 text-xs font-bold transition border text-center ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {dept.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Judul Tugas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembuatan Video TikTok Review Produk X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
            />
          </div>

          {/* 3. Label Nama Brand & Penerima Tugas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
                <Tag className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
                <datalist id="brand-suggestions">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Penerima Tugas (Assignee) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none appearance-none bg-white"
                >
                  <option value="" disabled>Pilih Karyawan...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department || "Karyawan"})
                    </option>
                  ))}
                </select>
                <User className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* 4. Target Deadline (Expected Deadline) & Prioritas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deadline Expectation (Target)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={expectedDeadline}
                  onChange={(e) => setExpectedDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
                <Calendar className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white"
              >
                <option value="LOW">Rendah (Low)</option>
                <option value="MEDIUM">Sedang (Medium)</option>
                <option value="HIGH">Tinggi (High)</option>
                <option value="URGENT">Mendesak (Urgent)</option>
              </select>
            </div>
          </div>

          {/* 5. Deskripsi & Brief Detail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi & Catatan Brief
            </label>
            <textarea
              rows={3}
              placeholder="Tuliskan spesifikasi, link referensi, atau instruksi pengerjaan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none leading-relaxed"
            />
          </div>

          {/* Khusus Divisi Sosmed: Checkbox Kanban Content Production */}
          {departmentCard === "SOSMED" && (
            <div className="rounded-xl border border-pink-200 bg-pink-50/60 p-3 flex items-start gap-3">
              <input
                type="checkbox"
                id="isContentProd"
                checked={isContentProduction}
                onChange={(e) => setIsContentProduction(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-pink-600 focus:ring-pink-500 border-pink-300"
              />
              <label htmlFor="isContentProd" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-pink-800">Oper Langsung ke Kanban Content Production</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tugas akan langsung masuk ke alur produksi Tim Sosmed (Content Brief &rarr; Shooting &rarr; Editing &rarr; Approval).
                </p>
              </label>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Posting Tugas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
