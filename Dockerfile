FROM node:20-alpine AS base

RUN addgroup -S kiby && adduser -S kiby -G kiby
WORKDIR /app
RUN chown kiby:kiby /app

COPY --chown=kiby:kiby package*.json ./
USER kiby
RUN npm ci --omit=dev

COPY --chown=kiby:kiby . .

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["npm", "start"]
