# Ink Homes CRM — production Dockerfile (multi-stage)
# node:22-slim (glibc) — alpine/musl broke Turbopack's next.config.ts load on Coolify (Aug 2026);
# glibc is the env where the config load is proven. @supabase/* also requires node >=22.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev || npm install

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/supabase ./supabase
EXPOSE 3000
CMD ["npm", "run", "start"]
