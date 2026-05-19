FROM ghcr.io/puppeteer/puppeteer:21.5.0

USER root

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    SESSION_PATH=/data/.wwebjs_auth \
    NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /data/.wwebjs_auth && chown -R pptruser:pptruser /data /app
USER pptruser

VOLUME ["/data"]

CMD ["node", "sum.js"]
