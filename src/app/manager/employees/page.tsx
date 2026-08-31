"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Mail,
  CreditCard,
  X,
  UserCheck,
  UserPlus,
  Briefcase,
  Layers,
  Settings,
} from "lucide-react";
import Link from "next/link";

export default function ManagerEmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Add / Edit Employee Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("EMPLOYEE");
  const [department, setDepartment] = useState("Engineering & Teknologi");
  const [jobTitle, setJobTitle] = useState("Software Engineer");
  const [employmentStatus, setEmploymentStatus] = useState("FULL_TIME");
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [npwpNumber, setNpwpNumber] = useState("");
  const [basicSalary, setBasicSalary] = useState(8000000);
  const [positionAllowance, setPositionAllowance] = useState(1500000);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Department Management Modal
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  const fetchEmployeesAndDepts = async () => {
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

      const [empRes, deptRes] = await Promise.all([
        fetch("/api/manager/employees"),
        fetch("/api/manager/departments"),
      ]);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);
      }

      if (deptRes.ok) {
        const dData = await deptRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndDepts();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedEmpId(null);
    setName("");
    setEmail("");
    setPassword("password123");
    setRole("EMPLOYEE");
    setDepartment(departments[0]?.name || "Engineering & Teknologi");
    setJobTitle("Software Engineer");
    setEmploymentStatus("FULL_TIME");
    setBankName("BCA");
    setBankAccountNumber("8012345678");
    setNpwpNumber("09.123.456.7-000.000");
    setBasicSalary(8000000);
    setPositionAllowance(1500000);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setIsEditing(true);
    setSelectedEmpId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPassword("");
    setRole(emp.role);
    setDepartment(emp.department || (departments[0]?.name || "Engineering & Teknologi"));
    setJobTitle(emp.jobTitle || "Karyawan");
    setEmploymentStatus(emp.employmentStatus || "FULL_TIME");
    setBankName(emp.bankName || "BCA");
    setBankAccountNumber(emp.bankAccountNumber || "");
    setNpwpNumber(emp.npwpNumber || "");
    setBasicSalary(emp.salaryProfile?.basicSalary || 8000000);
    setPositionAllowance(emp.salaryProfile?.positionAllowance || 1500000);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      if (isEditing && selectedEmpId) {
        const res = await fetch(`/api/manager/employees/${selectedEmpId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            role,
            department,
            jobTitle,
            employmentStatus,
            password: password ? password : undefined,
            bankName,
            bankAccountNumber,
            npwpNumber,
            basicSalary,
            positionAllowance,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengubah data karyawan");
      } else {
        const res = await fetch("/api/manager/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            department,
            jobTitle,
            employmentStatus,
            bankName,
            bankAccountNumber,
            npwpNumber,
            basicSalary,
            positionAllowance,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal menambahkan karyawan baru");
      }

      setModalOpen(false);
      await fetchEmployeesAndDepts();
      setFeedbackMsg({ type: "success", text: isEditing ? "Data karyawan berhasil diperbarui!" : "Karyawan baru berhasil ditambahkan!" });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data karyawan: ${empName}?`)) return;
    try {
      const res = await fetch(`/api/manager/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus karyawan");

      await fetchEmployeesAndDepts();
      setFeedbackMsg({ type: "success", text: `Karyawan ${empName} berhasil dihapus.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsAddingDept(true);
    try {
      const res = await fetch("/api/manager/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim() || undefined,
          description: newDeptDesc.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah divisi");
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptDesc("");
      await fetchEmployeesAndDepts();
      alert("Divisi baru berhasil ditambahkan!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingDept(false);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Hapus divisi "${name}"? Karyawan pada divisi ini akan dipindahkan ke "Umum / General".`)) return;
    try {
      const res = await fetch(`/api/manager/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus divisi");
      await fetchEmployeesAndDepts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-semibold">Memuat Manajemen Karyawan & Divisi...</p>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === "ALL" || emp.department === selectedDept;
    const matchesRole = selectedRole === "ALL" || emp.role === selectedRole;
    const matchesStatus = selectedStatus === "ALL" || (emp.employmentStatus || "FULL_TIME") === selectedStatus;
    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/50 via-white to-blue-50/40 p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
                <Users className="h-4 w-4" />
                <span>Direktori & Manajemen SDM Difitech HRIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Manajemen Data Karyawan & Divisi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kelola data profil, divisi/departemen, peran akses (Admin, Manager, Karyawan), dan status kerja (Full Time, Part Time).
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDeptModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <Layers className="h-4 w-4 text-red-600" />
                <span>Kelola Divisi ({departments.length})</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Karyawan</span>
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
                feedbackMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email, atau jabatan karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Status Karyawan */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Status Kerja</option>
                <option value="FULL_TIME">💼 Full Time</option>
                <option value="PART_TIME">⏱️ Part Time</option>
                <option value="CONTRACT">📄 Kontrak</option>
                <option value="INTERNSHIP">🎓 Magang</option>
              </select>

              {/* Filter Divisi */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Divisi / Departemen</option>
                {departments.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
              </select>

              {/* Filter Role */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-red-500 focus:outline-none"
              >
                <option value="ALL">Semua Peran (Role)</option>
                <option value="ADMIN">🔴 Admin HR</option>
                <option value="MANAGER">🔵 Manager</option>
                <option value="EMPLOYEE">⚪ Karyawan</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Karyawan</th>
                    <th className="px-4 py-4">Peran (Role)</th>
                    <th className="px-4 py-4">Status Kerja</th>
                    <th className="px-4 py-4">Divisi / Departemen</th>
                    <th className="px-4 py-4">Jabatan</th>
                    <th className="px-4 py-4">Rekening Bank</th>
                    <th className="px-4 py-4">Aktivitas</th>
                    <th className="px-4 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEmployees.map((emp) => {
                    const status = emp.employmentStatus || "FULL_TIME";
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                              {emp.avatarUrl ? (
                                <img src={emp.avatarUrl} alt={emp.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold text-slate-600">
                                  {emp.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{emp.name}</p>
                              <p className="text-[11px] text-slate-500">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              emp.role === "ADMIN"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : emp.role === "MANAGER"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {emp.role === "ADMIN" ? "Admin HR" : emp.role === "MANAGER" ? "Manager" : "Karyawan"}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              status === "FULL_TIME"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : status === "PART_TIME"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : status === "CONTRACT"
                                ? "bg-purple-50 text-purple-800 border border-purple-200"
                                : "bg-cyan-50 text-cyan-800 border border-cyan-200"
                            }`}
                          >
                            {status === "FULL_TIME"
                              ? "Full Time"
                              : status === "PART_TIME"
                              ? "Part Time"
                              : status === "CONTRACT"
                              ? "Kontrak"
                              : "Magang"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-slate-800 font-semibold whitespace-nowrap">
                          {emp.department || "Umum"}
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          {emp.jobTitle || "Karyawan"}
                        </td>

                        <td className="px-4 py-4 font-mono text-slate-700 whitespace-nowrap">
                          <span className="font-bold text-slate-900">{emp.bankName || "BCA"}</span> - {emp.bankAccountNumber || "-"}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {emp._count?.attendances || 0} presensi • {emp._count?.tasks || 0} tugas
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                              title="Edit Data Karyawan"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {user.role === "ADMIN" && emp.id !== user.id && (
                              <button
                                onClick={() => handleDelete(emp.id, emp.name)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Add / Edit Employee */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {isEditing ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
                  </h4>
                  <p className="text-xs text-slate-500">PT. Difitech Group • Pengaturan Role & Divisi</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Wijaya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="contoh: wijaya@difitech.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role, Divisi, dan Status Karyawan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran Akses (Role) *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 font-semibold focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="EMPLOYEE">⚪ Karyawan</option>
                    <option value="MANAGER">🔵 Manager</option>
                    <option value="ADMIN">🔴 Admin HR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Karyawan *</label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 font-semibold focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="FULL_TIME">💼 Full Time</option>
                    <option value="PART_TIME">⏱️ Part Time</option>
                    <option value="CONTRACT">📄 Kontrak</option>
                    <option value="INTERNSHIP">🎓 Magang</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi / Departemen *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 font-semibold focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan (Job Title) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: HR Administrator"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isEditing ? "Ganti Password (Opsional)" : "Password Akun *"}
                  </label>
                  <input
                    type="password"
                    placeholder={isEditing ? "•••••••• (Biarkan kosong jika tidak ganti)" : "Default: password123"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kompensasi & Rekening Bank */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span>Kompensasi Awal & Rekening Bank</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Gaji Pokok (IDR)</label>
                    <input
                      type="number"
                      step="100000"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tunjangan Jabatan (IDR)</label>
                    <input
                      type="number"
                      step="100000"
                      value={positionAllowance}
                      onChange={(e) => setPositionAllowance(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Bank</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none"
                    >
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">No. Rekening</label>
                    <input
                      type="text"
                      placeholder="8012345678"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">No. NPWP</label>
                    <input
                      type="text"
                      placeholder="09.123.456.7-000.000"
                      value={npwpNumber}
                      onChange={(e) => setNpwpNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-slate-900 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/25 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Divisi & Departemen */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Kelola Divisi & Departemen</h4>
                  <p className="text-xs text-slate-500">Tambah atau atur divisi perusahaan</p>
                </div>
              </div>
              <button onClick={() => setDeptModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Tambah Divisi Baru */}
            <form onSubmit={handleAddDepartment} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-red-600" />
                <span>Tambah Divisi Baru</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Divisi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Digital Marketing"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kode Singkat</label>
                  <input
                    type="text"
                    placeholder="MKT"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 uppercase text-slate-900 font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Deskripsi Divisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Tim Pemasaran & Strategi Branding"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  disabled={isAddingDept || !newDeptName.trim()}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isAddingDept ? "Menambahkan..." : "+ Tambah Divisi"}
                </button>
              </div>
            </form>

            {/* List Existing Departments */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs">Daftar Divisi Saat Ini ({departments.length})</h5>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {departments.map((dept) => (
                  <div key={dept.id || dept.name} className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{dept.name}</span>
                        {dept.code && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                            {dept.code}
                          </span>
                        )}
                      </div>
                      {dept.description && <p className="text-[11px] text-slate-500 mt-0.5">{dept.description}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-100">
                        {dept.employeeCount || 0} Karyawan
                      </span>
                      {user.role === "ADMIN" && (
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                          className="rounded p-1 text-slate-400 hover:text-red-600 transition"
                          title="Hapus Divisi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setDeptModalOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
