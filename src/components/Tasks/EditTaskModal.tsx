"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  Layers,
  AlertCircle,
  CheckCircle2,
  Users,
  Check,
  Pencil,
  Loader2,
  Sparkles,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { canAccessBoard } from "@/lib/executive-boards";

interface Employee {
  id: string;
  name: string;
  department: string | null;
  role: string;
  jobTitle?: string | null;
  avatarUrl: string | null;
}

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

const formatIsoToDateTimeLocal = (isoString?: string | null): string => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
};

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: any) => void;
  task: any;
  currentUser: any;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
  currentUser,
}: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentCard, setDepartmentCard] = useState("WEB");
  const [brandName, setBrandName] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState(2.0);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Inisialisasi data task ke form state saat modal dibuka
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDepartmentCard((task.departmentCard || task.category || "WEB").toUpperCase());
      setBrandName(task.brandName || "");

      const initialAssignees: string[] = [];
      if (Array.isArray(task.assignees) && task.assignees.length > 0) {
        task.assignees.forEach((a: any) => {
          const uid = a.userId || a.user?.id;
          if (uid && !initialAssignees.includes(uid)) initialAssignees.push(uid);
        });
      }
      if (task.userId && !initialAssignees.includes(task.userId)) {
        initialAssignees.unshift(task.userId);
      }
      setSelectedAssigneeIds(initialAssignees.length > 0 ? initialAssignees : currentUser?.id ? [currentUser.id] : []);

      setExpectedDeadline(formatIsoToDateTimeLocal(task.expectedDeadline || task.suggestedDeadline || task.targetDate));
      setPriority(task.priority || "MEDIUM");
      setEstimatedHours(task.estimatedHours ? Number(task.estimatedHours) : 2.0);
      setErrorMsg("");
      fetchMetadata();
    }
  }, [task, isOpen, currentUser]);

  const fetchMetadata = async () => {
    try {
      setIsLoadingMetadata(true);
      const res = await fetch("/api/workspace/metadata");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setBrands(data.brands || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspace metadata:", err);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const setAsPic = (id: string) => {
    setSelectedAssigneeIds((prev) => {
      const remaining = prev.filter((x) => x !== id);
      return [id, ...remaining];
    });
  };

  const toggleAssignee = (id: string) => {
    if (selectedAssigneeIds.includes(id)) {
      if (selectedAssigneeIds.length > 1) {
        setSelectedAssigneeIds(selectedAssigneeIds.filter((x) => x !== id));
      } else {
        setErrorMsg("Tugas harus memiliki minimal 1 pengerja (Assignee).");
      }
    } else {
      setSelectedAssigneeIds([...selectedAssigneeIds, id]);
      setErrorMsg("");
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!assigneeSearch.trim()) return employees;
    const q = assigneeSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.jobTitle && e.jobTitle.toLowerCase().includes(q))
    );
  }, [employees, assigneeSearch]);

  const availableDepartments = useMemo(() => {
    return ALL_DEPARTMENTS.filter((d) => canAccessBoard(d.key, currentUser));
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Judul tugas wajib diisi.");
      return;
    }
    if (!brandName.trim()) {
      setErrorMsg("Nama Brand / Klien wajib diisi.");
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      setErrorMsg("Pilih minimal satu penerima tugas (Assignee).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/workspace/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTaskEdit: true,
          title: title.trim(),
          description: description ? description.trim() : null,
          departmentCard: departmentCard.toUpperCase(),
          brandName: brandName.trim(),
          assigneeIds: selectedAssigneeIds,
          expectedDeadline: expectedDeadline || null,
          priority,
          estimatedHours,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui rincian tugas.");
      }

      onSuccess(data.task || { ...task, title, description, departmentCard, brandName, priority, estimatedHours });
      onClose();
    } catch (err: any) {
      console.error("Edit task error:", err);
      setErrorMsg(err.message || "Terjadi kendala saat menyimpan perubahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-red-50/60 via-white to-blue-50/30 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Edit Rincian Tugas
              </h3>
              <p className="text-[11px] text-slate-500">
                Perbarui tag karyawan pengerja, batas waktu, brand, atau deskripsi pengerjaan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-800">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          {/* 1. Multi-Assignee Tagging Section (Focus of Muditha & Ashabil case) */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-blue-900">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Pengerja Tugas & Tag Rekan Kerja</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                {selectedAssigneeIds.length} Orang Terpilih
              </span>
            </div>

            {/* Selected Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
              {selectedAssigneeIds.map((uid, index) => {
                const emp = employees.find((e) => e.id === uid) || (currentUser?.id === uid ? currentUser : null);
                const isPic = index === 0;
                return (
                  <div
                    key={uid}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs transition ${
                      isPic
                        ? "border-blue-300 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span>{emp?.name || (uid === currentUser?.id ? "Anda" : "Karyawan")}</span>
                    {isPic ? (
                      <span className="rounded-md bg-blue-800/60 px-1 py-0.2 text-[9px] uppercase tracking-wider">
                        PIC Utama
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsPic(uid)}
                        className="text-[9px] underline text-blue-600 hover:text-blue-800 font-normal cursor-pointer"
                        title="Jadikan sebagai PIC Utama tugas ini"
                      >
                        Jadikan PIC
                      </button>
                    )}
                    {selectedAssigneeIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => toggleAssignee(uid)}
                        className="rounded-full p-0.5 hover:bg-black/10 transition cursor-pointer"
                        title="Hapus tag karyawan ini"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Search Input for Employees */}
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama karyawan untuk mencari dan menambahkan tag..."
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Employees Quick Select Grid */}
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 divide-y divide-slate-100 shadow-inner">
              {isLoadingMetadata ? (
                <div className="flex items-center justify-center p-4 text-slate-400 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Memuat daftar karyawan...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-3 text-center text-slate-400 text-xs italic">
                  Tidak ada karyawan yang cocok dengan pencarian "{assigneeSearch}".
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedAssigneeIds.includes(emp.id);
                  const isPic = selectedAssigneeIds[0] === emp.id;
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleAssignee(emp.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700 text-xs flex-shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            {emp.id === currentUser?.id && (
                              <span className="text-[10px] text-slate-400 font-normal">(Anda)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {emp.department || "Umum"} {emp.jobTitle ? `• ${emp.jobTitle}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPic && (
                          <span className="text-[9px] font-bold uppercase bg-blue-600 text-white rounded px-1.5 py-0.5">
                            PIC
                          </span>
                        )}
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-slate-500 italic">
              💡 Rekan kerja yang baru ditambahkan akan langsung menerima notifikasi in-app & WhatsApp.
            </p>
          </div>

          {/* 2. Judul Tugas */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Optimasi Landing Page, Desain Feed Promo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
            />
          </div>

          {/* 3. Deskripsi Tugas (Rich Text) */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Catatan / Instruksi Pengerjaan (Deskripsi)
            </label>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <RichTextEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Tuliskan detail instruksi tugas, referensi, atau tautan penting..."
              />
            </div>
          </div>

          {/* 4. Grid Metadata (Divisi, Brand, Deadline, Prioritas, Jam) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Divisi / Card Tujuan */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                Divisi / Card Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentCard}
                onChange={(e) => setDepartmentCard(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
              >
                {availableDepartments.map((d) => (
                  <option key={d.key} value={d.key}>
                    Card {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand / Klien */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                Brand / Klien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="brands-list-edit"
                placeholder="Contoh: Difitech, WKM, Zamrud..."
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
              />
              <datalist id="brands-list-edit">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Batas Waktu (Deadline) */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                Batas Waktu (Target Deadline)
              </label>
              <input
                type="datetime-local"
                value={expectedDeadline}
                onChange={(e) => setExpectedDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none font-mono"
              />
            </div>

            {/* Prioritas & Estimasi */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-red-500 focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent 🔥</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                  Estimasi (Jam)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition active:scale-[0.98] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-red-600/20 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
