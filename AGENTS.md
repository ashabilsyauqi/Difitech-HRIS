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

### 3. VPS Synchronization & Git Branch Integrity
- **PENTING: Bedakan HRIS dan DWB**:
  - **HRIS Production** (`https://hris.difitech.id`):
    - Direktori: `/opt/hris-difitech`
    - Git Branch: `main`
    - Container: `difitech-hris-app` (Port 3000)
  - **DWB (DifWorkBoard)** (`https://difworkboard.difitech.id`):
    - Direktori: `/opt/staging-hris-difitech`
    - Git Branch: `difworkboard`
    - Container: `staging-difitech-hris-app` (Port 3005)
- **JANGAN PERNAH** melakukan rsync lintas branch (`src/` dari `main` ke direktori DWB atau sebaliknya).
- Selalu gunakan `git push origin <branch>` dan di VPS jalankan `git pull` sesuai direktori masing-masing:
  - Untuk HRIS: `cd /opt/hris-difitech && git pull origin main`
  - Untuk DWB: `cd /opt/staging-hris-difitech && git pull origin difworkboard`

### 4. Container Rebuild & Service Reload
- Rebuild container sesuai target perubahan:
  - **Jika update HRIS**:
    `ssh -i ~/.ssh/vps_deploy_key root@31.97.220.128 "cd /opt/hris-difitech && docker compose build hris-app && docker compose up -d hris-app"`
  - **Jika update DWB**:
    `ssh -i ~/.ssh/vps_deploy_key root@31.97.220.128 "cd /opt/staging-hris-difitech && docker compose -f docker-compose.staging.yml build staging-hris-app && docker compose -f docker-compose.staging.yml up -d staging-hris-app"`

### 5. Live Endpoint & Health Double-Check
- Verifikasi status HTTP endpoint di VPS:
  - HRIS: `curl -sI https://hris.difitech.id/login` (Port 3000)
  - DWB: `curl -sI https://difworkboard.difitech.id/login` dan `curl -sI http://127.0.0.1:3005/dashboard/workspace` (Port 3005)
- Pastikan kedua response mengembalikan `HTTP/1.1 200 OK` dan layout/sidebar masing-masing sistem tidak tertukar.
