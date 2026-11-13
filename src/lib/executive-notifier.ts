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

export interface ExecutiveRecipient {
  name: string;
  phone: string;
}

export const DEFAULT_EXECUTIVE_RECIPIENTS: ExecutiveRecipient[] = [
  { name: "Pak Wijaya", phone: "628111099978" },
];

/**
 * Retrieves executive WhatsApp recipient (Pak Wijaya - CEO only).
 */
export async function getExecutiveRecipients(): Promise<ExecutiveRecipient[]> {
  const fallback: ExecutiveRecipient[] = [
    { name: "Pak Wijaya", phone: "628111099978" },
  ];
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
      return [
        {
          name: ceo.name || fallback[0].name,
          phone: ceo.whatsappNumber,
        },
      ];
    }
  } catch (err) {
    console.error("[Executive Notifier] Error fetching CEO user:", err);
  }
  return fallback;
}

/**
 * Retrieves primary CEO WhatsApp recipient (Pak Wijaya), for backward compatibility.
 */
export async function getExecutiveRecipient(): Promise<ExecutiveRecipient> {
  const all = await getExecutiveRecipients();
  return all[0] || DEFAULT_EXECUTIVE_RECIPIENTS[0];
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
  | "FOLLOW_UP"
  | "COMMENT_ADDED";

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
 * Sends a structured, clean, human-readable WhatsApp notification per action/event
 * directly to Pak Wijaya (CEO).
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
    const executives = await getExecutiveRecipients();
    if (!executives.length) {
      console.warn("[Executive Notifier] Skipped: No executive recipients found.");
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
    const deptName = task.departmentCard || params.actorDept || "General";
    const brandName = task.brandName || "Internal";
    const directLink = `https://difworkboard.difitech.id/dashboard/workspace?taskId=${task.id}`;
    const cleanNote = params.note ? cleanTextForWhatsApp(params.note, 300) : "";
    const currentWib = formatWibDateTime(new Date());

    let headerBadge = "📋 *LOG AKTIVITAS DWB*";
    let mainActionText = "";
    const detailLines: string[] = [];

    switch (params.action) {
      case "START_TASK":
        headerBadge = "🚀 *LOG AKTIVITAS DWB*";
        mainActionText = `*${picName}* - [${deptName}]\nmelakukan *Mulai Mengerjakan Tugas* (menerima tugas dari *${creatorName}*)\ndi jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        detailLines.push(`• *Status:* In Progress 🚀`);
        if (timeline.responseGapStr) {
          detailLines.push(`• *Gap Respon:* ${timeline.responseGapStr}`);
        }
        break;

      case "SUBMIT_DELIVERABLE":
        headerBadge = "📤 *LOG AKTIVITAS DWB*";
        mainActionText = `*${picName}* - [${deptName}]\nTugas di-submit ke *${creatorName}* di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        if (timeline.workDurationStr) {
          detailLines.push(`• *Durasi Pengerjaan:* ${timeline.workDurationStr}`);
        }
        if (params.deliverableUrl) {
          detailLines.push(`• *Hasil Kerja:* ${params.deliverableUrl}`);
        }
        if (cleanNote) {
          detailLines.push(`• *Catatan:* "${cleanNote}"`);
        }
        break;

      case "APPROVE_TASK":
        headerBadge = "✅ *LOG AKTIVITAS DWB*";
        mainActionText = `Tugas *${picName}* - [${deptName}]\nsudah di-ACC oleh *${params.actorName}* di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        detailLines.push(`• *Status:* Selesai (DONE)`);
        if (timeline.totalTurnaroundStr) {
          detailLines.push(`• *Total Waktu Tuntas:* ${timeline.totalTurnaroundStr}`);
        }
        break;

      case "REQUEST_REVISION":
        headerBadge = "⚠️ *LOG AKTIVITAS DWB*";
        mainActionText = `Tugas *${picName}* - [${deptName}]\ndiminta revisi oleh *${params.actorName}* di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        if (cleanNote) {
          detailLines.push(`• *Catatan Revisi:* "${cleanNote}"`);
        }
        break;

      case "TASK_CREATED":
        headerBadge = "📌 *LOG AKTIVITAS DWB*";
        mainActionText = `*${params.actorName}* - [${deptName}]\nmembuat tugas baru untuk *${picName}* di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        if (task.expectedDeadline) {
          detailLines.push(`• *Deadline:* ${formatWibDateTime(task.expectedDeadline, true)}`);
        }
        break;

      case "FOLLOW_UP":
        headerBadge = "🔔 *LOG AKTIVITAS DWB*";
        mainActionText = `*${params.actorName}* - [${deptName}]\nmelakukan Follow Up tugas ke *${picName}* di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        if (cleanNote) {
          detailLines.push(`• *Pesan:* "${cleanNote}"`);
        }
        break;

      case "COMMENT_ADDED":
        headerBadge = "💬 *LOG AKTIVITAS DWB*";
        mainActionText = `*${params.actorName}* - [${deptName}]\nmenambahkan komentar pada tugas di jam *${currentWib}*`;
        detailLines.push(`• *Tugas:* ${cleanTitle} [${brandName}]`);
        if (cleanNote) {
          detailLines.push(`• *Komentar:* "${cleanNote}"`);
        }
        break;
    }

    const results = [];
    for (const executive of executives) {
      if (!executive.phone) continue;

      const messageLines = [
        headerBadge,
        "",
        mainActionText,
        "",
        ...detailLines,
        `• *Link:* ${directLink}`,
        "----------------------------------------",
        "_Difitech Realtime Executive Log_",
      ];

      const fullMessage = messageLines.join("\n");

      const res = await sendWhatsAppNotification({
        to: executive.phone,
        message: fullMessage,
        recipientName: executive.name,
        taskId: task.id,
        actionType: `EXECUTIVE_${params.action}_${executive.phone}`,
      });
      results.push(res);
      // Short delay between executive dispatches
      await new Promise((r) => setTimeout(r, 1000));
    }

    return results[0] || null;
  } catch (err: any) {
    console.error("[Executive Notifier] Failed to notify executives:", err?.message);
    return null;
  }
}

/**
 * Compiles and sends a structured digest of employee activities and tasks.
 * Defaults to 1 chat per employee (separate chat per person) sent directly
 * to Pak Wijaya (CEO).
 */
export async function generateAndSendHourlyExecutiveReport(options?: {
  recipientPhone?: string;
  recipientName?: string;
  hoursLookback?: number;
  mode?: "per_employee" | "bundle";
}): Promise<any> {
  try {
    const executives = options?.recipientPhone
      ? [{ name: options?.recipientName || "Pimpinan", phone: options.recipientPhone }]
      : await getExecutiveRecipients();

    if (!executives.length) {
      console.warn("[Executive Notifier] No valid executive recipients found.");
      return { success: false, detail: "Nomor WhatsApp eksekutif tidak ditemukan" };
    }

    // Determine time range: default 24h lookback
    const lookbackHours = options?.hoursLookback || 24;
    const sinceDate = new Date(Date.now() - lookbackHours * 3600 * 1000);

    const tasks = await prisma.task.findMany({
      where: { updatedAt: { gte: sinceDate } },
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

    if (tasks.length === 0) {
      console.log("[Executive Notifier] Tidak ada aktivitas tugas pada periode ini.");
      return { success: true, count: 0, detail: "Tidak ada tugas aktif dalam periode ini." };
    }

    // Group tasks by PIC
    const byUser: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      const userName = t.user?.name || (t.assignees && t.assignees[0]?.user?.name) || "Tanpa PIC";
      if (!byUser[userName]) byUser[userName] = [];
      byUser[userName].push(t);
    }

    const now = new Date();
    const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const currentWibTime = formatWibDateTime(now, false);
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthsIndo = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dayName = daysIndo[wibNow.getUTCDay()];
    const dateFormatted = `${dayName}, ${wibNow.getUTCDate()} ${monthsIndo[wibNow.getUTCMonth()]} ${wibNow.getUTCFullYear()}`;

    const mode = options?.mode || "per_employee";
    const dispatchResults: any[] = [];

    if (mode === "per_employee") {
      // -------------------------------------------------------------
      // Mode 1 Karyawan 1 Chat (Pemisahan chat per individu)
      // -------------------------------------------------------------
      for (const [userName, uTasks] of Object.entries(byUser)) {
        const dept = uTasks[0].departmentCard || uTasks[0].user?.department || "General";
        const uCompleted = uTasks.filter((t) => t.status === "COMPLETED").length;
        const uInProgress = uTasks.filter((t) => t.status === "IN_PROGRESS").length;
        const uPending = uTasks.filter((t) => t.status === "PENDING").length;

        const taskLines: string[] = [];
        uTasks.forEach((t, idx) => {
          const statusBadge =
            t.status === "COMPLETED" ? "✅ Selesai" : t.status === "IN_PROGRESS" ? "🚀 In Progress" : "⏳ Pending";
          const brand = t.brandName || "Internal";
          const cleanTitle = cleanTextForWhatsApp(t.title, 120);
          taskLines.push(`${idx + 1}. *${cleanTitle}* [${brand}]`);
          taskLines.push(`   • Status: ${statusBadge}`);

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
          taskLines.push(`   • Timeline: ${timelineParts.join(" ➔ ")}`);

          const gapParts: string[] = [];
          if (t1) gapParts.push(`Respon: ${formatDurationMs(t1.getTime() - t0.getTime())}`);
          if (t1 && t2 && t2.getTime() > t1.getTime()) {
            gapParts.push(`Kerja: ${formatDurationMs(t2.getTime() - t1.getTime())}`);
          }
          if (t3 && t0 && t3.getTime() > t0.getTime()) {
            gapParts.push(`Total: ${formatDurationMs(t3.getTime() - t0.getTime())}`);
          }
          if (gapParts.length > 0) {
            taskLines.push(`   • ⏱️ Gap: ${gapParts.join(" | ")}`);
          }

          if (t.deliverableUrl) {
            taskLines.push(`   • 🔗 Hasil: ${t.deliverableUrl}`);
          }
          taskLines.push("");
        });

        // Kirim chat karyawan ini ke Pak Wijaya
        for (const executive of executives) {
          if (!executive.phone) continue;

          const empMessageLines = [
            "📊 *DIFITECH EXECUTIVE MONITORING*",
            `👤 *LOG AKTIVITAS: ${userName.toUpperCase()}* (${dept})`,
            `📅 *Update: ${currentWibTime} | ${dateFormatted}*`,
            "----------------------------------------",
            `Yth. *${executive.name}*, berikut rincian tugas & progres kerja *${userName}* dalam siklus 24 jam terakhir:`,
            "",
            `📈 *Ringkasan Karyawan:* ${uTasks.length} Tugas (✅ ${uCompleted} Selesai | 🚀 ${uInProgress} In Progress | ⏳ ${uPending} Pending)`,
            "",
            ...taskLines,
            "----------------------------------------",
            "🔗 *Pantau Tugas Karyawan di DWB:*",
            "https://difworkboard.difitech.id/dashboard/workspace",
            "----------------------------------------",
            "_Difitech Executive Realtime Bot_",
          ];

          const fullMessage = empMessageLines.join("\n");

          const res = await sendWhatsAppNotification({
            to: executive.phone,
            message: fullMessage,
            recipientName: executive.name,
            actionType: `EXECUTIVE_EMP_${userName}_${executive.phone}`,
          });

          dispatchResults.push({ employee: userName, to: executive.name, result: res });
          // Jeda 1.5 detik antar pesan agar tidak memicu throttling gateway
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    } else {
      // Fallback bundle mode
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "COMPLETED").length;
      const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const pending = tasks.filter((t) => t.status === "PENDING").length;

      const lines = [
        "📊 *DIFITECH EXECUTIVE LOGS & MONITORING*",
        `📅 *Update Aktivitas Karyawan (Per Jam ${currentWibTime})*`,
        `🗓️ *Hari/Tanggal:* ${dateFormatted}`,
        "----------------------------------------",
        `Yth. *Pimpinan Eksekutif*, berikut ringkasan seluruh tugas di DWB:`,
        "",
        `• Total Tugas Aktif: *${total} Tugas*`,
        `• ✅ Selesai: *${completed}* | 🚀 In Progress: *${inProgress}* | ⏳ Pending: *${pending}*`,
        "----------------------------------------",
      ];

      for (const executive of executives) {
        if (!executive.phone) continue;
        const res = await sendWhatsAppNotification({
          to: executive.phone,
          message: lines.join("\n"),
          recipientName: executive.name,
          actionType: `EXECUTIVE_BUNDLE_${executive.phone}`,
        });
        dispatchResults.push({ mode: "bundle", to: executive.name, result: res });
      }
    }

    return {
      success: true,
      employeesCount: Object.keys(byUser).length,
      tasksCount: tasks.length,
      dispatches: dispatchResults,
    };
  } catch (err: any) {
    console.error("[Executive Notifier] Failed to send hourly report:", err?.message);
    return { success: false, detail: err?.message };
  }
}


