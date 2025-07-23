# Multi-stage build pour optimiser la taille de l'image finale
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --only=production --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/prisma ./prisma/

# Copy all source files
COPY . .

# Définir les variables d'environnement nécessaires pour le build
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
ENV DIRECT_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
ENV JWT_SECRET=build_time_fallback_jwt_secret
ENV STRIPE_SECRET_KEY=sk_test_fallback_key_for_build
ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Note: NEXTAUTH_SECRET is now only set at runtime for security
ENV NEXTAUTH_URL=http://localhost:3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Générer le client Prisma et construire l'application
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/public/uploads
RUN mkdir -p /app/.next

# Copy public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN chown nextjs:nodejs .next
RUN chown -R nextjs:nodejs /app/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 