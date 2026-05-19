const {Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');

const SEHIR = 'istanbul';
const TELEFON_NUMARASI = '905387672037'; //905319161340   905387672037
//const GONDERIM_SAATI = '30 07 * * *';
const GONDERIM_SAATI = '* * * * *';
const HEDEF_TARIH = '2026-06-06';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('🤖 WhatsApp Girişi İçin Aşağıdaki QR Kodu Taratın:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ WhatsApp Asistanı Hazır ve Arka Planda Çalışıyor!');
    console.log(`⏰ Her sabah saat 07:30'da ${SEHIR.toUpperCase()} için kombin önerisi gönderilecek.`);
});

const evlilikMesajlari = [
    {
        tur: "💬 Hadis-i Şerif",
        metin: "«Evlilik benim sünnetimdir. Kim benim sünnetimle amel etmezse benden değildir. Evleniniz, çünkü ben diğer ümmetlere karşı sizin çokluğunuzla iftihar edeceğim.»",
        kaynak: "İbn Mâce, Nikâh, 1"
    },
    {
        tur: "💬 Hadis-i Şerif",
        metin: "«Sizin en hayırlınız, eşine (ailesine) karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.»",
        kaynak: "Tirmizî, Radâ, 11"
    },
    {
        tur: "📖 Ayet-i Kerime",
        metin: "«...Onlar, sizin için birer elbise (örtü); siz de onlar için birer elbisesiniz (örtüsünüz)...»",
        kaynak: "Bakara Suresi, 187"
    },
    {
        tur: "💬 Hadis-i Şerif",
        metin: "«Mümin, Allah’a takvadan sonra en çok saliha bir eşten hayır görür.»",
        kaynak: "İbn Mâce, Nikâh, 5"
    }
];


function dailyHadith() {
    const randIndex = Math.floor(Math.random() * evlilikMesajlari.length)
    return evlilikMesajlari[randIndex];
}

function meetDayCounter() {
    const hedef = new Date(HEDEF_TARIH);
    const today = new Date();
    const bugununTarihi = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Saat farkından etkilenmemek için
    const hedefTarihYalin = new Date(hedef.getFullYear(), hedef.getMonth(), hedef.getDate());

    const farkZaman = hedefTarihYalin - bugununTarihi;
    const kalanGun = Math.ceil(farkZaman / (1000 * 60 * 60 * 24));

    let geriSayimMesaji = "";
    if (kalanGun > 0) {
        geriSayimMesaji = `🕊️ *İlk Görüşmemize:* ${kalanGun} gün kaldı. Hayırlara vesile olmasını ve güzel bir başlangıca kapı aralamasını temenni ediyorum.`;
    } else if (kalanGun === 0) {
        geriSayimMesaji = `✨ *Buluşma Günü:* Nasip olursa bugün ilk defa bir araya geleceğiz. Niyetimizin hayır, akıbetimizin de hayır olmasını dilerim. Heyecanımı ve duamı paylaşıyorum.`;
    } else {
        geriSayimMesaji = `🌸 Tanışmış olmanın ve bu güzel yolda adım atmanın huzuru üzerimizde olsun.`;
    }

    return geriSayimMesaji
}

function selectOutfitSuggestion(temprature) {
    let outfitSuggestion = "";

    if (temprature < 5) {
        outfitSuggestion = "🥶 *Lahanaya dönme vakti!* Hava buz gibi. En kalın montunu giy, atkı ve bereni sakın evde unutma.";
    } else if (temprature >= 5 && temprature < 12) {
        outfitSuggestion = "js 🧥 *Klasik Kış Modu.* Kalın kazaklar ve kışlık kabanın günü. Ayaklarını sıcak tutacak botları tercih et.";
    } else if (temprature >= 12 && temprature < 18) {
        outfitSuggestion = "🧥 *Akıllı Katmanlar!* Bu hava adamı aldatır. Kat kat giyin ki öğlen sıcaklarsan çıkarasın. Deri ceket veya trençkot harika olur.";
    } else if (temprature >= 18 && temprature < 24) {
        outfitSuggestion = "👚 *Tatlı Bahar Esintisi.* Hafif bir sweatshirt, denim ceket veya uzun kollu şık bir gömlek tam bugünün havası.";
    } else {
        outfitSuggestion = "☀️ *Tiril Tiril Yaz!* Hava harika. Tişörtünü, keten pantolonunu veya en sevdiğin elbiseni giy. Güneş gözlüğünü unutma!";
    }

    return outfitSuggestion
}

function alarm(rainfall, uvIndex) {
    // 🌧️ Akıllı Yağmur ve 🧴 UV Kremi Alarmları
    let smartNotes = "";
    if (rainfall > 0.1) {
        smartNotes += "\n⚠️ *Önemli:* Bugün yağmur geçişleri görünüyor, yanına mutlaka şemsiye alman iyi olabilir! 🌧️";
    }
    if (uvIndex >= 3) {
        smartNotes += "\n☀️ *Cilt Bakımı:* Bugün UV indeksi biraz yüksek, güneş kremini sürmeden evden çıkma lütfen.";
    }

    return smartNotes
}

async function kombinGonder() {
    try {
        const url = `https://wttr.in/${SEHIR}?format=j1`;
        const cevap = await axios.get(url);
        const veri = cevap.data;

        const temprature = parseInt(veri.current_condition[0].temp_C); // gerçek sıcaklık
        const weather = veri.current_condition[0].weatherDesc[0].value; // hava durumu
        const perceivedTemperature = parseInt(veri.current_condition[0].FeelsLikeC); // Hissedilen Sıcaklık
        const rainfall = parseFloat(veri.current_condition[0].precipMM); // Yağış Miktarı
        const uvIndex = parseInt(veri.current_condition[0].uvIndex); // UV İndeksi

        let outfitSuggestion = selectOutfitSuggestion(temprature);
        
        let smartNotes = alarm(rainfall, uvIndex)//🌧️ Akıllı Yağmur ve 🧴 UV Kremi Alarmları
        const hadith = dailyHadith(); // günlük hadis
        const counterMessage = meetDayCounter();  // buluşma günü sayacı

        // Hafta Sonu Kontrolü
        const today = new Date();
        const isWeekend = [0, 6].includes(today.getDay());

        let message = ""
        if (isWeekend) {
            message = 'Günaydın! ☀️ Harika bir gün geçirmen dileğiyle.';
        } else {
            message = `Hayırlı Sabahlar! ☀️\n\n` +
                `📍 *Konum:* ${SEHIR.toUpperCase()}\n` +
                `🌡️ *Hissedilen Hava:* ${perceivedTemperature}°C (Gerçek: ${temprature}°C - ${weather})\n\n` +
                `👗 *Bugünkü Kombin Reçeten:*\n${outfitSuggestion}${smartNotes}\n\n` +
                `*${hadith.tur}:*\n${hadith.metin}\n_(${hadith.kaynak})_\n\n` +
                `${counterMessage}\n\nHarika bir gün geçirmen dileğiyle! ✨`;
        }

        const chatId = `${TELEFON_NUMARASI}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`🚀 Mesaj başarıyla gönderildi: ${new Date().toLocaleTimeString()}`);

    } catch (hata) {
        console.error('❌ Hava durumu veya message gönderme hatası:', hata);
    }
}

cron.schedule(GONDERIM_SAATI, () => {
    console.log('⏰ Zamanı geldi, hava durumu kontrol ediliyor...');
    kombinGonder();
});
client.initialize()

