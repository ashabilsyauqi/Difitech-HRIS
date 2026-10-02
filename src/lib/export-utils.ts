import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AttendanceExportRow {
  EmployeeName: string;
  Email: string;
  Department: string;
  Date: string;
  ClockInTime: string;
  ClockInStatus: string;
  ClockInDistance: string;
  ClockOutTime: string;
  WorkDuration: string;
  TotalTasks: number;
  CompletedTasks: number;
}

export interface TaskExportRow {
  "Tanggal": string;
  "Nama Karyawan": string;
  "Email": string;
  "Departemen": string;
  "Kategori / Brand": string;
  "Judul Tugas": string;
  "Deskripsi": string;
  "Status": string;
  "Prioritas": string;
  "Estimasi (Jam)": number;
  "Waktu Aktual (Jam)": string;
  "Link Deliverables (Drive)": string;
  "Bukti Screenshot": string;
  "Catatan Selesai": string;
}

/**
 * Generates and triggers download of Excel (.xlsx) file from tasks dataset.
 * Supports exporting single employee (single sheet) or all employees (master sheet + separate sheet per employee).
 */
export function exportTasksToExcel(
  data: TaskExportRow[],
  filename = "Laporan_Tugas_Difitech.xlsx",
  groupedByEmployee: boolean = true
) {
  if (!data || data.length === 0) return;
  const workbook = XLSX.utils.book_new();

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 18),
  }));

  // Identify unique employees
  const employeeNames = Array.from(new Set(data.map((r) => r["Nama Karyawan"] || "Karyawan")));

  if (employeeNames.length === 1) {
    // Single employee export: 1 sheet named with employee's name
    const empName = (employeeNames[0] || "Karyawan").replace(/[:\\/?*\[\]]/g, "").slice(0, 31);
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, `Tugas ${empName}`);
  } else {
    // Multiple employees (ALL) export:
    // 1. Master sheet with all tasks
    const masterWorksheet = XLSX.utils.json_to_sheet(data);
    masterWorksheet["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(workbook, masterWorksheet, "Semua Karyawan (ALL)");

    // 2. Individual sheet per employee
    if (groupedByEmployee) {
      for (const empName of employeeNames) {
        const empRows = data.filter((r) => r["Nama Karyawan"] === empName);
        const sanitizedName = (empName || "Lainnya").replace(/[:\\/?*\[\]]/g, "").slice(0, 31);
        const empWorksheet = XLSX.utils.json_to_sheet(empRows);
        empWorksheet["!cols"] = colWidths;
        XLSX.utils.book_append_sheet(workbook, empWorksheet, sanitizedName);
      }
    }
  }

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and triggers download of Excel (.xlsx) file from attendance dataset
 */
export function exportAttendanceToExcel(data: AttendanceExportRow[], filename = "HRIS_Attendance_Report.xlsx") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 15),
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and triggers download of PDF Attendance & Task Summary
 */
export function exportAttendanceToPdf(
  data: AttendanceExportRow[],
  meta: { dateRangeStr?: string; title?: string } = {}
) {
  const doc = new jsPDF("landscape");

  // Title & Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(meta.title || "HRIS ATTENDANCE & PRODUCTIVITY REPORT", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleString()} | CamStamp Verified Logs`, 14, 21);

  // Table
  const tableHead = [
    [
      "Employee",
      "Dept",
      "Date",
      "Clock In",
      "In Status",
      "Office Dist",
      "Clock Out",
      "Work Time",
      "Tasks (Done/Total)",
    ],
  ];

  const tableBody = data.map((row) => [
    row.EmployeeName,
    row.Department,
    row.Date,
    row.ClockInTime,
    row.ClockInStatus,
    row.ClockInDistance,
    row.ClockOutTime,
    row.WorkDuration,
    `${row.CompletedTasks} / ${row.TotalTasks}`,
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 30,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 3,
    },
  });

  doc.save("HRIS_Attendance_Summary.pdf");
}
