FROM node:22-alpine AS deps

WORKDIR /app

COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY dashboard/. ./

ENV NODE_ENV=production

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=9101

COPY --from=builder /app ./

EXPOSE 9101

CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port ${PORT:-9101}"]
