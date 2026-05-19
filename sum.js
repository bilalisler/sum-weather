const {Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');
const {GoogleGenAI, Type} = require('@google/genai');

const SEHIR = process.env.SEHIR || 'bursa';
const TELEFON_NUMARASI = process.env.TELEFON_NUMARASI;
const GONDERIM_SAATI = process.env.GONDERIM_SAATI || '* * * * *';
const HEDEF_TARIH = process.env.HEDEF_TARIH || '2026-06-06';
const TIMEZONE = process.env.TIMEZONE || 'Europe/Istanbul';
const SESSION_PATH = process.env.SESSION_PATH || './.wwebjs_auth';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || 'AIzaSyAuTvmH2eU0yMFdy0aVzL6eUJjdwbZzUjs'});

const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH
    || (process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome-stable');

if (!TELEFON_NUMARASI) {
    console.error('❌ TELEFON_NUMARASI ortam değişkeni tanımlı değil. Çıkılıyor.');
    process.exit(1);
}

const client = new Client({
    authStrategy: new LocalAuth({dataPath: SESSION_PATH}),
    puppeteer: {
        executablePath: CHROME_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('🤖 WhatsApp Girişi İçin Aşağıdaki QR Kodu Taratın:');
    qrcode.generate(qr, {small: true});
});

client.on('authenticated', () => {
    console.log('🔐 Kimlik doğrulandı, oturum kaydedildi.');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Kimlik doğrulama hatası:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Bağlantı koptu:', reason);
});

client.on('ready', () => {
    console.log('✅ WhatsApp Asistanı Hazır ve Arka Planda Çalışıyor!');
    console.log(`⏰ Cron: "${GONDERIM_SAATI}" (${TIMEZONE}) — şehir: ${SEHIR.toUpperCase()}`);
});

process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM alındı, kapatılıyor...');
    try {
        await client.destroy();
    } catch (e) {
    }
    process.exit(0);
});

const hadithList = [
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
        metin: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O’nun varlığının ve kudretinin delillerindendir...",
        kaynak: "Rûm Suresi, 21"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis-i Şerif",
        metin: "Evleniniz, çoğalınız; çünkü ben kıyamet gününde diğer ümmetlere karşı sizin çokluğunuzla övüneceğim.",
        kaynak: "Beyhakî"
    },
    {

        kategori: "Evlilik ve Aile",
        tur: "Hadis-i Şerif",
        metin: "Sizin en hayırlınız, ailesine karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.",
        kaynak: "Tirmizî"
    },

    // --- GÜZEL AHLAK ---
    {

        kategori: "Güzel Ahlak",
        tur: "Ayet-i Kerime",
        metin: "Şüphesiz sen yüksek bir ahlak üzeresin.",
        kaynak: "Kalem Suresi, 4"
    },
    {

        kategori: "Güzel Ahlak",
        tur: "Hadis-i Şerif",
        metin: "Ben ancak güzel ahlakı tamamlamak için gönderildim.",
        kaynak: "Muvatta"
    },
    {

        kategori: "Güzel Ahlak",
        tur: "Hadis-i Şerif",
        metin: "Kıyamet gününde müminin mizanında güzel ahlaktan daha ağır gelecek hiçbir şey yoktur.",
        kaynak: "Tirmizî"
    },

    // --- SABIR ---
    {

        kategori: "Sabır",
        tur: "Ayet-i Kerime",
        metin: "Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphe yok ki Allah, sabredenlerle beraberdir.",
        kaynak: "Bakara Suresi, 153"
    },
    {

        kategori: "Sabır",
        tur: "Ayet-i Kerime",
        metin: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
        kaynak: "İnşirâh Suresi, 5"
    },
    {

        kategori: "Sabır",
        tur: "Hadis-i Şerif",
        metin: "Sabır, (musibetin) ilk şok anında gösterilendir.",
        kaynak: "Buhârî"
    },
    // --- SEVGİ ---
    {
        kategori: "Sevgi",
        tur: "Ayet-i Kerime",
        metin: "İman edip salih ameller işleyenler var ya, Rahman olan Allah onlar için (gönüllerde) bir sevgi var edecektir.",
        kaynak: "Meryem Suresi, 96"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis-i Şerif",
        metin: "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olmazsınız.",
        kaynak: "Müslim"
    },
    // --- EVLİLİK VE AİLE ---
    {
        kategori: "Evlilik ve Aile",
        tur: "Ayet",
        metin: "Kendileri ile huzur bulasınız diye sizin için türünüzden eşler yaratması ve aranızda bir sevgi ve merhamet var etmesi de O’nun varlığının ve kudretinin delillerindendir...",
        kaynak: "Rûm Suresi, 21"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Ayet",
        metin: "Onlar (kadınlar) sizin için birer elbise, siz de onlar için birer elbisesiniz.",
        kaynak: "Bakara Suresi, 187"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        metin: "Evleniniz, çoğalınız; çünkü ben kıyamet gününde diğer ümmetlere karşı sizin çokluğunuzla övüneceğim.",
        kaynak: "Beyhakî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        metin: "Sizin en hayırlınız, ailesine karşı en hayırlı olanınızdır. Ben de aileme karşı en hayırlı olanınızım.",
        kaynak: "Tirmizî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Hadis",
        metin: "Kul evlendiği vakit dininin yarısını tamamlamış olur. Artık kalan yarısı için de Allah'tan korksun (takva sahibi olsun).",
        kaynak: "Beyhakî"
    },
    {
        kategori: "Evlilik ve Aile",
        tur: "Güzel Söz",
        metin: "İyi bir aile, huzurlu bir toplumun temel taşıdır. Evinde huzur olmayan bir insanın dünyada mutlu olması zordur.",
        kaynak: "Hz. Ali (r.a.)"
    },

    // --- GÜZEL AHLAK ---
    {
        kategori: "Güzel Ahlak",
        tur: "Ayet",
        metin: "Şüphesiz sen yüksek bir ahlak üzeresin.",
        kaynak: "Kalem Suresi, 4"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Ayet",
        metin: "Sen af yolunu tut, iyiliği emret ve cahillerden yüz çevir.",
        kaynak: "A'râf Suresi, 199"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        metin: "Ben ancak güzel ahlakı tamamlamak için gönderildim.",
        kaynak: "Muvatta"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        metin: "Kıyamet gününde müminin mizanında güzel ahlaktan daha ağır gelecek hiçbir şey yoktur.",
        kaynak: "Tirmizî"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Hadis",
        metin: "Müminlerin iman bakımından en mükemmeli, ahlakı en güzel olanıdır.",
        kaynak: "Ebû Dâvûd"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Güzel Söz",
        metin: "Asalet; boyda postta değil, soyda sopta değil, güzel ahlaktadır.",
        kaynak: "Hz. Ömer (r.a.)"
    },
    {
        kategori: "Güzel Ahlak",
        tur: "Güzel Söz",
        metin: "Edep, aklın dış görünüşüdür.",
        kaynak: "Mevlâna"
    },

    // --- SABIR ---
    {
        kategori: "Sabır",
        tur: "Ayet",
        metin: "Ey iman edenler! Sabır ve namazla yardım dileyin. Şüphe yok ki Allah, sabredenlerle beraberdir.",
        kaynak: "Bakara Suresi, 153"
    },
    {
        kategori: "Sabır",
        tur: "Ayet",
        metin: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
        kaynak: "İnşirâh Suresi, 5"
    },
    {
        kategori: "Sabır",
        tur: "Ayet",
        metin: "Sabredenleri müjdele! Onlar ki kendilerine bir musibet geldiği zaman, 'Biz Allah’a aitiz ve şüphesiz O’na döneceğiz' derler.",
        kaynak: "Bakara Suresi, 155-156"
    },
    {
        kategori: "Sabır",
        tur: "Hadis",
        metin: "Sabır, (musibetin) ilk şok anında gösterilendir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sabır",
        tur: "Hadis",
        metin: "Hiç kimseye, sabırdan daha hayırlı ve daha geniş bir ikram (bağış) verilmemiştir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sabır",
        tur: "Güzel Söz",
        metin: "Sabır, kurtuluşun anahtarıdır. Acele ise şeytanın hilesidir.",
        kaynak: "İmam Gazali"
    },
    {
        kategori: "Sabır",
        tur: "Güzel Söz",
        metin: "Sabır, yüzünü ekşitmeden acıyı yudum yudum içine sindirmektir.",
        kaynak: "Cüneyd-i Bağdâdî"
    },

    // --- SEVGİ ---
    {
        kategori: "Sevgi",
        tur: "Ayet",
        metin: "İman edip salih ameller işleyenler var ya, Rahman olan Allah onlar için (gönüllerde) bir sevgi var edecektir.",
        kaynak: "Meryem Suresi, 96"
    },
    {
        kategori: "Sevgi",
        tur: "Ayet",
        metin: "De ki: Eğer Allah’ı seviyorsanız bana uyun ki, Allah da sizi sevsin ve günahlarınızı bağışlasın.",
        kaynak: "Âl-i İmrân Suresi, 31"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        metin: "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olmazsınız.",
        kaynak: "Müslim"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        metin: "Birbirinize hediye verin ki aranızdaki sevgi artsın.",
        kaynak: "Muvatta"
    },
    {
        kategori: "Sevgi",
        tur: "Hadis",
        metin: "Kişi, (ahirette) sevdiği ile beraberdir.",
        kaynak: "Buhârî"
    },
    {
        kategori: "Sevgi",
        tur: "Güzel Söz",
        metin: "Sevgiden acılar tatlılaşır, sevgiden bakırlar altın olur, sevgiden tortular berraklaşır, sevgiden dertler şifa bulur.",
        kaynak: "Mevlâna"
    }
];

function dailyHadith() {
    const randIndex = Math.floor(Math.random() * hadithList.length)

    const context = hadithList[randIndex];
    const icon = context.tur === "Ayet" ? '📖' : '💬'

    return `${icon} *${context.tur}:*\\n${context.metin}\\n_(${context.kaynak})_`
}

function meetDayCounter() {
    const hedef = new Date(HEDEF_TARIH);
    const today = new Date();
    const bugununTarihi = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Saat farkından etkilenmemek için
    const hedefTarihYalin = new Date(hedef.getFullYear(), hedef.getMonth(), hedef.getDate());

    const farkZaman = hedefTarihYalin - bugununTarihi;
    return Math.ceil(farkZaman / (1000 * 60 * 60 * 24));
}

function meetDayCounterMessage() {
    const kalanGun = meetDayCounter();

    let geriSayimMesaji = "";
    if (kalanGun > 0) {
        // geriSayimMesaji = `Nasip olursa ilk defa yüz yüze tanışıp hasbihal edeceğimiz güne ${kalanGun} gün kaldı. Bu sürecin her gününü, niyetimizin hayrına ve geleceğimizin bereketine vesile olacak hayırlı bir bekleyiş kılmasını Rabbimden niyaz ediyorum.`
        geriSayimMesaji = `🕊️ *İlk Görüşmemize:* ${kalanGun} gün kaldı. Hayırlara vesile olmasını ve güzel bir başlangıca kapı aralamasını temenni ediyorum.`;
    } else if (kalanGun === 0) {
        geriSayimMesaji = `✨ *Buluşma Günü:* Nasip olursa bugün ilk defa bir araya geleceğiz. Niyetimizin hayır, akıbetimizin de hayır olmasını dilerim. Heyecanımı ve duamı paylaşıyorum.`;
    } else {
        geriSayimMesaji = `🌸 Tanışmış olmanın ve bu güzel yolda adım atmanın huzuru üzerimizde olsun.`;
    }


    return geriSayimMesaji
}

function outfitSuggestionMessage(veri) {
    const temprature = parseInt(veri.current_condition[0].temp_C); // gerçek sıcaklık

    let outfitSuggestion = "";

    if (temprature < 5) {
        outfitSuggestion = "🥶 *Lahanaya dönme vakti!* Hava buz gibi. En kalın montunu giy, atkı ve bereni sakın evde unutma.";
    } else if (temprature >= 5 && temprature < 12) {
        outfitSuggestion = "🧥 *Klasik Kış Modu.* Kalın kazaklar ve kışlık kabanın günü. Ayaklarını sıcak tutacak botları tercih et.";
    } else if (temprature >= 12 && temprature < 18) {
        outfitSuggestion = "🧥 *Akıllı Katmanlar!* Bu hava adamı aldatır. Kat kat giyin ki öğlen sıcaklarsan çıkarasın. Deri ceket veya trençkot harika olur.";
    } else if (temprature >= 18 && temprature < 24) {
        outfitSuggestion = "👚 *Tatlı Bahar Esintisi.* Hafif bir sweatshirt, denim ceket veya uzun kollu şık bir gömlek tam bugünün havası.";
    } else {
        outfitSuggestion = "☀️ *Tiril Tiril Yaz!* Hava harika. Tişörtünü, keten pantolonunu veya en sevdiğin elbiseni giy. Güneş gözlüğünü unutma!";
    }

    return outfitSuggestion
}

function weatherEffect(veri) {
    const rainfall = parseFloat(veri.current_condition[0].precipMM); // Yağış Miktarı
    const uvIndex = parseInt(veri.current_condition[0].uvIndex); // UV İndeksi

    let note = "";
    if (rainfall > 0.1) {
        note += "☔️*Tedbir Notu:* Bugün yağmur geçişleri görünüyor, yanınıza şemsiye almanızı tavsiye ederiz! 🌧️";
    }
    if (uvIndex >= 3) {
        note += "☀️*Güneş Notu:* Bugün ultraviyole ışınların etkisi biraz yüksek seyredebilir; dışarı çıkarken koruyucu önlemlerinizi almanız sıhhatiniz açısından faydalı olacaktır.";
    }

    return note
}

async function sendMessage(message) {
    const chatId = `${TELEFON_NUMARASI}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`🚀 Mesaj başarıyla gönderildi: ${new Date().toLocaleTimeString()}`);
}

async function fetchWeatherInformations() {
    const url = `https://wttr.in/${SEHIR}?format=j1`;
    const cevap = await axios.get(url);
    return cevap.data;
}

function weatherMessage(veri) {
    const temprature = parseInt(veri.current_condition[0].temp_C); // gerçek sıcaklık
    const weather = veri.current_condition[0].weatherDesc[0].value; // hava durumu
    const perceivedTemperature = parseInt(veri.current_condition[0].FeelsLikeC); // Hissedilen Sıcaklık

    return `${perceivedTemperature}°C (Gerçek: ${temprature}°C - ${weather})`
}


async function aiAsistanMotoru(sehir, sicaklik, durum, kalanGun) {
    const requiredPromts = {
        'kombin_onerisi': 'Tesettürlü bir müslüman kadının giyim kuşam hassasiyetine ve mevsimsel konforuna uygun, şahsi kıyafet detaylarına veya iç kombin parçalarına ASLA girmeden yazılmış yüzeysel bir dış giyim hatırlatması. Hava durumuna göre sadece dışarı çıkarken kabaca nasıl bir tedbir alınması gerektiğine (Örn: kalın bir kaban, mevsimlik bir dış giyim, ferace/trençkot veya şemsiye önlemi gibi genel hatlara) odaklanmalıdır. Üslup kesinlikle mesafeli, saygılı ve onun günlük rahatlığını gözeten bir nezaket taşımalıdır.',
        'gunun_duasi': 'Sümeyye\'nin gününü ferahlatacak, kalbine huzur verecek, hiçbir şekilde flörtöz veya duygusal coşku barındırmayan; tamamen gıyabında yapılan samimi, riyasız, manevi derinliği yüksek bir müminin mümine yapacağı cinsten bir hayır duası.',
        'gorusme_notu': 'Henüz aramızda şer\'i ve resmi bir bağ olmadığını, ailelerin henüz sürece dahil olmadığını hatırda tutarak; duyguları kabartmayacak, nefsî ve hissi coşkulardan uzak, tanışma sürecinin hayırlara vesile olması temennisini barındıran, ahlak ve edep çizgisinde vakur bir cümle.',
        // 'pratik_not': 'Hava durumuna ve günün hafta içi/hafta sonu olma durumuna göre, İstanbul\'un günlük koşturmacasında zamanı veya enerjiyi iyi yönetmeye dair mesafeli, pratik bir yaşam tavsiyesi',
        // 'esma_hatirlatmasi': 'Allah\'ın güzel isimlerinden birini seçip, o ismin günlük hayatta kalbimize ve ahlakımıza nasıl tecelli edebileceğini anlatan, vaaz üslubundan uzak, naif bir hatırlatma',
        'gunun_fikri': 'Herhangi bir insanın anlamak için entelektüel veya felsefi olarak yorulmayacağı kadar sade, ancak okuduğunda kendi hayatını, ahlakını ve Müslümanlığını samimiyetle sorgulatacak derinlikte bir tefekkür sorusu veya kısa bir düşünce. Odak noktası; günlük hayattaki ahlaki zafiyetlerimizi fark etmek, taklidi dindarlıktan sıyrılıp "iyi ve samimi bir Müslüman olma" şuurunu uyandırmak ve imanı güçlendirmektir. Ağır teorik tartışmalardan, felsefi şüphelerden ve vaaz verir gibi üstten bakan bir üsluptan kesinlikle uzak durulmalıdır. İnsanın iç dünyasında bir muhasebe kapısı açmalı, kalbini sarsıp hayata daha şuurlu bakmasına vesile olmalıdır. Üslup mesafeli, naif ve vakur olmalıdır',
        'saglik_notu': 'Sümeyye Hanım\'ın pıhtı yatkınlığı rahatsızlığını dikkate alarak; hava sıcaklığına ve günün şartlarına göre (Örn: hava sıcaksa kan yoğunluğunu dengede tutmak için bol su tüketmesi, gün içinde uzun süre hareketsiz kalmaması, küçük yürüyüşler yapması veya yolculuklarda bacaklarını esnetmesi gibi) tamamen onun sıhhatini ve konforunu gözeten, bir müminin mümin kardeşine göstereceği türden, mesafeli ama son derece düşünceli bir pratik sağlık tavsiyesi. Üslup asla tıbbi bir dikte veya flörtöz bir acıma barındırmamalı, tamamen vakur ve koruyucu bir nezaket taşımalıdır.',
    }

    let counter = 1;
    let itemList = ''
    let jsonFormat = '{\n'
    for (const [key, value] of Object.entries(requiredPromts)) {
        itemList += `${counter}. ${key.trim()}: ${value.trim()} \n\n`;
        jsonFormat += `"${key.trim()}": "..."\n`;
        counter++
    }
    jsonFormat += '}\n'

    let prompt = `
    Evlilik niyetiyle, İslamî usullere ve helal dairenin sınırlarına tam riayet ederek tanıştığım tesettürlü müslüman bir hanımefendi (Adı: Sümeyye) var. Henüz aramızda bir nikah akdi bulunmadığı, aileler resmen tanışmadığı ve yüz yüze ilk görüşmemizi gerçekleştirmediğimiz için aramızdaki iletişimi bir müslümana yakışacak vakur, saygılı ve ahlakî sınırlar içinde tutuyoruz.

    Şu anki hava durumu verileri:
    - Şehir: ${sehir}
    - Sıcaklık/Hissedilen: ${sicaklik}°C
    - Hava Durumu: ${durum}
    - İlk yüz yüze görüşmemize kalan gün: ${kalanGun}

    Senden bu verilere ve İslamî hassasiyetlere uygun olarak şu 3 alanı doldurmanı istiyorum:

    ${itemList}
    
    KESKİN KURALLAR:
    - Hitap dili kesinlikle "Siz" olmalıdır, asla "Sen" denmemelidir.
    - Duygusal, flörtöz, sulu, aşırı romantik veya aşk/sevgi ilan eden hiçbir kelime kullanılmamalıdır.
    - Flörtöz, sulu veya aşırı romantik ifadelerden uzak, ciddi ama içten ve naif bir İslamî zarafet taşımalı.
    - Ciddiyet, zarafet, İslamî edep ve vakur bir duruş esas alınmalıdır.
    - Çıktıyı sadece ve sadece aşağıdaki geçerli JSON formatında ver, başka hiçbir açıklama yazma.

    ${jsonFormat}
    `;

    const properties = () => {
        const properties = {}
        Object.keys(requiredPromts).forEach(key => {
            properties[key] = {type: Type.STRING};
        })

        return properties
    }

    try {
        // En güncel ve hızlı model olan gemini-2.5-flash modelini kullanıyoruz
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Çıktının kesinlikle belirttiğimiz JSON formatında gelmesini zorunlu kılıyoruz
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: properties(),
                    required: Object.keys(requiredPromts),
                },
                temperature: 0.7,
            },
        });

        // Gelen yanıtı doğrudan JSON nesnesi olarak parse edip dönüyoruz
        return JSON.parse(response.text);
    } catch (hata) {
        console.error("Gemini API Hatası:", hata);
        return null;
    }
}

async function init() {
    try {
        const weatherResponse = await fetchWeatherInformations();

        const temprature = weatherMessage(weatherResponse)
        const outfit = outfitSuggestionMessage(weatherResponse)
        const counter = meetDayCounterMessage(weatherResponse)
        const weatherAffect = weatherEffect(weatherResponse)
        const hadith = dailyHadith()

        // Hafta Sonu Kontrolü
        const today = new Date();
        const isWeekend = [0, 6].includes(today.getDay());

        let message = ""
        if (isWeekend) {
            message = 'Günaydın! ☀️ Harika bir gün geçirmen dileğiyle.';
        } else {
            message =
                `Hayırlı Sabahlar! 🌻️\n\n` +
                `📍 *Konum:* ${SEHIR.toUpperCase()}\n` +
                `🌡️ *Hava Durumu:* ${temprature}\n\n` +
                (weatherAffect ? `${weatherAffect}\n\n` : '') +
                `🧥 *Dış Giyim Tedbiri:*\n ${outfit}\n\n` +
                `${hadith}\n\n` +
                `${counter}\n\n` +
                'Huzurlu ve çok güzel bir gün geçirmeniz dileğiyle, Allah\'a emanet olunuz. ✨';

            const tempratureDegree = parseInt(weatherResponse.current_condition[0].temp_C); // gerçek sıcaklık
            const weatherStatus = weatherResponse.current_condition[0].weatherDesc[0].value; // hava durumu
            const meetDayCount = meetDayCounter()

            let aiResult = await aiAsistanMotoru(tempratureDegree, weatherStatus, meetDayCount)
            if (aiResult === null) {
                aiResult = {
                    "kombin_onerisi": "Havanın güneşli olması sebebiyle, dışarı çıkarken mevsimlik ve rahat bir dış giyimi tercih etmeniz, gün boyu konforunuz için uygun olabilir.",
                    "gunun_duasi": "Allah'ım, Sümeyye Hanım'ın gününü hayırla, bereketle ve huzurla doldur. Kalbine ferahlık ver, işlerini kolaylaştır ve her türlü sıkıntıdan muhafaza eyle. Amin.",
                    "gorusme_notu": "Bu tanışma sürecinin, her iki taraf için de hayırlara vesile olmasını ve Allah katında rızaya uygun bir neticeye ulaşmasını temenni ederim.",
                    // "pratik_not": "Güneşli havayı değerlendirerek, gün içindeki işlerinizi düzenli adımlarla planlamak ve kısa molalarla enerji tazelemek, gününüzü daha verimli kılabilir.",
                    "gunun_fikri": "Bir Müslüman olarak, günlük yaşantımızda Allah rızasına uygun olmayan bir tavır sergilediğimizde veya bir hata yaptığımızda, vicdanımızın bu durumu ne kadar çabuk fark edip bizi doğruya yönelttiğini hiç düşündük mü? Gerçek samimiyet, hatayı fark edip hemen tövbe edebilmektir.",
                    "saglik_notu": "Güneşli havada gün içinde yeterli miktarda su tüketmeye özen göstermeniz ve uzun süreli hareketsizlikten kaçınarak kısa yürüyüşler yapmanız, genel sağlığınız ve dolaşımınız için faydalı olacaktır. Allah sıhhat ve afiyet versin."
                }
            }


            if (aiResult !== null) {
                message =
                    `Hayırlı Sabahlar! 🌻️\n\n` +
                    `📍 *Konum:* ${SEHIR.toUpperCase()}\n` +
                    `🌡️ *Hava Durumu:* ${temprature}\n\n` +
                    (weatherAffect ? `${weatherAffect}\n\n` : '') +
                    `🧥 *Dış Giyim Tedbiri:*\n${aiResult.kombin_onerisi}\n\n` +
                    (aiResult?.gunun_duasi ? `🤲🏻 *Gıyabınızda Bir Dua:*\n${aiResult.gunun_duasi}\n\n` : '') +
                    (aiResult?.pratik_not ? `⏱️ *Günlük Pratik:*\n${aiResult.pratik_not}\n\n` : '') +
                    (aiResult?.gunun_fikri ? `🕯️ *Tefekkür Notu:*\n${aiResult.gunun_fikri}\n\n` : '') +
                    (aiResult?.saglik_notu ? `💧️ *Sıhhatiniz İçin Küçük Bir Not:*\n${aiResult.saglik_notu}\n\n` : '') +
                    (aiResult?.gorusme_notu ? `🕊️ *Geleceğe Matuf Temenni:*\n${aiResult.gorusme_notu}\n\n` : '') +
                    `⏳ *Kalan Gün:* ${meetDayCount}\n\n` +
                    'Huzurlu ve çok güzel bir gün geçirmeniz dileğiyle, Allah\'a emanet olunuz. ✨';
            }
        }

        await sendMessage(message);

    } catch (hata) {
        console.error('❌ Hava durumu veya message gönderme hatası:', hata);
    }
}

cron.schedule(GONDERIM_SAATI, () => {
    console.log('⏰ Zamanı geldi, hava durumu kontrol ediliyor...');
    // init();
}, {timezone: TIMEZONE});
client.initialize()


client.on('message', async (msg) => {
    const gelenMesaj = msg.body.toLowerCase().trim();
    const hedefChatId = `${TELEFON_NUMARASI}@c.us`;

    console.log(`ChatID: ${hedefChatId}, Mesaj: ${gelenMesaj}`)

    // if (msg.from === hedefChatId && (gelenMesaj === '!kombin' || gelenMesaj === '!hava')) {
    //     await msg.reply('🤖 Kombin reçeten hemen hazırlanıyor, bir saniye... ⏳');
    //     const anlikMesaj = await mesajIcerigiOlustur();
    //     if (anlikMesaj) await client.sendMessage(hedefChatId, anlikMesaj);
    // }
});


// railway variables --set "TELEFON_NUMARASI=905319161340" \
//                     --set "SEHIR=bursa" \
//                     --set "GONDERIM_SAATI=30 7 * * *" \
//                     --set "HEDEF_TARIH=2026-06-06" \
//                     --set "TIMEZONE=Europe/Istanbul" \
//                     --set "GEMINI_API_KEY=AIzaSyAuTvmH2eU0yMFdy0aVzL6eUJjdwbZzUjs"
