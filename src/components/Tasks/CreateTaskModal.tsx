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
  defaultToSelf?: boolean;
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
  const [assignmentType, setAssignmentType] = useState<"TEAM" | "SELF">(defaultToSelf ? "SELF" : "TEAM");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialDepartment) setDepartmentCard(initialDepartment);
    if (initialBrand) setBrandName(initialBrand);
  }, [initialDepartment, initialBrand]);

  useEffect(() => {
    if (isOpen) {
      if (defaultToSelf) {
        setAssignmentType("SELF");
      }
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

  const handleAssignmentTypeChange = (type: "TEAM" | "SELF") => {
    setAssignmentType(type);
    if (type === "SELF" && currentUser) {
      setAssigneeId(currentUser.id);
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Penerima Tugas <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange("TEAM")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                      assignmentType === "TEAM"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    👥 Anggota Tim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange("SELF")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                      assignmentType === "SELF"
                        ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    👤 Diri Sendiri
                  </button>
                </div>
              </div>

              {assignmentType === "SELF" ? (
                <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-2.5 flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-[11px] text-blue-950">
                    <div className="font-bold">{currentUser?.name || "Saya Sendiri"} (Pribadi)</div>
                    <div className="text-[10px] text-blue-700 leading-tight mt-0.5">
                      Tugas ini akan otomatis masuk ke menu <strong>Tugas Pribadi</strong> Anda dan dipajang di Card <strong>{departmentCard}</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <select
                      required
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none appearance-none bg-white font-medium"
                    >
                      <option value="" disabled>Pilih Rekan Tim...</option>
                      {currentUser && (
                        <option value={currentUser.id}>
                          👤 Saya Sendiri ({currentUser.name})
                        </option>
                      )}
                      {employees
                        .filter((emp) => !currentUser || emp.id !== currentUser.id)
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.department || "Karyawan"})
                          </option>
                        ))}
                    </select>
                    <User className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    💡 Contoh: Web Dev assign tugas ke Mas Danar (SEO) di Card SEO.
                  </p>
                </div>
              )}
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
