FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Root yetkisiyle çalışma alanını oluşturuyoruz
USER root

WORKDIR /app

# Bağımlılıkları kopyala ve kur
COPY package*.json ./
RUN npm ci

# Uygulama kodlarını kopyala
COPY . .

# Uygulamayı başlat
CMD ["node", "index"]