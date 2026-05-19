const {Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');

const SEHIR = 'istanbul';
const TELEFON_NUMARASI = '905387672037';
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
        tur: "Hadis-i Şerif",
        metin: "«Evlilik benim sünnetimdir. Kim benim sünnetimle amel etmezse benden değildir. Evleniniz, çünkü ben diğer ümmetlere karşı sizin çokluğunuzla iftihar edeceğim.»",
        kaynak: "İbn Mâce, Nikâh, 1"
    },
    {
        tur: "Hadis-i Şerif",
        metin: "«Sizin en hayırlınız, eşine (ailesine) karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.»",
        kaynak: "Tirmizî, Radâ, 11"
    },
    {
        tur: "Ayet-i Kerime",
        metin: "«...Onlar, sizin için birer elbise (örtü); siz de onlar için birer elbisesiniz (örtüsünüz)...»",
        kaynak: "Bakara Suresi, 187"
    },
    {
        tur: "Hadis-i Şerif",
        metin: "«Mümin, Allah’a takvadan sonra en çok saliha bir eşten hayır görür.»",
        kaynak: "İbn Mâce, Nikâh, 5"
    },
    // --- EVLİLİK VE AİLE ---
    {
        kategori: "Evlilik ve Aile",
        tur: "Ayet-i Kerime",
        icerik: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O’nun varlığının ve kudretinin delillerindendir...",
        kaynak: "Rûm Suresi, 21"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis-i Şerif",
        icerik: "Evleniniz, çoğalınız; çünkü ben kıyamet gününde diğer ümmetlere karşı sizin çokluğunuzla övüneceğim.",
        kaynak: "Beyhakî"
    },
    {

        kategori: "Evlilik ve Aile",
        tur: "Hadis-i Şerif",
        icerik: "Sizin en hayırlınız, ailesine karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.",
        kaynak: "Tirmizî"
    },

    // --- GÜZEL AHLAK ---
    {

        kategori: "Güzel Ahlak",
        tur: "Ayet-i Kerime",
        icerik: "Şüphesiz sen yüksek bir ahlak üzeresin.",
        kaynak: "Kalem Suresi, 4"
    },
    {

        kategori: "Güzel Ahlak",
        tur: "Hadis-i Şerif",
        icerik: "Ben ancak güzel ahlakı tamamlamak için gönderildim.",
        kaynak: "Muvatta"
    },
    {

        kategori: "Güzel Ahlak",
        tur: "Hadis-i Şerif",
        icerik: "Kıyamet gününde müminin mizanında güzel ahlaktan daha ağır gelecek hiçbir şey yoktur.",
        kaynak: "Tirmizî"
    },

    // --- SABIR ---
    {

        kategori: "Sabır",
        tur: "Ayet-i Kerime",
        icerik: "Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphe yok ki Allah, sabredenlerle beraberdir.",
        kaynak: "Bakara Suresi, 153"
    },
    {

        kategori: "Sabır",
        tur: "Ayet-i Kerime",
        icerik: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
        kaynak: "İnşirâh Suresi, 5"
    },
    {

        kategori: "Sabır",
        tur: "Hadis-i Şerif",
        icerik: "Sabır, (musibetin) ilk şok anında gösterilendir.",
        kaynak: "Buhârî"
    },
    // --- SEVGİ ---
    {
        kategori: "Sevgi",
        tur: "Ayet-i Kerime",
        icerik: "İman edip salih ameller işleyenler var ya, Rahman olan Allah onlar için (gönüllerde) bir sevgi var edecektir.",
        kaynak: "Meryem Suresi, 96"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis-i Şerif",
        icerik: "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olmazsınız.",
        kaynak: "Müslim"
    },
    // --- EVLİLİK VE AİLE ---
    {
        kategori: "Evlilik ve Aile",
        tur: "Ayet",
        icerik: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O’nun varlığının ve kudretinin delillerindendir...",
        kaynak: "Rûm Suresi, 21"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Ayet",
        icerik: "Onlar (kadınlar) sizin için birer elbise, siz de onlar için birer elbisesiniz.",
        kaynak: "Bakara Suresi, 187"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        icerik: "Evleniniz, çoğalınız; çünkü ben kıyamet gününde diğer ümmetlere karşı sizin çokluğunuzla övüneceğim.",
        kaynak: "Beyhakî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        icerik: "Sizin en hayırlınız, ailesine karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.",
        kaynak: "Tirmizî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        icerik: "Kul evlendiği vakit dininin yarısını tamamlamış olur. Artık kalan yarısı için de Allah'tan korksun (takva sahibi olsun).",
        kaynak: "Beyhakî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Güzel Söz",
        icerik: "İyi bir aile, huzurlu bir toplumun temel taşıdır. Evinde huzur olmayan bir insanın dünyada mutlu olması zordur.",
        kaynak: "Hz. Ali (r.a.)"
    },

    // --- GÜZEL AHLAK ---
    {
        kategori: "Güzel Ahlak",
        tur: "Ayet",
        icerik: "Şüphesiz sen yüksek bir ahlak üzeresin.",
        kaynak: "Kalem Suresi, 4"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Ayet",
        icerik: "Sen af yolunu tut, iyiliği emret ve cahillerden yüz çevir.",
        kaynak: "A'râf Suresi, 199"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        icerik: "Ben ancak güzel ahlakı tamamlamak için gönderildim.",
        kaynak: "Muvatta"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        icerik: "Kıyamet gününde müminin mizanında güzel ahlaktan daha ağır gelecek hiçbir şey yoktur.",
        kaynak: "Tirmizî"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        icerik: "Müminlerin iman bakımından en mükemmeli, ahlakı en güzel olanıdır.",
        kaynak: "Ebû Dâvûd"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Güzel Söz",
        icerik: "Asalet; boyda postta değil, soyda sopta değil, güzel ahlaktadır.",
        kaynak: "Hz. Ömer (r.a.)"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Güzel Söz",
        icerik: "Edep, aklın dış görünüşüdür.",
        kaynak: "Mevlâna"
    },

    // --- SABIR ---
    {
        kategori: "Sabır",
        tur: "Ayet",
        icerik: "Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphe yok ki Allah, sabredenlerle beraberdir.",
        kaynak: "Bakara Suresi, 153"
    },
    {
        kategori: "Sabır",
        tur: "Ayet",
        icerik: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
        kaynak: "İnşirâh Suresi, 5"
    },
    {
        kategori: "Sabır",
        tur: "Ayet",
        icerik: "Sabredenleri müjdele! Onlar ki kendilerine bir musibet geldiği zaman, 'Biz Allah’a aitiz ve şüphesiz O’na döneceğiz' derler.",
        kaynak: "Bakara Suresi, 155-156"
    },
    {
        kategori: "Sabır",
        tur: "Hadis",
        icerik: "Sabır, (musibetin) ilk şok anında gösterilendir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sabır",
        tur: "Hadis",
        icerik: "Hiç kimseye, sabırdan daha hayırlı ve daha geniş bir ikram (bağış) verilmemiştir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sabır",
        tur: "Güzel Söz",
        icerik: "Sabır, kurtuluşun anahtarıdır. Acele ise şeytanın hilesidir.",
        kaynak: "İmam Gazali"
    },
    {
        kategori: "Sabır",
        tur: "Güzel Söz",
        icerik: "Sabır, yüzünü ekşitmeden acıyı yudum yudum içine sindirmektir.",
        kaynak: "Cüneyd-i Bağdâdî"
    },

    // --- SEVGİ ---
    {
        kategori: "Sevgi",
        tur: "Ayet",
        icerik: "İman edip salih ameller işleyenler var ya, Rahman olan Allah onlar için (gönüllerde) bir sevgi var edecektir.",
        kaynak: "Meryem Suresi, 96"
    },
    {
        kategori: "Sevgi",
        tur: "Ayet",
        icerik: "De ki: Eğer Allah’ı seviyorsanız bana uyun ki, Allah da sizi sevsin ve günahlarınızı bağışlasın.",
        kaynak: "Âl-i İmrân Suresi, 31"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        icerik: "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olmazsınız.",
        kaynak: "Müslim"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        icerik: "Birbirinize hediye verin ki aranızdaki sevgi artsın.",
        kaynak: "Muvatta"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        icerik: "Kişi, (ahirette) sevdiği ile beraberdir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sevgi",
        tur: "Güzel Söz",
        icerik: "Sevgiden acılar tatlılaşır, sevgiden bakırlar altın olur, sevgiden tortular berraklaşır, sevgiden dertler şifa bulur.",
        kaynak: "Mevlâna"
    }
];

function dailyHadith() {
    const randIndex = Math.floor(Math.random() * evlilikMesajlari.length)

    const context = evlilikMesajlari[randIndex];
    const icon = context.tur === "Ayet" ? '📖' : '💬'

    return {icon, ...context}
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
        smartNotes += "\n⚠️ *Önemli:* Bugün yağmur geçişleri görünüyor, yanına mutlaka şemsiye al lütfen! 🌧️";
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
                `${hadith.icon} *${hadith.tur}:*\n${hadith.metin}\n_(${hadith.kaynak})_\n\n` +
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


// railway variables --set "TELEFON_NUMARASI=905319161340" \
//                     --set "SEHIR=bursa" \
//                     --set "GONDERIM_SAATI=30 07 * * *" \
//                     --set "HEDEF_TARIH=2026-06-06" \
//                     --set "TIMEZONE=Europe/Istanbul"

