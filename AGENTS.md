# Antigravity Operational Rules & SOP Double-Check

## 🛡️ SOP WAJIB: DOUBLE-CHECK SETIAP SELESAI KERJA

Setiap kali menyelesaikan pekerjaan (task baru, refactor, bugfix, atau perubahan kode apapun), agen WAJIB menjalankan 5 tahapan SOP Double-Check secara berurutan sebelum menyatakan pekerjaan selesai kepada pengguna:

### 1. Diff & Integrity Inspection (`git diff`)
- Selalu tinjau `git diff` untuk memastikan setiap baris yang dimodifikasi sesuai dengan rencana.
- Pastikan tidak ada deklarasi state (`useState`), helper, props komponen, atau imports yang terhapus secara tidak sengaja saat melakukan replace chunk.

### 2. Strict Type & Build Check (`npx tsc --noEmit` & `npm run build`)
- Validasi seluruh codebase dengan `npx tsc --noEmit` (harus exit code 0 / zero error).
- Pastikan `typescript.ignoreBuildErrors` di `next.config.mjs` tetap `false` agar tidak ada error TypeScript yang terlewat.
- Jalankan `npm run build` untuk memverifikasi proses bundling Next.js, static page generation, dan chunk optimization.

### 3. VPS Synchronization (`rsync`)
- Sinkronkan kode terbaru ke VPS staging:
  `rsync -avz --delete -e "ssh -i ~/.ssh/vps_deploy_key" src/ root@31.97.220.128:/opt/staging-hris-difitech/src/`
  serta file konfigurasi pendukung (`next.config.mjs`, `tsconfig.json`, dll).

### 4. Container Rebuild & Service Reload
- Rebuild dan restart container aplikasi staging di VPS:
  `ssh -i ~/.ssh/vps_deploy_key root@31.97.220.128 "cd /opt/staging-hris-difitech && docker compose -f docker-compose.staging.yml build staging-hris-app && docker compose -f docker-compose.staging.yml up -d staging-hris-app"`

### 5. Live Endpoint & Health Double-Check
- Verifikasi status HTTP endpoint di VPS (port 3005):
  `curl -sI http://127.0.0.1:3005/login`
  `curl -sI http://127.0.0.1:3005/dashboard/workspace`
- Pastikan response mengembalikan `HTTP/1.1 200 OK` dan log container tidak terdapat runtime crash.
