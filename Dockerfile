# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# Skip the postinstall browser download; the runtime image already ships Chromium.
RUN npm ci --ignore-scripts

COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- Runtime stage ----------
# The Playwright image bundles Chromium and its system libraries. Its version
# must match the playwright package in package-lock.json.
FROM mcr.microsoft.com/playwright:v1.58.1-noble AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder --chown=pwuser:pwuser /app/.next/standalone ./
COPY --from=builder --chown=pwuser:pwuser /app/.next/static ./.next/static
COPY --from=builder --chown=pwuser:pwuser /app/public ./public
# Playwright resolves some internals lazily, so ship the full packages rather
# than relying on output file tracing.
COPY --from=builder --chown=pwuser:pwuser /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder --chown=pwuser:pwuser /app/node_modules/playwright-core ./node_modules/playwright-core

USER pwuser
EXPOSE 8080
CMD ["node", "server.js"]
