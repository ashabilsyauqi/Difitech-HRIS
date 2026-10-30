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

  // Candidate gateway URLs: internal container name, localhost, or public IP
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
// MESSAGE TEMPLATE BUILDERS
// ---------------------------------------------------------------------------

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
    `📢 *DIFITECH WORKBOARD — TUGAS BARU*`,
    ``,
    `Halo *${data.assigneeName}*, kamu mendapatkan penugasan tugas baru dari *${data.creatorName}*:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `🏢 Divisi: *${data.department || "General"}*`,
    `🏷️ Brand: *${data.brand || "Internal"}*`,
    `📅 Deadline: *${data.deadlineStr || "Belum ditentukan"}*`,
    `⚡ Prioritas: *${data.priority || "MEDIUM"}*`,
  ];

  if (data.description) {
    lines.push(`📝 Catatan: _${data.description}_`);
  }

  lines.push(``);
  lines.push(`Silakan cek detail dan perbarui status di DWB:`);
  lines.push(`🔗 https://difworkboard.difitech.id/dashboard/my-tasks`);

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
    `🔔 *DIFITECH WORKBOARD — FOLLOW UP TUGAS*`,
    ``,
    `Halo *${data.recipientName}*, ada pengingat follow-up dari *${data.senderName}* (${data.senderRoleOrDept || "Kolega"}):`,
    ``,
    `📌 *${data.taskTitle}*`,
    `🏢 Divisi: *${data.department || "General"}* | Brand: *${data.brand || "Internal"}*`,
    `💬 Pesan: _"${data.message || "Tolong dicek dan di-update progres tugas ini ya."}"_`,
    ``,
    `Mohon buka dan update perkembangan tugas kamu di DWB:`,
    `🔗 https://difworkboard.difitech.id/dashboard/my-tasks`,
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
    `✅ *DIFITECH WORKBOARD — TUGAS SIAP DIREVIEW*`,
    ``,
    `Halo *${data.creatorName}*, rekan kamu *${data.assigneeName}* telah menyelesaikan & submit tugas:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `🏢 Divisi: *${data.department || "General"}* | Brand: *${data.brand || "Internal"}*`,
  ];

  if (data.deliverableUrl) {
    lines.push(`🔗 Hasil Kerja: ${data.deliverableUrl}`);
  }
  if (data.completionNote) {
    lines.push(`📝 Catatan Pengerjaan: _"${data.completionNote}"_`);
  }

  lines.push(``);
  lines.push(`Silakan review hasil kerja (ACC / Revisi) di DWB:`);
  lines.push(`🔗 https://difworkboard.difitech.id/dashboard/workspace`);

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
    `⏰ *DIFITECH WORKBOARD — PENGINGAT DEADLINE PAGI*`,
    ``,
    `Selamat pagi *${data.userName}*! 👋`,
    `Berikut ringkasan tugas kamu yang mendekati batas waktu (H-2 / Hari Ini):`,
    ``,
  ];

  data.tasks.forEach((t, index) => {
    lines.push(`${index + 1}. *${t.title}*`);
    lines.push(`   🏷️ [${t.department || "General"} - ${t.brand || "Internal"}]`);
    lines.push(`   ⏳ Deadline: *${t.deadlineStr}* (${t.urgencyText})`);
    lines.push(``);
  });

  lines.push(`Semangat menuntaskan tugas hari ini! 💪`);
  lines.push(`Akses lembar tugas: https://difworkboard.difitech.id/dashboard/my-tasks`);

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
    `🎉 *DIFITECH WORKBOARD — TUGAS DISETUJUI (DONE)*`,
    ``,
    `Halo *${data.assigneeName}*, selamat! Tugas kamu telah disetujui oleh *${data.reviewerName}*:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `🏢 Divisi: *${data.department || "General"}* | Brand: *${data.brand || "Internal"}*`,
    `✅ Status: *SELESAI (DONE)*`,
    ``,
    `Terima kasih atas dedikasi dan kerja kerasnya! 🚀`,
    `🔗 https://difworkboard.difitech.id/dashboard/my-tasks`,
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
    `⚠️ *DIFITECH WORKBOARD — PERMINTAAN REVISI*`,
    ``,
    `Halo *${data.assigneeName}*, ada catatan revisi dari *${data.reviewerName}* untuk tugas:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `🏢 Divisi: *${data.department || "General"}* | Brand: *${data.brand || "Internal"}*`,
    `📝 Catatan Revisi: _"${data.revisionNote || "Mohon periksa dan perbaiki deliverable sesuai brief."}"_`,
    ``,
    `Silakan periksa detailnya dan submit hasil perbaikan di DWB:`,
    `🔗 https://difworkboard.difitech.id/dashboard/my-tasks`,
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
    `💬 *DIFITECH WORKBOARD — DISKUSI TUGAS*`,
    ``,
    `Halo *${data.recipientName}*, *${data.senderName}* baru saja ${data.isReply ? "membalas komentar" : "menulis komentar"} pada tugas:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `💬 Pesan: _"${data.commentText}"_`,
    ``,
    `Balas diskusi atau cek selengkapnya di DWB:`,
    `🔗 https://difworkboard.difitech.id/dashboard/my-tasks`,
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
      ? `🤝 *DIFITECH WORKBOARD — DEADLINE DISETUJUI*`
      : `📅 *DIFITECH WORKBOARD — USULAN PERUBAHAN DEADLINE*`,
    ``,
    `Halo *${data.recipientName}*, ${isAgreed ? `perubahan deadline telah disepakati oleh *${data.senderName}*` : `*${data.senderName}* mengajukan usulan deadline baru`}:`,
    ``,
    `📌 *${data.taskTitle}*`,
    `📅 Batas Waktu Baru: *${data.proposedDateStr}*`,
  ];

  if (data.reason) {
    lines.push(`📝 Alasan: _"${data.reason}"_`);
  }

  lines.push(``);
  lines.push(`Cek selengkapnya di DWB:`);
  lines.push(`🔗 https://difworkboard.difitech.id/dashboard/my-tasks`);

  return lines.join("\n");
}
