const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config", "features.json");

function getFlags() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (e) {}
  return { allowRetakeClockInPhoto: true };
}

function setFlags(flags) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(flags, null, 2), "utf-8");
}

const arg = (process.argv[2] || "").toLowerCase();

if (arg === "off" || arg === "disable" || arg === "false" || arg === "mati") {
  setFlags({ allowRetakeClockInPhoto: false });
  console.log("\n🔒 FITUR FOTO ULANG MASUK BERHASIL DINONAKTIFKAN (OFF)!");
  console.log("   - Tombol 'Foto Ulang Masuk' di dashboard otomatis disembunyikan.");
  console.log("   - Endpoint retake-photo dikunci oleh sistem.");
  console.log("\nJalankan 'npx pm2 restart all' jika ingin menerapkan instan.\n");
} else if (arg === "on" || arg === "enable" || arg === "true" || arg === "hidup") {
  setFlags({ allowRetakeClockInPhoto: true });
  console.log("\n🔓 FITUR FOTO ULANG MASUK BERHASIL DIAKTIFKAN (ON)!");
  console.log("   - Karyawan dapat mengambil foto ulang dengan stempel jam masuk pagi.");
  console.log("\nJalankan 'npx pm2 restart all' jika ingin menerapkan instan.\n");
} else {
  const flags = getFlags();
  console.log(`\n📋 STATUS FITUR FOTO ULANG MASUK (RE-CAMSTAMP): [ ${flags.allowRetakeClockInPhoto ? "AKTIF / ON 🟢" : "NONAKTIF / OFF 🔴"} ]\n`);
  console.log("Gunakan perintah berikut untuk mengubah status:");
  console.log("  - Matikan: node scripts/toggle-retake-feature.js off");
  console.log("  - Hidupkan: node scripts/toggle-retake-feature.js on\n");
}
