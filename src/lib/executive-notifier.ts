import { prisma } from "@/lib/prisma";
import { sendWhatsAppNotification, cleanTextForWhatsApp } from "@/lib/whatsapp";

/**
 * Format duration in milliseconds into clean human-readable Indonesian text.
 * Examples: "15 menit", "2 jam 10 menit", "1 hari 3 jam".
 */
export function formatDurationMs(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMins = Math.floor(ms / (1000 * 60));
  if (totalMins < 1) return "< 1 menit";
  if (totalMins < 60) return `${totalMins} menit`;

  const totalHours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  if (totalHours < 24) {
    return remainingMins > 0 ? `${totalHours} jam ${remainingMins} menit` : `${totalHours} jam`;
  }

  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  return remainingHours > 0 ? `${days} hari ${remainingHours} jam` : `${days} hari`;
}

/**
 * Format Date to standard WIB time string.
 * Example: "11:45 WIB" or "12 Nov, 11:45 WIB"
 */
export function formatWibDateTime(dateInput: Date | string | null | undefined, includeDate = false): string {
  if (!dateInput) return "-";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "-";

    const pad = (n: number) => String(n).padStart(2, "0");
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());

    if (!includeDate) {
      return `${hours}:${minutes} WIB`;
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    return `${day} ${month}, ${hours}:${minutes} WIB`;
  } catch {
    return "-";
  }
}

/**
 * Retrieves the executive (CEO) WhatsApp number from database,
 * fallback to Pak Wijaya's configured number.
 */
export async function getExecutiveRecipient(): Promise<{ name: string; phone: string }> {
  const fallback = { name: "Pak Wijaya", phone: "628111099978" };
  try {
    const ceo = await prisma.user.findFirst({
      where: {
        OR: [
          { department: "CEO" },
          { name: { contains: "Wijaya" } },
          { email: { contains: "wijaya" } },
        ],
      },
      select: { name: true, whatsappNumber: true },
    });

    if (ceo && ceo.whatsappNumber) {
      return {
        name: ceo.name || fallback.name,
        phone: ceo.whatsappNumber,
      };
    }
  } catch (err) {
    console.error("[Executive Notifier] Error fetching CEO user:", err);
  }
  return fallback;
}

export interface TaskTimelineSummary {
  createdTimeStr: string;
  startedTimeStr?: string | null;
  submittedTimeStr?: string | null;
  reviewedTimeStr?: string | null;
  responseGapStr?: string | null;
  workDurationStr?: string | null;
  reviewGapStr?: string | null;
  totalTurnaroundStr?: string | null;
}

/**
 * Calculates standard lifecycle timeline and time gaps (SLA) for a task.
 */
export async function calculateTaskTimelineGaps(taskId: string): Promise<TaskTimelineSummary> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      activityLogs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) {
    return { createdTimeStr: "-" };
  }

  const t0 = new Date(task.createdAt);

  // Cari waktu mulai dikerjakan (T1)
  let t1: Date | null = null;
  const startLog = task.activityLogs.find(
    (l) =>
      l.actionType === "START_TASK" ||
      (l.actionType === "STATUS_CHANGE" && l.toValue === "IN_PROGRESS") ||
      (l.title && l.title.toLowerCase().includes("mulai"))
  );
  if (startLog) {
    t1 = new Date(startLog.createdAt);
  } else if (task.trackingStartedAt) {
    t1 = new Date(task.trackingStartedAt);
  }

  // Cari waktu pengajuan review terakhir (T2)
  let t2: Date | null = null;
  const submitLogs = task.activityLogs.filter(
    (l) =>
      l.actionType === "SUBMIT_DELIVERABLE" ||
      (l.actionType === "STAGE_CHANGE" && (l.toValue?.includes("REVIEW") || l.toValue?.includes("APPROVAL")))
  );
  if (submitLogs.length > 0) {
    t2 = new Date(submitLogs[submitLogs.length - 1].createdAt);
  }

  // Cari waktu review / ACC / revisi terakhir (T3)
  let t3: Date | null = null;
  const reviewLogs = task.activityLogs.filter(
    (l) =>
      l.actionType === "APPROVE_TASK" ||
      l.actionType === "REQUEST_REVISION" ||
      task.reviewedAt
  );
  if (reviewLogs.length > 0) {
    t3 = new Date(reviewLogs[reviewLogs.length - 1].createdAt);
  } else if (task.reviewedAt) {
    t3 = new Date(task.reviewedAt);
  }

  const isMultiDay = (d1: Date, d2?: Date | null) => {
    if (!d2) return false;
    return d1.toDateString() !== d2.toDateString();
  };

  const responseGapStr = t1 ? formatDurationMs(t1.getTime() - t0.getTime()) : null;
  const workDurationStr = t1 && t2 ? formatDurationMs(t2.getTime() - t1.getTime()) : null;
  const reviewGapStr = t2 && t3 ? formatDurationMs(t3.getTime() - t2.getTime()) : null;
  const totalTurnaroundStr = t3 ? formatDurationMs(t3.getTime() - t0.getTime()) : null;

  return {
    createdTimeStr: formatWibDateTime(t0, isMultiDay(t0, new Date())),
    startedTimeStr: t1 ? formatWibDateTime(t1, isMultiDay(t1, new Date())) : null,
    submittedTimeStr: t2 ? formatWibDateTime(t2, isMultiDay(t2, new Date())) : null,
    reviewedTimeStr: t3 ? formatWibDateTime(t3, isMultiDay(t3, new Date())) : null,
    responseGapStr,
    workDurationStr,
    reviewGapStr,
    totalTurnaroundStr,
  };
}

export type ExecutiveActionType =
  | "TASK_CREATED"
  | "START_TASK"
  | "SUBMIT_DELIVERABLE"
  | "APPROVE_TASK"
  | "REQUEST_REVISION"
  | "FOLLOW_UP";

export interface NotifyExecutiveParams {
  taskId: string;
  action: ExecutiveActionType;
  actorName: string;
  actorDept?: string | null;
  actorId?: string | null;
  note?: string | null;
  deliverableUrl?: string | null;
  extraInfo?: string | null;
}

/**
 * Sends a structured, executive-grade WhatsApp notification with standard timeline
 * and time-gap metrics to Pak Wijaya (CEO).
 */
export async function notifyExecutiveMilestone(params: {
  taskId: string;
  action: ExecutiveActionType;
  actorName: string;
  actorDept?: string | null;
  actorId?: string | null;
  note?: string | null;
  deliverableUrl?: string | null;
  extraInfo?: string | null;
}): Promise<any> {
  try {
    const executive = await getExecutiveRecipient();
    if (!executive.phone) {
      console.warn("[Executive Notifier] Skipped: No CEO phone found.");
      return null;
    }

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        creator: { select: { id: true, name: true, department: true } },
        user: { select: { id: true, name: true, department: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, department: true } },
          },
        },
      },
    });

    if (!task) return null;

    const timeline = await calculateTaskTimelineGaps(params.taskId);
    const cleanTitle = cleanTextForWhatsApp(task.title, 150) || "Tugas";
    const picName =
      task.user?.name ||
      task.assignees?.map((a) => a.user?.name).filter(Boolean).join(", ") ||
      "Pengerja";
    const creatorName = task.creator?.name || "Kolega";
    const deptAndBrand = `${task.departmentCard || "General"} • ${task.brandName || "Internal"}`;
    const directLink = `https://difworkboard.difitech.id/dashboard/workspace?taskId=${task.id}`;

    let headerBadge = "";
    let actionIntro = "";
    const timelineLines: string[] = [];

    switch (params.action) {
      case "TASK_CREATED":
        headerBadge = "📌 *DIFITECH EXECUTIVE LOG* | *TUGAS BARU DIBUAT*";
        actionIntro = `*${params.actorName}* (${params.actorDept || "Kolega"}) baru saja membuat tugas baru:`;
        timelineLines.push(`• Dibuat: ${timeline.createdTimeStr}`);
        if (task.expectedDeadline) {
          timelineLines.push(`• Target Selesai (Deadline): ${formatWibDateTime(task.expectedDeadline, true)}`);
        }
        break;

      case "START_TASK":
        headerBadge = "🚀 *DIFITECH EXECUTIVE LOG* | *MULAI DIKERJAKAN*";
        actionIntro = `*${params.actorName}* telah menerima & mulai mengerjakan tugas:`;
        timelineLines.push(`• Dibuat: ${timeline.createdTimeStr}`);
        timelineLines.push(
          `• Mulai Dikerjakan: ${timeline.startedTimeStr || formatWibDateTime(new Date())} ${
            timeline.responseGapStr ? `_(Gap Respon: ${timeline.responseGapStr})_` : ""
          }`
        );
        break;

      case "SUBMIT_DELIVERABLE":
        headerBadge = "📋 *DIFITECH EXECUTIVE LOG* | *SUBMIT REVIEW*";
        actionIntro = `*${params.actorName}* telah menyelesaikan & mengajukan hasil kerja untuk direview:`;
        timelineLines.push(`1. Dibuat: ${timeline.createdTimeStr}`);
        if (timeline.startedTimeStr) {
          timelineLines.push(`2. Mulai: ${timeline.startedTimeStr} _(Gap Respon: ${timeline.responseGapStr || "-"})_`);
        }
        timelineLines.push(
          `3. Submit Hasil: ${timeline.submittedTimeStr || formatWibDateTime(new Date())} ${
            timeline.workDurationStr ? `_(Durasi Pengerjaan: ${timeline.workDurationStr})_` : ""
          }`
        );
        break;

      case "APPROVE_TASK":
        headerBadge = "✅ *DIFITECH EXECUTIVE LOG* | *TUGAS SELESAI (ACC)*";
        actionIntro = `Tugas telah diperiksa & *disetujui (ACC)* oleh *${params.actorName}*:`;
        timelineLines.push(`• Dibuat: ${timeline.createdTimeStr}`);
        if (timeline.startedTimeStr) {
          timelineLines.push(`• Mulai: ${timeline.startedTimeStr} (Respon: ${timeline.responseGapStr || "-"})`);
        }
        if (timeline.submittedTimeStr) {
          timelineLines.push(`• Submit: ${timeline.submittedTimeStr} (Kerja: ${timeline.workDurationStr || "-"})`);
        }
        timelineLines.push(
          `• Di-ACC: ${timeline.reviewedTimeStr || formatWibDateTime(new Date())} ${
            timeline.reviewGapStr ? `(Review: ${timeline.reviewGapStr})` : ""
          }`
        );
        if (timeline.totalTurnaroundStr) {
          timelineLines.push(`----------------------------------------`);
          timelineLines.push(`🏁 *Total Waktu Tuntas:* *${timeline.totalTurnaroundStr}*`);
        }
        break;

      case "REQUEST_REVISION":
        headerBadge = "⚠️ *DIFITECH EXECUTIVE LOG* | *PERMINTAAN REVISI*";
        actionIntro = `*${params.actorName}* meminta perbaikan/revisi atas deliverable tugas:`;
        if (timeline.submittedTimeStr) {
          timelineLines.push(`• Submit Hasil: ${timeline.submittedTimeStr}`);
        }
        timelineLines.push(
          `• Minta Revisi: ${timeline.reviewedTimeStr || formatWibDateTime(new Date())} ${
            timeline.reviewGapStr ? `_(Gap Review: ${timeline.reviewGapStr})_` : ""
          }`
        );
        break;

      case "FOLLOW_UP":
        headerBadge = "🔔 *DIFITECH EXECUTIVE LOG* | *FOLLOW UP TUGAS*";
        actionIntro = `*${params.actorName}* menekan tombol Follow Up (tugas mandek/butuh update):`;
        timelineLines.push(`• Dibuat: ${timeline.createdTimeStr}`);
        if (timeline.startedTimeStr) {
          timelineLines.push(`• Mulai Dikerjakan: ${timeline.startedTimeStr}`);
        }
        break;
    }

    const messageLines = [
      headerBadge,
      "----------------------------------------",
      `Halo *${executive.name}*, ada update aktivitas karyawan di DWB:`,
      actionIntro,
      "",
      `• *Tugas:* ${cleanTitle}`,
      `• *Pelaksana (PIC):* ${picName}`,
      `• *Pemberi Tugas:* ${creatorName}`,
      `• *Divisi / Brand:* ${deptAndBrand}`,
      "",
      "⏱️ *TIMELINE & GAP WAKTU:*",
      ...timelineLines,
    ];

    if (params.deliverableUrl) {
      messageLines.push("");
      messageLines.push(`• *Link Hasil Kerja (Deliverable):* ${params.deliverableUrl}`);
    }

    if (params.note) {
      const cleanNote = cleanTextForWhatsApp(params.note, 300);
      if (cleanNote) {
        messageLines.push("");
        messageLines.push(`• *Catatan / Instruksi:* _"${cleanNote}"_`);
      }
    }

    messageLines.push("");
    messageLines.push(`🔗 *Buka Kartu Tugas di DWB:*`);
    messageLines.push(directLink);
    messageLines.push("----------------------------------------");
    messageLines.push("_Difitech Executive Monitoring System_");

    const fullMessage = messageLines.join("\n");

    const result = await sendWhatsAppNotification({
      to: executive.phone,
      message: fullMessage,
      recipientName: executive.name,
      taskId: task.id,
      actionType: `EXECUTIVE_${params.action}`,
    });

    return result;
  } catch (err: any) {
    console.error("[Executive Notifier] Failed to notify executive:", err?.message);
    return null;
  }
}

/**
 * Compiles and sends a structured hourly digest of all employee activities and tasks
 * directly to Pak Wijaya (CEO).
 */
export async function generateAndSendHourlyExecutiveReport(options?: {
  recipientPhone?: string;
  recipientName?: string;
}): Promise<any> {
  try {
    const executive = await getExecutiveRecipient();
    const targetPhone = options?.recipientPhone || executive.phone;
    const targetName = options?.recipientName || executive.name;

    if (!targetPhone) {
      console.warn("[Executive Notifier] No valid recipient phone for hourly report.");
      return { success: false, detail: "Nomor WhatsApp CEO tidak ditemukan" };
    }

    // Start of today in WIB (UTC+7)
    const now = new Date();
    const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const todayStartWib = new Date(wibNow);
    todayStartWib.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStartWib.getTime() - 7 * 3600 * 1000);

    const tasks = await prisma.task.findMany({
      where: { updatedAt: { gte: todayStartUTC } },
      include: {
        creator: { select: { name: true, department: true } },
        user: { select: { name: true, department: true } },
        assignees: {
          include: {
            user: { select: { name: true, department: true } },
          },
        },
        activityLogs: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;

    // Group tasks by PIC
    const byUser: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      const userName = t.user?.name || (t.assignees && t.assignees[0]?.user?.name) || "Tanpa PIC";
      if (!byUser[userName]) byUser[userName] = [];
      byUser[userName].push(t);
    }

    const currentWibTime = formatWibDateTime(now, false);
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthsIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayName = daysIndo[wibNow.getUTCDay()];
    const dateFormatted = `${dayName}, ${wibNow.getUTCDate()} ${monthsIndo[wibNow.getUTCMonth()]} ${wibNow.getUTCFullYear()}`;

    const lines = [
      "📊 *DIFITECH EXECUTIVE LOGS & MONITORING*",
      `📅 *Update Aktivitas Karyawan (Per Jam ${currentWibTime})*`,
      `🗓️ *Hari/Tanggal:* ${dateFormatted}`,
      "----------------------------------------",
      `Yth. *${targetName}*, berikut rangkuman lengkap aktivitas seluruh karyawan & status tugas di DifWorkBoard (DWB) per jam ini:`,
      "",
      "📈 *RINGKASAN STATUS HARI INI:*",
      `• Total Tugas Aktif: *${total} Tugas*`,
      `• ✅ Selesai (Completed): *${completed} Tugas*`,
      `• 🚀 Sedang Dikerjakan: *${inProgress} Tugas*`,
      `• ⏳ Menunggu (Pending): *${pending} Tugas*`,
      "----------------------------------------",
      "👥 *RINCIAN AKTIVITAS PER KARYAWAN:*",
      "",
    ];

    for (const [userName, uTasks] of Object.entries(byUser)) {
      const dept = uTasks[0].departmentCard || uTasks[0].user?.department || "General";
      const uCompleted = uTasks.filter((t) => t.status === "COMPLETED").length;
      const uInProgress = uTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const uPending = uTasks.filter((t) => t.status === "PENDING").length;

      lines.push(`👤 *${userName.toUpperCase()}* (${dept})`);
      lines.push(`   Total: ${uTasks.length} Tugas (✅ ${uCompleted} | 🚀 ${uInProgress} | ⏳ ${uPending})`);

      uTasks.forEach((t, idx) => {
        const statusBadge =
          t.status === "COMPLETED" ? "✅ Selesai" : t.status === "IN_PROGRESS" ? "🚀 In Progress" : "⏳ Pending";
        const brand = t.brandName || "Internal";
        const cleanTitle = cleanTextForWhatsApp(t.title, 120);
        lines.push(`   ${idx + 1}. *${cleanTitle}* [${brand}]`);
        lines.push(`      Status: ${statusBadge}`);

        const t0 = new Date(t.createdAt);
        let t1: Date | null = null;
        const startLog = t.activityLogs.find(
          (l) =>
            l.actionType === "START_TASK" ||
            (l.actionType === "STATUS_CHANGE" && l.toValue === "IN_PROGRESS") ||
            (l.title && l.title.toLowerCase().includes("mulai")) ||
            (l.actionType === "STAGE_CHANGE" && l.toValue === "IN_PROGRESS")
        );
        if (startLog) t1 = new Date(startLog.createdAt);
        else if (t.trackingStartedAt) t1 = new Date(t.trackingStartedAt);

        let t2: Date | null = null;
        const submitLogs = t.activityLogs.filter(
          (l) =>
            l.actionType === "SUBMIT_DELIVERABLE" ||
            (l.actionType === "STAGE_CHANGE" && (l.toValue?.includes("REVIEW") || l.toValue?.includes("APPROVAL")))
        );
        if (submitLogs.length > 0) t2 = new Date(submitLogs[submitLogs.length - 1].createdAt);

        let t3: Date | null = null;
        const reviewLogs = t.activityLogs.filter(
          (l) =>
            l.actionType === "APPROVE_TASK" ||
            l.actionType === "REQUEST_REVISION" ||
            (l.actionType === "STATUS_CHANGE" && l.toValue === "COMPLETED")
        );
        if (reviewLogs.length > 0) t3 = new Date(reviewLogs[reviewLogs.length - 1].createdAt);
        else if (t.reviewedAt) t3 = new Date(t.reviewedAt);

        const timelineParts = [`Dibuat ${formatWibDateTime(t0)}`];
        if (t1) timelineParts.push(`Mulai ${formatWibDateTime(t1)}`);
        if (t2) timelineParts.push(`Submit ${formatWibDateTime(t2)}`);
        if (t3) timelineParts.push(`ACC ${formatWibDateTime(t3)}`);
        lines.push(`      Timeline: ${timelineParts.join(" ➔ ")}`);

        const gapParts: string[] = [];
        if (t1) gapParts.push(`Respon: ${formatDurationMs(t1.getTime() - t0.getTime())}`);
        if (t1 && t2 && t2.getTime() > t1.getTime()) {
          gapParts.push(`Kerja: ${formatDurationMs(t2.getTime() - t1.getTime())}`);
        }
        if (t3 && t0 && t3.getTime() > t0.getTime()) {
          gapParts.push(`Total: ${formatDurationMs(t3.getTime() - t0.getTime())}`);
        }
        if (gapParts.length > 0) {
          lines.push(`      ⏱️ Gap: ${gapParts.join(" | ")}`);
        }

        if (t.deliverableUrl) {
          lines.push(`      🔗 Hasil: ${t.deliverableUrl}`);
        }
      });
      lines.push("");
    }

    lines.push("----------------------------------------");
    lines.push("🔗 *Akses Dashboard Monitoring DWB:*");
    lines.push("https://difworkboard.difitech.id/dashboard/workspace");
    lines.push("----------------------------------------");
    lines.push("_Difitech Executive Realtime Bot_");

    const fullMessage = lines.join("\n");

    const result = await sendWhatsAppNotification({
      to: targetPhone,
      message: fullMessage,
      recipientName: targetName,
      actionType: "EXECUTIVE_HOURLY_REPORT",
    });

    return result;
  } catch (err: any) {
    console.error("[Executive Notifier] Failed to send hourly report:", err?.message);
    return { success: false, detail: err?.message };
  }
}

