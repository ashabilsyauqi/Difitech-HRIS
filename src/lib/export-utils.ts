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
  OvertimeDuration?: string;
  TotalTasks: number;
  CompletedTasks: number;
  [key: string]: any;
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
  "Waktu Aktual (Jam)"?: string;
  "Link Deliverables (Drive)": string;
  "Bukti Screenshot": string;
  "Catatan Selesai": string;
}

/**
 * Generates and triggers download of Excel (.xlsx) file from tasks dataset.
 * Supports exporting single employee (single sheet) or all employees (master sheet + separate sheet per employee).
/**
 * Sanitizes cell text to comply with Excel's 32,767 character limit and strip embedded base64/HTML.
 */
export function cleanTextForExcel(val: any, maxLength = 32000): string {
  if (val === null || val === undefined) return "-";
  let str = String(val);
  // Replace huge base64 images inside HTML with placeholder
  str = str.replace(/<img[^>]*>/gi, "[Gambar/Screenshot]");
  // Replace HTML entities
  str = str
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  // Strip HTML tags and normalize whitespace
  str = str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!str) return "-";
  if (str.length > maxLength) {
    return str.slice(0, maxLength - 20) + " ... (terpotong)";
  }
  return str;
}

/**
 * Triggers browser download of an XLSX workbook via Blob and object URL.
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  try {
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    if (typeof window !== "undefined") {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 200);
      return;
    }
  } catch (blobErr) {
    console.warn("Blob download failed, falling back to XLSX.writeFile:", blobErr);
  }

  // Fallback
  XLSX.writeFile(workbook, filename);
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
  if (!data || data.length === 0) {
    if (typeof window !== "undefined") {
      alert("Tidak ada data tugas untuk diekspor ke Excel.");
    }
    return;
  }

  try {
    // Sanitize every row cell to prevent Excel 32,767 char overflow
    const sanitizedData = data.map((row) => {
      const cleanRow: any = {};
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === "string") {
          cleanRow[key] = cleanTextForExcel(val);
        } else {
          cleanRow[key] = val ?? "-";
        }
      }
      return cleanRow as TaskExportRow;
    });

    const workbook = XLSX.utils.book_new();

    const colWidths = Object.keys(sanitizedData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 4, 18),
    }));

    // Identify unique employees
    const employeeNames = Array.from(new Set(sanitizedData.map((r) => r["Nama Karyawan"] || "Karyawan")));

    if (employeeNames.length === 1) {
      // Single employee export: 1 sheet named with employee's name
      const rawName = employeeNames[0] || "Karyawan";
      const empName = rawName.replace(/[:\\/?*\[\]]/g, "").trim().slice(0, 31) || "Karyawan";
      const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
      worksheet["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(workbook, worksheet, `Tugas ${empName}`.slice(0, 31));
    } else {
      // Multiple employees (ALL) export:
      // 1. Master sheet with all tasks
      const masterWorksheet = XLSX.utils.json_to_sheet(sanitizedData);
      masterWorksheet["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(workbook, masterWorksheet, "Semua Karyawan (ALL)");

      // 2. Individual sheet per employee with collision prevention
      if (groupedByEmployee) {
        const usedSheetNames = new Set<string>(["Semua Karyawan (ALL)"]);
        for (const empName of employeeNames) {
          const empRows = sanitizedData.filter((r) => r["Nama Karyawan"] === empName);
          let sanitizedName = (empName || "Lainnya").replace(/[:\\/?*\[\]]/g, "").trim().slice(0, 31);
          if (!sanitizedName) sanitizedName = "Karyawan";

          let finalSheetName = sanitizedName;
          let counter = 1;
          while (usedSheetNames.has(finalSheetName)) {
            finalSheetName = `${sanitizedName.slice(0, 27)} (${counter++})`;
          }
          usedSheetNames.add(finalSheetName);

          const empWorksheet = XLSX.utils.json_to_sheet(empRows);
          empWorksheet["!cols"] = colWidths;
          XLSX.utils.book_append_sheet(workbook, empWorksheet, finalSheetName);
        }
      }
    }

    downloadWorkbook(workbook, filename);
  } catch (err: any) {
    console.error("Export tasks to Excel error:", err);
    if (typeof window !== "undefined") {
      alert("Gagal memproses file Excel: " + (err?.message || "Terjadi kendala data."));
    }
  }
}

/**
 * Generates and triggers download of Excel (.xlsx) file from attendance dataset
 */
export function exportAttendanceToExcel(data: Record<string, any>[], filename = "HRIS_Attendance_Report.xlsx") {
  if (!data || data.length === 0) {
    if (typeof window !== "undefined") {
      alert("Tidak ada data presensi untuk diekspor ke Excel.");
    }
    return;
  }

  try {
    const sanitizedData = data.map((row) => {
      const cleanRow: any = {};
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === "string") {
          cleanRow[key] = cleanTextForExcel(val);
        } else {
          cleanRow[key] = val ?? "-";
        }
      }
      return cleanRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");

    const colWidths = Object.keys(sanitizedData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 4, 15),
    }));
    worksheet["!cols"] = colWidths;

    downloadWorkbook(workbook, filename);
  } catch (err: any) {
    console.error("Export attendance error:", err);
  }
}

/**
 * Generates and triggers download of PDF Attendance & Task Summary
 */
export function exportAttendanceToPdf(
  data: AttendanceExportRow[],
  meta: { dateRangeStr?: string; title?: string } = {}
) {
  if (!data || data.length === 0) {
    if (typeof window !== "undefined") {
      alert("Tidak ada data presensi untuk diekspor ke PDF.");
    }
    return;
  }

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
      "Overtime",
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
    row.OvertimeDuration || (row as any).Lembur || "-",
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
