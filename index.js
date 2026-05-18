const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');

// ==================== KİŞİSELLEŞTİRME ALANI (GÜVENLİ MODEL) ====================
 const TELEFON_NUMARASI = process.env.TELEFON_NUMARASI; // Örn: 905XXXXXXXXX
const ALICI_ISMI = process.env.ALICI_ISMI || 'Sümeyye';
const GONDERIM_SAATI = process.env.GONDERIM_SAATI || '30 07 * * *'; // Varsayılan sabah 07:30
 // ===============================================================================

const iltifatHavuzu = [
    "Güne huzurla başlamanızı diler, kalbinizdeki tüm hayırlı duaların kabul olmasını temenni ederim. ✨",
    "İçinizdeki o naif ve güzel kalbin ışığı, attığınız her adımda yolunuzu aydınlatsın. 🌟",
    "Yeni günün size sükunet, bereket ve gönül ferahlığı getirmesini dilerim. 💖",
    "Samimiyetiniz ve vakur duruşunuzla hayatın getireceği tüm güzellikleri hak ediyorsunuz. 🌸",
    "Gününüz hayırlı, adımlarınız sağlam, gönlünüz her daim huzurlu olsun. 💕"
];

const evlilikMesajlari = [
    { tur: "📖 Ayet-i Kerime", metin: "«Kendileri ile huzur bulasınız diye size kendi nefsinizden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O’nun delillerindendir.»", kaynak: "Rûm Suresi, 21" },
    { tur: "💬 Hadis-i Şerif", metin: "«Evlilik benim sünnetimdir. Kim benim sünnetimle amel etmezse benden değildir. Evleniniz...»", kaynak: "İbn Mâce, Nikâh, 1" },
    { tur: "💬 Hadis-i Şerif", metin: "«Sizin en hayırlınız, eşine (ailesine) karşı en hayırlı olanınızdır...»", kaynak: "Tirmizî, Radâ, 11" },
    { tur: "📖 Ayet-i Kerime", metin: "«...Onlar, sizin için birer elbise (örtü); siz de onlar için birer elbisesiniz (örtüsünüz)...»", kaynak: "Bakara Suresi, 187" },
    { tur: "💬 Hadis-i Şerif", metin: "«Mümin, Allah’a takvadan sonra en çok saliha bir eşten hayır görür.»", kaynak: "İbn Mâce, Nikâh, 5" }
];

// Docker/Railway ortamında Puppeteer'ın sorunsuz çalışması için gerekli argümanlar
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable', // Docker içindeki Chrome yolu
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('🤖 Sunucuda QR kod üretildi. Ancak yerelde giriş yaptığınız için bu adımı atlamış olmanız gerekir:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(`✅ Asistan Aktif! ${ALICI_ISMI} için mesajlaşma sistemi kuruldu.`);
});

async function mesajIcerigiOlustur() {
    return `test`;
}

cron.schedule(GONDERIM_SAATI, async () => {
    if (!TELEFON_NUMARASI) return console.log("❌ TELEFON_NUMARASI ortam değişkeni eksik!");
    const anaMesaj = await mesajIcerigiOlustur();
    if (anaMesaj) {
        await client.sendMessage(`${TELEFON_NUMARASI}@c.us`, anaMesaj);
        console.log(`🚀 Mesaj başarıyla iletildi.`);
    }
});

client.on('message', async (msg) => {
    const gelenMesaj = msg.body.toLowerCase().trim();
    const hedefChatId = `${TELEFON_NUMARASI}@c.us`;

    if (msg.from === hedefChatId && (gelenMesaj === '!kombin' || gelenMesaj === '!hava')) {
        await msg.reply('🤖 Kombin reçeten hemen hazırlanıyor, bir saniye... ⏳');
        const anlikMesaj = await mesajIcerigiOlustur();
        if (anlikMesaj) await client.sendMessage(hedefChatId, anlikMesaj);
    }
});

client.initialize();