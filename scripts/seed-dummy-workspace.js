const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding realistic cross-department workspace tasks...");

  // Fetch users
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.error("No users found in database!");
    return;
  }

  const findUser = (namePrefix) => {
    return users.find((u) => u.name.toLowerCase().includes(namePrefix.toLowerCase())) || users[0];
  };

  const ashabil = findUser("Ashabil");
  const danar = findUser("Danar");
  const nida = findUser("Nida");
  const avila = findUser("Avila");
  const muditha = findUser("Muditha");
  const dewi = findUser("Dewi");
  const rima = findUser("Rima");
  const fajar = findUser("Fajar");
  const wijaya = findUser("Wijaya");
  const admin = findUser("Admin");

  console.log("Team mapped:", {
    ashabil: ashabil.name,
    danar: danar.name,
    nida: nida.name,
    avila: avila.name,
    muditha: muditha.name,
    dewi: dewi.name,
    wijaya: wijaya.name,
  });

  const now = new Date();
  const addHours = (h) => new Date(now.getTime() + h * 3600 * 1000);
  const addDays = (d) => new Date(now.getTime() + d * 24 * 3600 * 1000);

  // 1. Data 6 Card Divisi (Regular Working Tasks)
  const regularTasks = [
    // --- CARD SEO ---
    {
      title: "Riset Keyword Intent Komersial 'Software HRIS Indonesia 2026'",
      description: "<p>Mas Danar, tolong riset keyword intent komersial untuk landing page HRIS baru. Fokus pada search volume & low difficulty keyword.</p><ul><li>Keyword list minimal 20 keyword</li><li>Rekomendasi H1 & meta title</li><li>Competitor gap analysis</li></ul>",
      departmentCard: "SEO",
      brandName: "Difitech HRIS",
      creatorId: ashabil.id,
      userId: danar.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(2),
      suggestedDeadline: addDays(3),
      suggestionReason: "Perlu waktu ekstra untuk crawl data backlink kompetitor utama",
      suggestionStatus: "PENDING",
      isContentProduction: false,
      followUpMessage: "Halo mas Danar, apakah data kompetitor sudah siap di-review?",
    },
    {
      title: "Audit Technical SEO & Perbaikan Sitemap XML",
      description: "<p>Pembersihan broken links (404), optimasi canonical tag, dan update sitemap XML dinamis untuk seluruh halaman baru.</p>",
      departmentCard: "SEO",
      brandName: "Tadashi AI",
      creatorId: danar.id,
      userId: danar.id, // Self-assigned
      status: "COMPLETED",
      priority: "MEDIUM",
      expectedDeadline: addDays(-1),
      isContentProduction: false,
    },
    {
      title: "Penulisan 3 Artikel Pilar Edukasi: 'Efisiensi Absensi GPS'",
      description: "<p>Draft artikel 1.500 kata mencakup studi kasus kecurangan presensi manual dan keunggulan teknologi GPS CamStamp.</p>",
      departmentCard: "SEO",
      brandName: "Difitech HRIS",
      creatorId: danar.id,
      userId: rima.id,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      expectedDeadline: addDays(4),
      isContentProduction: false,
    },

    // --- CARD WEB ---
    {
      title: "Buat Landing Page Promo 'Flash Sale Payroll 11.11'",
      description: "<p>Mas Ashabil, tolong dibantu buatkan landing page konversi tinggi untuk campaign Ads bulan depan. Wireframe sudah disiapkan oleh tim desain.</p><blockquote>Target live tanggal 28 Oktober untuk verifikasi tracking Pixel & GTM.</blockquote>",
      departmentCard: "WEB",
      brandName: "Difitech HRIS",
      creatorId: muditha.id,
      userId: ashabil.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      expectedDeadline: addDays(3),
      isContentProduction: false,
      followUpMessage: "Mas Ashabil, apakah mockup figma sudah bisa diakses tim developer?",
    },
    {
      title: "Integrasi Webhook Auto-Generate Slip Gaji PDF",
      description: "<p>Selesaikan endpoint webhook agar saat payroll disetujui, PDF slip gaji karyawan otomatis ter-generate dan siap di-download.</p>",
      departmentCard: "WEB",
      brandName: "Internal",
      creatorId: ashabil.id,
      userId: fajar.id,
      status: "PENDING",
      priority: "HIGH",
      expectedDeadline: addDays(5),
      isContentProduction: false,
    },
    {
      title: "Optimasi Core Web Vitals & Loading Speed Dashboard",
      description: "<p>Perbaikan LCP di bawah 1.5s dengan kompresi asset gambar dan dynamic bundle splitting.</p>",
      departmentCard: "WEB",
      brandName: "Tadashi AI",
      creatorId: ashabil.id,
      userId: ashabil.id, // Self-assigned
      status: "COMPLETED",
      priority: "MEDIUM",
      expectedDeadline: addDays(-2),
      isContentProduction: false,
    },

    // --- CARD ADS ---
    {
      title: "Scale Up Meta Ads Campaign - Lead Generation B2B",
      description: "<p>Naikkan budget harian ke Rp 2.500.000 untuk campaign lookalike audience HRD & Business Owner.</p><p>Target CPL di bawah Rp 35.000 per valid lead.</p>",
      departmentCard: "ADS",
      brandName: "Difitech HRIS",
      creatorId: wijaya.id,
      userId: muditha.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(1),
      isContentProduction: false,
      followUpMessage: "Mbak Muditha, tolong pantau ROAS dan frequency ads setelah scaling ya.",
    },
    {
      title: "Setup Google Search Ads Campaign - Keyword Brand & Competitor",
      description: "<p>Konfigurasi ad group, negative keywords, dan sitelink extension untuk penelusuran kata kunci HRIS.</p>",
      departmentCard: "ADS",
      brandName: "Difitech HRIS",
      creatorId: muditha.id,
      userId: rima.id,
      status: "PENDING",
      priority: "MEDIUM",
      expectedDeadline: addDays(4),
      isContentProduction: false,
    },
    {
      title: "A/B Testing Creative Video vs Carousel Ads",
      description: "<p>Evaluasi perbandingan CTR antara format reels review vs slide testimoni selama 7 hari penayangan.</p>",
      departmentCard: "ADS",
      brandName: "Carenzakids",
      creatorId: muditha.id,
      userId: muditha.id, // Self
      status: "COMPLETED",
      priority: "MEDIUM",
      expectedDeadline: addDays(-1),
      isContentProduction: false,
    },

    // --- CARD MARKETPLACE ---
    {
      title: "Dekorasi Toko & Setup Promo Campaign Mega Sale 11.11",
      description: "<p>Setup voucher toko diskon 20%, banner toko utama, dan bundle hemat untuk produk terlaris di Shopee & Tokopedia.</p>",
      departmentCard: "MARKETPLACE",
      brandName: "Carenzakids",
      creatorId: muditha.id,
      userId: dewi.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      expectedDeadline: addDays(2),
      isContentProduction: false,
      followUpMessage: "Mbak Dewi, jangan lupa kuota flash sale di-lock sebelum batas submit.",
    },
    {
      title: "Upload & Sinkronisasi 35 Master SKU Koleksi Terbaru",
      description: "<p>Input variasi warna, size chart, dan foto produk beresolusi tinggi ke TikTok Shop & Tokopedia.</p>",
      departmentCard: "MARKETPLACE",
      brandName: "Zamrud",
      creatorId: dewi.id,
      userId: dewi.id, // Self
      status: "PENDING",
      priority: "MEDIUM",
      expectedDeadline: addDays(3),
      isContentProduction: false,
    },
    {
      title: "Audit Performa Chat Response & Evaluasi Toko Star Seller",
      description: "<p>Pertahankan performa chat di atas 95% dan perbaiki ulasan produk bintang 3 ke bawah.</p>",
      departmentCard: "MARKETPLACE",
      brandName: "Carenzakids",
      creatorId: wijaya.id,
      userId: dewi.id,
      status: "COMPLETED",
      priority: "LOW",
      expectedDeadline: addDays(-3),
      isContentProduction: false,
    },

    // --- CARD HR ---
    {
      title: "Penyusunan Jadwal & Onboarding 3 Karyawan Baru Batch Nov",
      description: "<p>Siapkan laptop, akun email kantor, hak akses HRIS, dan modul pengenalan budaya perusahaan untuk divisi Engineering & Kreatif.</p>",
      departmentCard: "HR",
      brandName: "Internal",
      creatorId: admin.id,
      userId: wijaya.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(4),
      isContentProduction: false,
    },
    {
      title: "Review Evaluasi Kinerja & KPI Tim Engineering Q3",
      description: "<p>Mas Ashabil, mohon review pencapaian sprint, delivery rate, dan evaluasi tim pengembang kuartal ini sebelum tanggal 30.</p>",
      departmentCard: "HR",
      brandName: "Internal",
      creatorId: wijaya.id,
      userId: ashabil.id,
      status: "PENDING",
      priority: "HIGH",
      expectedDeadline: addDays(5),
      isContentProduction: false,
      followUpMessage: "Mas Ashabil, mohon rekap penilaian kpi anggota tim ya.",
    },
    {
      title: "Pembaruan Kebijakan Jam Kerja Fleksibel & Form Lembur",
      description: "<p>Penyusunan draf SOP approval lembur baru yang terintegrasi otomatis ke sistem payroll bulanan.</p>",
      departmentCard: "HR",
      brandName: "Internal",
      creatorId: wijaya.id,
      userId: wijaya.id, // Self
      status: "COMPLETED",
      priority: "MEDIUM",
      expectedDeadline: addDays(-2),
      isContentProduction: false,
    },

    // --- CARD SOSMED (REGULAR) ---
    {
      title: "Penyusunan Kalender Konten Mingguan (28 Okt - 3 Nov)",
      description: "<p>Rencanakan 5 postingan feed, 7 reels/tiktok, dan daily instagram story seputar tips manajemen SDM.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: nida.id,
      userId: nida.id, // Self
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(2),
      isContentProduction: false,
    },
    {
      title: "Analisis & Laporan Engagement Instagram Bulan Oktober",
      description: "<p>Kompilasi data reach, save, share, dan follower growth per kategori konten edukasi vs promosi.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: wijaya.id,
      userId: nida.id,
      status: "COMPLETED",
      priority: "MEDIUM",
      expectedDeadline: addDays(-1),
      isContentProduction: false,
    },
  ];

  // 2. Data Kanban Content Production (Tim Sosmed - 6 Tahap Produksi)
  const contentTasks = [
    // --- STAGE 1: CONTENT_BRIEF ---
    {
      title: "Script Video Reels: 'Solusi Sakit Kepala HRD Saat Rekap Absensi Manual'",
      description: "<p><strong>Hook (0-3 detik):</strong> <em>'Masih jaman rekap absen pakai Excel sampai lembur jam 9 malam?'</em></p><p><strong>Problem:</strong> Rekap sidik jari sering rusak, absensi kertas rawan titip absen.</p><p><strong>Solution:</strong> Fitur GPS CamStamp & Selfie anti-fake GPS di HRIS Difitech langsung rekap otomatis tanpa kecurangan.</p><p><strong>CTA:</strong> Klik link bio untuk coba demo gratis 14 hari.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: muditha.id,
      userId: nida.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(3),
      isContentProduction: true,
      kanbanStage: "CONTENT_BRIEF",
      followUpMessage: "Mbak Nida, script reels hook pembuka sudah siap di-review tim marketing?",
    },
    {
      title: "Konsep Video Series: 'A Day in My Life as Remote Software Engineer'",
      description: "<p>Format video santai estetik memperlihatkan alur kerja fleksibel karyawan dengan presensi mobile dan pantau tugas di Difitech HRIS.</p>",
      departmentCard: "SOSMED",
      brandName: "Tadashi AI",
      creatorId: ashabil.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      expectedDeadline: addDays(4),
      isContentProduction: true,
      kanbanStage: "CONTENT_BRIEF",
    },

    // --- STAGE 2: SHOOTING ---
    {
      title: "Take Video B-Roll Suasana Kolaborasi Kantor & Daily Routine",
      description: "<p>Pengambilan footage kantor: meeting santai di lounge, tapping presensi selfie mobile, dan interaksi seru tim kerja.</p><ul><li>Kamera: 4K 60fps untuk transisi slow-motion</li><li>Lighting natural + ring light</li><li>15 scene shot list siap dieksekusi</li></ul>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: nida.id,
      userId: nida.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(2),
      isContentProduction: true,
      kanbanStage: "SHOOTING",
    },
    {
      title: "Shooting Podcast Interview Ep. 4: 'Tantangan Retensi Karyawan Gen Z'",
      description: "<p>Sesi interview 20 menit bersama narasumber HR Consultant membahas loyalitas kerja dan sistem reward modern.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: wijaya.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      expectedDeadline: addDays(3),
      isContentProduction: true,
      kanbanStage: "SHOOTING",
    },

    // --- STAGE 3: DESIGN ---
    {
      title: "Desain Carousel Instagram: '5 Tanda Perusahaanmu Butuh Sistem HRIS Otomatis'",
      description: "<p>Desain grafis 6 slide carousel (1080x1350px). Menggunakan palet brand Difitech (Merah, Slate gelap, dan layout modern clean).</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: danar.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      expectedDeadline: addDays(1),
      isContentProduction: true,
      kanbanStage: "DESIGN",
      followUpMessage: "Mas Avila, slide 1 cover tolong dibuatkan visual headline yang lebih bold ya.",
    },
    {
      title: "Desain Feed & Story Pengumuman Pemenang Giveaway Oktober",
      description: "<p>Layout feed pengumuman pemenang e-wallet dengan layout festive & branding Difitech.</p>",
      departmentCard: "SOSMED",
      brandName: "Carenzakids",
      creatorId: nida.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "LOW",
      expectedDeadline: addDays(2),
      isContentProduction: true,
      kanbanStage: "DESIGN",
    },

    // --- STAGE 4: VIDEO_EDITING ---
    {
      title: "Editing Video Reels Edukasi: 'Cara Kerja Anti Fake GPS CamStamp'",
      description: "<p>Gabungkan screen recording aplikasi mobile HRIS dengan footage talent. Tambahkan efek suara glitch saat mock location terdeteksi, teks caption dinamis ala Alex Hormozi, dan backsound upbeat.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: ashabil.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addDays(2),
      isContentProduction: true,
      kanbanStage: "VIDEO_EDITING",
      followUpMessage: "Bagian pop-up warning fake location tolong dikasih efek suara glitch ya mas Avila.",
    },

    // --- STAGE 5: REVISION ---
    {
      title: "Video Review Klien PT Sinar Terang - Modul Payroll Otomatis",
      description: "<p>Video testimoni implementasi modul payroll dan slip gaji digital Difitech.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: muditha.id,
      userId: nida.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      expectedDeadline: addHours(24),
      isContentProduction: true,
      kanbanStage: "REVISION",
      revisionTag: "Revisi VO & Durasi Hook",
      revisionNote: "Tolong intro dipercepat 2 detik agar hook langsung nendang, dan suara voiceover di menit 0:45 dinaikkan +3dB karena agak tertutup musik.",
    },

    // --- STAGE 6: APPROVAL ---
    {
      title: "Teaser Motion Video: Launching Fitur Task Radar & Workspace HRIS",
      description: "<p>Video animasi 30 detik untuk feed Instagram & LinkedIn. Final render sudah selesai di-upload ke drive dan menunggu approval akhir dari management.</p>",
      departmentCard: "SOSMED",
      brandName: "Difitech HRIS",
      creatorId: ashabil.id,
      userId: avila.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      expectedDeadline: addHours(12),
      isContentProduction: true,
      kanbanStage: "APPROVAL",
      deliverableUrl: "https://drive.google.com/file/d/difitech-task-radar-teaser-final/view",
    },
  ];

  const allTasksToCreate = [...regularTasks, ...contentTasks];

  let createdCount = 0;
  for (const item of allTasksToCreate) {
    const { followUpMessage, ...taskData } = item;

    const task = await prisma.task.create({
      data: taskData,
    });
    createdCount++;

    // Add follow-up if specified
    if (followUpMessage) {
      await prisma.taskFollowUp.create({
        data: {
          taskId: task.id,
          senderId: task.creatorId,
          recipientId: task.userId,
          message: followUpMessage,
          createdAt: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hours ago
        },
      });
    }

    // Add Notification for assignee
    if (task.creatorId !== task.userId) {
      await prisma.notification.create({
        data: {
          userId: task.userId,
          title: `Tugas Baru: ${task.title}`,
          message: `Anda ditugaskan pada tugas '${task.title}' oleh rekan kerja.`,
          type: "TASK_ASSIGNED",
          taskId: task.id,
          link: task.isContentProduction ? "/dashboard/content-production" : "/dashboard/workspace",
          createdAt: new Date(),
        },
      });
    }
  }

  console.log(`Success! Created ${createdCount} realistic dummy tasks with follow-ups & notifications.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
