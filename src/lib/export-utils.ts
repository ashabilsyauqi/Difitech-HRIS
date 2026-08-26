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
