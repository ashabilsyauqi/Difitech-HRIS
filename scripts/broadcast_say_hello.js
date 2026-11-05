const targets = [
  { name: 'Danar', phone: '6282282301764' },
  { name: 'Muditha', phone: '6287888636372' },
  { name: 'Fadhil', phone: '6287888636372' },
  { name: 'Siswandi', phone: '6287733516564' },
  { name: 'Nadya', phone: '6285280679649' },
  { name: 'Avila', phone: '62895326674005' },
  { name: 'Wijaya', phone: '628111099978' },
  { name: 'Zain', phone: '6289658318062' },
];

const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'difitech_waha_secret_2026';

async function checkStatus() {
  const res = await fetch(`${WAHA_URL}/api/sessions/default`, {
    headers: { 'X-Api-Key': WAHA_API_KEY }
  });
  return res.json();
}

async function sendGreeting(target) {
  const message = 
`Halo *${target.name}*! 👋

Saya adalah *DIFITECH WORK FLOW Agent* (Asisten Virtual Difitech Workboard).

📌 *Peran & Tugas Saya:*
Saya bertugas menyampaikan informasi dan pembaruan seputar alur kerja kamu di Difitech secara real-time langsung ke WhatsApp ini, antara lain:
• 📋 Penugasan tugas baru & instruksi pengerjaan (brief)
• 🔄 Update revisi, catatan, dan approval hasil kerja
• 💬 Notifikasi diskusi & mention dari rekan tim
• ⏰ Pengingat (reminder) deadline serta follow-up progres

Mulai sekarang, akun kamu di *Difitech Workboard* (https://difworkboard.difitech.id) telah resmi terhubung dengan nomor ini.

Semangat berkarya dan selamat beraktivitas bersama tim Difitech! 🚀✨`;

  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': WAHA_API_KEY
    },
    body: JSON.stringify({
      session: 'default',
      chatId: `${target.phone}@c.us`,
      text: message
    })
  });
  return res.json();
}

async function waitForWorking() {
  console.log('Listening for WhatsApp bot pairing on ' + WAHA_URL + '...');
  let attempts = 0;
  while (attempts < 600) { // Listen up to 30 minutes
    try {
      const status = await checkStatus();
      if (status.status === 'WORKING') {
        console.log(`\n🎉 Bot connected successfully as: ${status.me?.id} (${status.me?.pushName || 'Bot'})`);
        return status;
      }
      process.stdout.write(`.`);
    } catch (err) {
      process.stdout.write(`x`);
    }
    attempts++;
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Timeout waiting for WhatsApp bot pairing.');
}

async function main() {
  try {
    const status = await waitForWorking();
    console.log('\nStarting broadcast greeting messages to team members...\n');

    for (const t of targets) {
      try {
        console.log(`[${new Date().toISOString()}] Sending to ${t.name} (${t.phone})...`);
        const res = await sendGreeting(t);
        if (res.id || res.status === 'success') {
          console.log(`✅ Success for ${t.name}: ID ${res.id || 'OK'}`);
        } else {
          console.log(`⚠️ Response for ${t.name}:`, JSON.stringify(res));
        }
        await new Promise(r => setTimeout(r, 2000)); // 2s pacing
      } catch (err) {
        console.error(`❌ Failed sending to ${t.name}:`, err.message);
      }
    }

    console.log('\n🎉 Selesai! Seluruh pesan Say Hello DIFITECH WORK FLOW Agent telah dikirimkan.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

main();
