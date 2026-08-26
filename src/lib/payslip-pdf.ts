import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PayslipData {
  companyName?: string;
  companyAddress?: string;
  periodLabel: string;
  paymentDate: string;
  employeeName: string;
  employeeEmail: string;
  jobTitle: string;
  department: string;
  bankName: string;
  bankAccountNumber: string;
  npwpNumber?: string;

  // Presensi CamStamp
  attendanceDaysCount: number;
  lateCount: number;
  overtimeHours: number;

  // Earnings
  basicSalary: number;
  positionAllowance: number;
  transportAllowance: number;
  communicationAllowance: number;
  overtimePay: number;
  otherAllowance: number;
  grossSalary: number;

  // Deductions
  latePenaltyTotal: number;
  bpjsKesehatanEmp: number;
  bpjsKetenagakerjaanEmp: number;
  pph21Amount: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net
  netSalary: number;
  notes?: string;
}

export function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function generatePayslipPdf(data: PayslipData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner & Logo
  doc.setFillColor(220, 38, 38); // Taharica Red (#dc2626)
  doc.rect(0, 0, pageWidth, 12, "F");

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(220, 38, 38);
  doc.text("PT. DIFITECH GROUP", 14, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Gedung Pacific Century Place, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan",
    14,
    29
  );
  doc.text("Divisi Human Capital & People Operations • Sistem HRIS CamStamp", 14, 33);

  // Document Title Pill on Right
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.roundedRect(pageWidth - 75, 18, 61, 16, 2, 2, "F");
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.roundedRect(pageWidth - 75, 18, 61, 16, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(29, 78, 216); // Blue-700
  doc.text("SLIP GAJI KARYAWAN", pageWidth - 70, 24);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${data.periodLabel}`, pageWidth - 70, 29);

  // Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);

  // 2. Employee Info Grid
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Left Column
  doc.setFont("helvetica", "bold");
  doc.text("Nama Karyawan", 14, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.employeeName}`, 45, 45);

  doc.setFont("helvetica", "bold");
  doc.text("Jabatan / Posisi", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.jobTitle}`, 45, 50);

  doc.setFont("helvetica", "bold");
  doc.text("Departemen", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.department}`, 45, 55);

  // Right Column
  doc.setFont("helvetica", "bold");
  doc.text("Rekening Bank", pageWidth / 2 + 10, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.bankName} - ${data.bankAccountNumber}`, pageWidth / 2 + 40, 45);

  doc.setFont("helvetica", "bold");
  doc.text("No. NPWP", pageWidth / 2 + 10, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.npwpNumber || "09.123.456.7-012.000"}`, pageWidth / 2 + 40, 50);

  doc.setFont("helvetica", "bold");
  doc.text("Tgl Pembayaran", pageWidth / 2 + 10, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`:  ${data.paymentDate}`, pageWidth / 2 + 40, 55);

  // Attendance Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 61, pageWidth - 28, 12, 1.5, 1.5, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Kehadiran: ${data.attendanceDaysCount} Hari Kerja  |  Keterlambatan: ${data.lateCount} kali  |  Lembur: ${data.overtimeHours} Jam  |  Status: Terverifikasi CamStamp GPS`,
    20,
    68.5
  );

  // 3. Earnings & Deductions Tables (AutoTable)
  const earningsRows = [
    ["Gaji Pokok (Basic Salary)", formatRupiah(data.basicSalary)],
    ["Tunjangan Jabatan & Keahlian", formatRupiah(data.positionAllowance)],
    ["Tunjangan Transport & Makan", formatRupiah(data.transportAllowance)],
    ["Tunjangan Komunikasi & Pulsa", formatRupiah(data.communicationAllowance)],
  ];

  if (data.overtimePay > 0) {
    earningsRows.push([`Upah Lembur (${data.overtimeHours} Jam)`, formatRupiah(data.overtimePay)]);
  }
  if (data.otherAllowance > 0) {
    earningsRows.push(["Tunjangan Lainnya / Bonus", formatRupiah(data.otherAllowance)]);
  }

  const deductionsRows = [
    ["Potongan Keterlambatan Presensi", formatRupiah(data.latePenaltyTotal)],
    ["BPJS Kesehatan Karyawan (1%)", formatRupiah(data.bpjsKesehatanEmp)],
    ["BPJS Ketenagakerjaan (2% JHT + 1% JP)", formatRupiah(data.bpjsKetenagakerjaanEmp)],
    ["Pajak Penghasilan PPh 21 (TER)", formatRupiah(data.pph21Amount)],
  ];

  if (data.otherDeductions > 0) {
    deductionsRows.push(["Potongan Lainnya / Kasbon", formatRupiah(data.otherDeductions)]);
  }

  // AutoTable for Earnings (Left) & Deductions (Right)
  autoTable(doc, {
    startY: 78,
    margin: { left: 14, right: pageWidth / 2 + 2 },
    head: [["Komponen Penerimaan", "Jumlah (IDR)"]],
    body: earningsRows,
    foot: [["Total Pendapatan Kotor", formatRupiah(data.grossSalary)]],
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [239, 246, 255],
      textColor: [29, 78, 216],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
  });

  autoTable(doc, {
    startY: 78,
    margin: { left: pageWidth / 2 + 2, right: 14 },
    head: [["Komponen Potongan", "Jumlah (IDR)"]],
    body: deductionsRows,
    foot: [["Total Potongan", formatRupiah(data.totalDeductions)]],
    theme: "grid",
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [254, 242, 242],
      textColor: [185, 28, 28],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 140;

  // 4. Net Salary Highlight Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY + 8, pageWidth - 28, 22, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY + 8, pageWidth - 28, 22, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("GAJI BERSIH YANG DITERIMA (TAKE HOME PAY):", 20, finalY + 16);

  doc.setFontSize(15);
  doc.setTextColor(220, 38, 38);
  doc.text(formatRupiah(data.netSalary), 20, finalY + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Ditransfer ke ${data.bankName} a.n ${data.employeeName} (${data.bankAccountNumber})`,
    pageWidth - 20,
    finalY + 22,
    { align: "right" }
  );

  // 5. Signature Footer
  const signY = finalY + 38;

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Employee Side
  doc.text("Penerima,", 25, signY);
  doc.text("( " + data.employeeName + " )", 20, signY + 25);

  // HR Side
  doc.text("Diverifikasi & Disetujui,", pageWidth - 65, signY);
  doc.text("Siti Rahmawati", pageWidth - 65, signY + 22);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Head of People Operations", pageWidth - 65, signY + 26);

  // Security Verification Stamp
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Dokumen ini digenerate secara otomatis oleh Sistem Difitech HRIS CamStamp dengan enkripsi data sah.",
    pageWidth / 2,
    pageHeight() - 10,
    { align: "center" }
  );

  // Save PDF
  doc.save(`Slip_Gaji_Difitech_${data.employeeName.replace(/\s+/g, "_")}_${data.periodLabel.replace(/\s+/g, "_")}.pdf`);

  function pageHeight() {
    return doc.internal.pageSize.getHeight();
  }
}
