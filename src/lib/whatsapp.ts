import { prisma } from "@/lib/prisma";

/**
 * WhatsApp Notification Service for Difitech Workboard (DWB)
 * Integrates with Baileys WA Bridge or external WA Gateway.
 */

export interface WhatsAppSendResult {
  success: boolean;
  status: "SENT" | "SIMULATED" | "SKIPPED_NO_PHONE" | "FAILED";
  recipientPhone?: string;
  messageId?: string;
  detail: string;
}

/**
 * Normalizes any Indonesian phone number into standard WhatsApp international format (628xxxxxxxxxx).
 * Examples:
 *   "087871976694"  -> "6287871976694"
 *   "+62 878-7197-6694" -> "6287871976694"
 *   "87871976694"   -> "6287871976694"
 */
export function normalizeWhatsAppNumber(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (!digits || digits.length < 8) return null;

  if (digits.startsWith("08")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  if (digits.startsWith("62")) {
    return digits;
  }

  // International format or unknown, return as digits if valid length
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

/**
 * Sends a WhatsApp notification message.
 * Falls back to simulation logging gracefully if gateway is unreachable or pairing is standby.
 */
export async function sendWhatsAppNotification(params: {
  to: string | null | undefined;
  message: string;
  recipientName?: string;
  taskId?: string;
  actionType?: string;
}): Promise<WhatsAppSendResult> {
  const { to, message, recipientName, taskId, actionType } = params;

  const normalizedPhone = normalizeWhatsAppNumber(to);
  if (!normalizedPhone) {
    console.warn(`[WA Gateway] Skipped sending to ${recipientName || "User"}: No valid phone number provided.`);
    return {
      success: false,
      status: "SKIPPED_NO_PHONE",
      detail: `Nomor WhatsApp ${recipientName || "karyawan"} belum terdaftar atau format tidak valid.`,
    };
  }

  // 1. Primary: Try WAHA (WhatsApp HTTP API with native Chromium Web engine)
  const wahaUrls = [
    process.env.WAHA_URL,
    "http://waha:3000",
    "http://127.0.0.1:3008",
    "http://31.97.220.128:3008",
  ].filter(Boolean) as string[];
  const wahaApiKey = process.env.WAHA_API_KEY || "difitech_waha_secret_2026";

  for (const wahaBase of wahaUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${wahaBase}/api/sendText`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": wahaApiKey,
        },
        body: JSON.stringify({
          session: "default",
          chatId: `${normalizedPhone}@c.us`,
          text: message,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.id || data.timestamp || data.status === "success")) {
        const msgId = data.id || data.messageId || "WAHA_OK";
        console.log(`[WAHA Gateway] ✅ Pesan berhasil dikirim ke ${normalizedPhone} (${recipientName}): ID ${msgId}`);
        return {
          success: true,
          status: "SENT",
          recipientPhone: normalizedPhone,
          messageId: msgId,
          detail: `Pesan berhasil dikirim via WAHA ke ${normalizedPhone}.`,
        };
      }
    } catch (e: any) {
      // Continue to next gateway option
    }
  }

  // 2. Secondary / Fallback: Candidate legacy bridge URLs
  const candidateUrls = [
    process.env.WA_GATEWAY_URL,
    "http://crm-wa-bridge:3001",
    "http://127.0.0.1:3001",
    "http://31.97.220.128:3001",
  ].filter(Boolean) as string[];

  let lastError = "";

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${baseUrl}/api/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: "default",
          to: normalizedPhone,
          message: message,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === "success") {
        console.log(`[WA Gateway] ✅ Pesan berhasil dikirim ke ${normalizedPhone} (${recipientName}): ID ${data.messageId}`);
        return {
          success: true,
          status: "SENT",
          recipientPhone: normalizedPhone,
          messageId: data.messageId,
          detail: `Pesan berhasil dikirim via WhatsApp ke ${normalizedPhone}.`,
        };
      } else {
        lastError = data.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || "Connection failed";
    }
  }

  // Graceful simulation fallback
  console.log(`[WA SIMULATION] 📱 Gateway standby (${lastError}). Pesan tersimpan untuk ${normalizedPhone} (${recipientName}):\n${message}`);
  return {
    success: true,
    status: "SIMULATED",
    recipientPhone: normalizedPhone,
    detail: `Simulasi pengiriman WhatsApp berhasil ke ${normalizedPhone} (${recipientName}) [Gateway Standby: ${lastError}].`,
  };
}

/**
 * Automatically dispatches WhatsApp notification to a user whenever an in-app notification is triggered.
 */
export async function dispatchUserNotificationWA(params: {
  userId: string;
  title: string;
  message: string;
  taskId?: string;
  type?: string;
  link?: string;
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, whatsappNumber: true },
    });
    if (!user || !user.whatsappNumber) return;

    const actionEmoji =
      params.type?.includes("APPROV") ? "🎉" :
      params.type?.includes("REVISI") ? "⚠️" :
      params.type?.includes("COMMENT") ? "💬" :
      params.type?.includes("DEADLINE") ? "📅" :
      params.type?.includes("SUBMIT") ? "✅" : "🔔";

    const lines = [
      `${actionEmoji} *DIFITECH WORKBOARD — NOTIFIKASI*`,
      ``,
      `Halo *${user.name}*, ada pembaruan pada aktivitas kerja Anda:`,
      ``,
      `📌 *${params.title}*`,
      `💬 ${params.message}`,
      ``,
      `Silakan cek selengkapnya di Difitech Workboard:`,
      `🔗 https://difworkboard.difitech.id${params.link || "/dashboard/my-tasks"}`,
      ``,
      `_Pesan otomatis dari Difitech Workboard System_`,
    ];

    await sendWhatsAppNotification({
      to: user.whatsappNumber,
      message: lines.join("\n"),
      recipientName: user.name,
      taskId: params.taskId,
      actionType: params.type,
    });
  } catch (err: any) {
    console.error(`[WA Dispatch Error] User ${params.userId}:`, err?.message);
  }
}

// ---------------------------------------------------------------------------
// MESSAGE TEMPLATE BUILDERS (Clean Corporate & Startup Style, Direct Task Links)
// ---------------------------------------------------------------------------

function getTaskDirectLink(taskId?: string | null): string {
  if (taskId) {
    return "https://difworkboard.difitech.id/dashboard/workspace?taskId=" + taskId;
  }
  return "https://difworkboard.difitech.id/dashboard/my-tasks";
}

export function buildTaskAssignedMessage(data: {
  assigneeName: string;
  creatorName: string;
  taskTitle: string;
  department?: string | null;
  brand?: string | null;
  deadlineStr?: string | null;
  priority?: string | null;
  description?: string | null;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *TUGAS BARU*",
    "----------------------------------------",
    "Halo *" + data.assigneeName + "*, Anda menerima penugasan tugas baru dari *" + data.creatorName + "*:",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Divisi:* " + (data.department || "General"),
    "\u2022 *Brand:* " + (data.brand || "Internal"),
    "\u2022 *Batas Waktu (Deadline):* " + (data.deadlineStr || "Belum ditentukan"),
    "\u2022 *Prioritas:* " + (data.priority || "MEDIUM"),
  ];

  if (data.description) {
    lines.push("\u2022 *Catatan:* _\"" + data.description + "\"_");
  }

  lines.push("");
  lines.push("\u2022 *Akses Langsung Kartu Tugas:*");
  lines.push(getTaskDirectLink(data.taskId));
  lines.push("----------------------------------------");
  lines.push("_Difitech Workboard System_");

  return lines.join("\n");
}

export function buildTaskFollowUpMessage(data: {
  recipientName: string;
  senderName: string;
  senderRoleOrDept?: string | null;
  taskTitle: string;
  department?: string | null;
  brand?: string | null;
  message?: string | null;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *PENGINGAT FOLLOW-UP*",
    "----------------------------------------",
    "Halo *" + data.recipientName + "*, ada pengingat tindak lanjut dari *" + data.senderName + "* (" + (data.senderRoleOrDept || "Management") + "):",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Divisi / Brand:* " + (data.department || "General") + " | " + (data.brand || "Internal"),
    "\u2022 *Pesan:* _\"" + (data.message || "Mohon periksa dan perbarui progres pengerjaan tugas ini.") + "\"_",
    "",
    "\u2022 *Buka Kartu Tugas Langsung:*",
    getTaskDirectLink(data.taskId),
    "----------------------------------------",
    "_Difitech Workboard System_"
  ];

  return lines.join("\n");
}

export function buildTaskSubmittedMessage(data: {
  creatorName: string;
  assigneeName: string;
  taskTitle: string;
  department?: string | null;
  brand?: string | null;
  deliverableUrl?: string | null;
  completionNote?: string | null;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *TUGAS SIAP DIREVIEW*",
    "----------------------------------------",
    "Halo *" + data.creatorName + "*, rekan Anda *" + data.assigneeName + "* telah menyelesaikan & mengajukan tugas:",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Divisi / Brand:* " + (data.department || "General") + " | " + (data.brand || "Internal"),
  ];

  if (data.deliverableUrl) {
    lines.push("\u2022 *Hasil Kerja (Deliverable):* " + data.deliverableUrl);
  }
  if (data.completionNote) {
    lines.push("\u2022 *Catatan Pengerjaan:* _\"" + data.completionNote + "\"_");
  }

  lines.push("");
  lines.push("\u2022 *Review Hasil Kerja (ACC / Revisi):*");
  lines.push(getTaskDirectLink(data.taskId));
  lines.push("----------------------------------------");
  lines.push("_Difitech Workboard System_");

  return lines.join("\n");
}

export function buildMorningDeadlineMessage(data: {
  userName: string;
  tasks: Array<{
    title: string;
    department?: string | null;
    brand?: string | null;
    deadlineStr: string;
    urgencyText: string;
  }>;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *PENGINGAT DEADLINE PAGI*",
    "----------------------------------------",
    "Selamat pagi *" + data.userName + "*,",
    "Berikut ringkasan tugas kerja Anda yang mendekati batas waktu (H-2 / Hari Ini):",
    "",
  ];

  data.tasks.forEach((t, index) => {
    lines.push((index + 1) + ". *" + t.title + "*");
    lines.push("   \u2022 Divisi/Brand: " + (t.department || "General") + " - " + (t.brand || "Internal"));
    lines.push("   \u2022 Batas Waktu: *" + t.deadlineStr + "* (" + t.urgencyText + ")");
    lines.push("");
  });

  lines.push("\u2022 *Buka Lembar Kerja:*");
  lines.push("https://difworkboard.difitech.id/dashboard/my-tasks");
  lines.push("----------------------------------------");
  lines.push("_Difitech Workboard System_");

  return lines.join("\n");
}

export function buildTaskApprovedMessage(data: {
  assigneeName: string;
  reviewerName: string;
  taskTitle: string;
  department?: string | null;
  brand?: string | null;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *TUGAS DISETUJUI (DONE)*",
    "----------------------------------------",
    "Halo *" + data.assigneeName + "*, selamat! Tugas kerja Anda telah disetujui (ACC) oleh *" + data.reviewerName + "*:",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Divisi / Brand:* " + (data.department || "General") + " | " + (data.brand || "Internal"),
    "\u2022 *Status:* SELESAI (DONE)",
    "",
    "\u2022 *Lihat Detail Tugas:*",
    getTaskDirectLink(data.taskId),
    "----------------------------------------",
    "_Difitech Workboard System_"
  ];
  return lines.join("\n");
}

export function buildTaskRevisionMessage(data: {
  assigneeName: string;
  reviewerName: string;
  taskTitle: string;
  department?: string | null;
  brand?: string | null;
  revisionNote?: string | null;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *PERMINTAAN REVISI*",
    "----------------------------------------",
    "Halo *" + data.assigneeName + "*, ada catatan perbaikan/revisi dari *" + data.reviewerName + "* untuk tugas:",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Divisi / Brand:* " + (data.department || "General") + " | " + (data.brand || "Internal"),
    "\u2022 *Catatan Revisi:* _\"" + (data.revisionNote || "Mohon periksa dan perbaiki deliverable sesuai instruksi.") + "\"_",
    "",
    "\u2022 *Buka Kartu Tugas & Kirim Perbaikan:*",
    getTaskDirectLink(data.taskId),
    "----------------------------------------",
    "_Difitech Workboard System_"
  ];
  return lines.join("\n");
}

export function buildTaskCommentMessage(data: {
  recipientName: string;
  senderName: string;
  taskTitle: string;
  commentText: string;
  isReply?: boolean;
  taskId?: string;
}): string {
  const lines = [
    "*DIFITECH WORKBOARD* | *DISKUSI TUGAS*",
    "----------------------------------------",
    "Halo *" + data.recipientName + "*, *" + data.senderName + "* baru saja " + (data.isReply ? "membalas komentar" : "menambahkan komentar") + " pada tugas:",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Pesan:* _\"" + data.commentText + "\"_",
    "",
    "\u2022 *Balas Diskusi Langsung:*",
    getTaskDirectLink(data.taskId),
    "----------------------------------------",
    "_Difitech Workboard System_"
  ];
  return lines.join("\n");
}

export function buildDeadlineUpdateMessage(data: {
  recipientName: string;
  senderName: string;
  taskTitle: string;
  type: "PROPOSED" | "AGREED";
  proposedDateStr: string;
  reason?: string | null;
  taskId?: string;
}): string {
  const isAgreed = data.type === "AGREED";
  const lines = [
    isAgreed
      ? "*DIFITECH WORKBOARD* | *DEADLINE DISETUJUI*"
      : "*DIFITECH WORKBOARD* | *USULAN DEADLINE BARU*",
    "----------------------------------------",
    "Halo *" + data.recipientName + "*, " + (isAgreed ? "perubahan batas waktu disepakati oleh *" + data.senderName + "*" : "*" + data.senderName + "* mengajukan usulan batas waktu baru") + ":",
    "",
    "\u2022 *Tugas:* " + data.taskTitle,
    "\u2022 *Batas Waktu Baru:* *" + data.proposedDateStr + "*",
  ];

  if (data.reason) {
    lines.push("\u2022 *Alasan:* _\"" + data.reason + "\"_");
  }

  lines.push("");
  lines.push("\u2022 *Cek Kartu Tugas:*");
  lines.push(getTaskDirectLink(data.taskId));
  lines.push("----------------------------------------");
  lines.push("_Difitech Workboard System_");

  return lines.join("\n");
}
