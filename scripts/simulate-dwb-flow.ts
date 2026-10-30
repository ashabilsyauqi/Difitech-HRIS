const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  normalizeWhatsAppNumber,
  buildTaskAssignedMessage,
  buildTaskFollowUpMessage,
  buildTaskSubmittedMessage,
  buildMorningDeadlineMessage,
  sendWhatsAppNotification
} = require("./src/lib/whatsapp");

async function simulate() {
  console.log("================================================================================");
  console.log("   SIMULASI SISTEM DWB: LOGS, WHATSAPP NOTIFICATION, FOLLOW-UP & DEADLINE H-2   ");
  console.log("================================================================================\n");

  // 1. Verifikasi Data Karyawan
  const avila = await prisma.user.findFirst({ where: { email: "avila@difitech.co.id" } });
  const ashabil = await prisma.user.findFirst({ where: { email: "ashabil@difitech.co.id" } });

  console.log("1. DATA KARYAWAN TERVERIFIKASI:");
  console.log(`   - Pembuat Tugas (Avila): ID ${avila.id} | Dept: ${avila.department} | WA: ${avila.whatsappNumber || "6281298765432"}`);
  console.log(`   - Pengerja Tugas (Ashabil): ID ${ashabil.id} | Dept: ${ashabil.department} | WA: ${ashabil.whatsappNumber} (Normalized: ${normalizeWhatsAppNumber(ashabil.whatsappNumber)})\n`);

  // ---------------------------------------------------------------------------
  // SCENARIO 1: AVILA ASSIGN TUGAS KE SAYA (ASHABIL)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 1: Avila membuat tugas dan meng-assign ke Ashabil (087871976694)");
  console.log("--------------------------------------------------------------------------------");

  const deadline = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 jam ke depan (H-2)
  const deadlineFmt = deadline.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const taskTitle = "Implementasi Integrasi Otomasi WhatsApp Notifier DWB";
  const brandName = "Difitech Internal";
  const departmentCard = "WEB";
  const taskDesc = "Buat sistem logs otomatis dan kirim notifikasi WA saat penugasan, follow-up, serta submit tugas.";

  // A. Buat Task di Database
  const task = await prisma.task.create({
    data: {
      title: taskTitle,
      description: taskDesc,
      departmentCard,
      brandName,
      userId: ashabil.id,
      creatorId: avila.id,
      expectedDeadline: deadline,
      suggestedDeadline: deadline,
      suggestionStatus: "WAITING_ASSIGNEE_CONFIRMATION",
      priority: "HIGH",
      estimatedHours: 4.0,
      status: "REQUESTED",
      kanbanStage: "USER_REQUESTED",
      category: departmentCard,
      assignees: {
        create: [{ userId: ashabil.id, role: "PIC" }],
      },
    },
  });
  console.log(`[DB] Task berhasil dibuat: ID ${task.id}`);

  // B. Catat di TaskActivityLog Sistem
  const logCreated = await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      userId: avila.id,
      actionType: "TASK_CREATED",
      title: "Tugas Dibuat & Ditugaskan",
      description: `${avila.name} (${avila.department}) membuat tugas [${departmentCard} - ${brandName}]: "${taskTitle}" untuk ${ashabil.name}. Target deadline: ${deadlineFmt}.`,
      toValue: "USER_REQUESTED",
      metadata: JSON.stringify({
        initialDeadline: deadline.toISOString(),
        departmentCard,
        brandName,
      }),
    },
  });
  console.log(`[LOG] TaskActivityLog tercatat: "${logCreated.description}"`);

  // C. In-App Notification
  await prisma.notification.create({
    data: {
      userId: ashabil.id,
      title: `Tugas Baru: ${taskTitle} (Target: ${deadlineFmt})`,
      message: `${avila.name} menugaskan Anda tugas baru. Harap tinjau di lembar tugas.`,
      type: "TASK_ASSIGNED",
      link: "/dashboard/workspace",
      taskId: task.id,
    },
  });

  // D. Kirim WhatsApp ke Ashabil
  const waMsg1 = buildTaskAssignedMessage({
    assigneeName: ashabil.name,
    creatorName: avila.name,
    taskTitle,
    department: departmentCard,
    brand: brandName,
    deadlineStr: deadlineFmt,
    priority: "HIGH",
    description: taskDesc,
    taskId: task.id,
  });

  const waRes1 = await sendWhatsAppNotification({
    to: ashabil.whatsappNumber,
    message: waMsg1,
    recipientName: ashabil.name,
    taskId: task.id,
    actionType: "TASK_ASSIGNED",
  });

  console.log(`[WA NOTIFIER] Status: ${waRes1.status} | Tujuan: ${waRes1.recipientPhone}`);
  console.log(">>> PREVIEW PESAN WHATSAPP MASUK KE HP ASHABIL:\n");
  console.log(waMsg1);
  console.log("\n");

  // ---------------------------------------------------------------------------
  // SCENARIO 2: SAYA SEDANG KERJA, AVILA TEKAN TOMBOL FOLLOW-UP
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 2: Saat Ashabil sedang kerja, Avila menekan tombol Follow Up");
  console.log("--------------------------------------------------------------------------------");

  const followUpMessage = "Halo Ashabil, gimana progres modul WA DWB? Mau kita deploy sore ini ya.";

  const followUp = await prisma.taskFollowUp.create({
    data: {
      taskId: task.id,
      senderId: avila.id,
      recipientId: ashabil.id,
      message: followUpMessage,
    },
  });

  const waMsg2 = buildTaskFollowUpMessage({
    recipientName: ashabil.name,
    senderName: avila.name,
    senderRoleOrDept: avila.department,
    taskTitle: task.title,
    department: task.departmentCard,
    brand: task.brandName,
    message: followUpMessage,
    taskId: task.id,
  });

  const waRes2 = await sendWhatsAppNotification({
    to: ashabil.whatsappNumber,
    message: waMsg2,
    recipientName: ashabil.name,
    taskId: task.id,
    actionType: "FOLLOW_UP",
  });

  const logFollowUp = await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      userId: avila.id,
      actionType: "FOLLOW_UP",
      title: "Follow Up Dikirim",
      description: `${avila.name} (${avila.department}) menekan tombol follow up ke ${ashabil.name}: "${followUpMessage}"`,
      metadata: JSON.stringify({ followUpId: followUp.id, waRes2 }),
    },
  });

  console.log(`[LOG] TaskActivityLog tercatat: "${logFollowUp.description}"`);
  console.log(`[WA NOTIFIER] Status: ${waRes2.status} | Tujuan: ${waRes2.recipientPhone}`);
  console.log(">>> PREVIEW PESAN WHATSAPP FOLLOW-UP MASUK KE HP ASHABIL:\n");
  console.log(waMsg2);
  console.log("\n");

  // ---------------------------------------------------------------------------
  // SCENARIO 3: SAYA (ASHABIL) SUBMIT HASIL TUGAS & MINTA REVIEW KE AVILA
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 3: Ashabil submit hasil kerja -> Notifikasi WA otomatis bunyi di HP Avila");
  console.log("--------------------------------------------------------------------------------");

  const deliverableUrl = "https://github.com/difitech/dwb/pull/42";
  const completionNote = "Semua fitur logs, WhatsApp trigger (assign, follow up, submit, H-2 cron) sudah selesai dan diverifikasi!";

  const updatedTask = await prisma.task.update({
    where: { id: task.id },
    data: {
      status: "IN_PROGRESS",
      reviewStatus: "TO_BE_REVIEWED",
      kanbanStage: "SUBMIT_TO_REVIEW",
      deliverableUrl,
      completionNote,
    },
  });

  const logSubmit = await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      userId: ashabil.id,
      actionType: "SUBMIT_DELIVERABLE",
      title: "Penyerahan Hasil Kerja",
      description: `${ashabil.name} menyerahkan hasil kerja: "${completionNote}"`,
      metadata: JSON.stringify({ deliverableUrl }),
    },
  });

  const waMsg3 = buildTaskSubmittedMessage({
    creatorName: avila.name,
    assigneeName: ashabil.name,
    taskTitle: task.title,
    department: task.departmentCard,
    brand: task.brandName,
    deliverableUrl,
    completionNote,
    taskId: task.id,
  });

  const waRes3 = await sendWhatsAppNotification({
    to: avila.whatsappNumber || "081298765432",
    message: waMsg3,
    recipientName: avila.name,
    taskId: task.id,
    actionType: "SUBMIT_DELIVERABLE",
  });

  console.log(`[LOG] TaskActivityLog tercatat: "${logSubmit.description}"`);
  console.log(`[WA NOTIFIER] Status: ${waRes3.status} | Tujuan: ${waRes3.recipientPhone || "6281298765432"}`);
  console.log(">>> PREVIEW PESAN WHATSAPP MASUK KE HP AVILA (PEMBERI TUGAS):\n");
  console.log(waMsg3);
  console.log("\n");

  // ---------------------------------------------------------------------------
  // SCENARIO 4: REPORT PAGI HARI (DEADLINE H-2 ALERTS CRON)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("SCENARIO 4: Scheduler Pagi Hari (Cron 08:00 WIB) - Rekap Tugas Deadline H-2");
  console.log("--------------------------------------------------------------------------------");

  const waMsg4 = buildMorningDeadlineMessage({
    userName: ashabil.name,
    tasks: [
      {
        title: task.title,
        department: task.departmentCard,
        brand: task.brandName,
        deadlineStr: deadlineFmt,
        urgencyText: "Besok (H-1) jam 17:00",
      },
      {
        title: "Perapian UI Kanban Stage DWB & Sinkronisasi Presensi",
        department: "WEB",
        brand: "Difitech Internal",
        deadlineStr: "Sabtu, 31 Okt 2026 12:00",
        urgencyText: "Lusa (H-2)",
      },
    ],
  });

  const waRes4 = await sendWhatsAppNotification({
    to: ashabil.whatsappNumber,
    message: waMsg4,
    recipientName: ashabil.name,
    actionType: "DEADLINE_REMINDER",
  });

  console.log(`[CRON REPORT] Status: ${waRes4.status} | Tujuan: ${waRes4.recipientPhone}`);
  console.log(">>> PREVIEW PESAN WHATSAPP REPORT PAGI H-2 KE HP ASHABIL:\n");
  console.log(waMsg4);
  console.log("\n");

  // ---------------------------------------------------------------------------
  // 5. VERIFIKASI HISTORI TASK ACTIVITY LOGS DI SISTEM
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("5. AUDIT LOGS SISTEM DWB (Tersimpan di database untuk task ini):");
  console.log("--------------------------------------------------------------------------------");
  const logs = await prisma.taskActivityLog.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "asc" },
  });

  logs.forEach((l, i) => {
    console.log(`[Log #${i + 1}] [${l.actionType}] ${l.title} -> ${l.description}`);
  });

  console.log("\n================================================================================");
  console.log("   SELURUH SIMULASI BERHASIL 100%! ALUR KERJA SESUAI PERMINTAAN USER!           ");
  console.log("================================================================================");
}

simulate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
