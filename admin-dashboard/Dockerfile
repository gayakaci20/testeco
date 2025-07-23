# Multi-stage build pour l'admin dashboard
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/prisma ./prisma/

# Copy all source files
COPY . .

# Environment variables for build
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
ENV DIRECT_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
ENV NEXTAUTH_SECRET=your-super-secret-key-change-in-production
ENV NEXTAUTH_URL=http://localhost:3001
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/public/documents
RUN mkdir -p /app/.next
RUN mkdir -p /app/scripts

# Copy public folder
COPY --from=builder /app/public ./public

# Set permissions
RUN chown nextjs:nodejs .next
RUN chown -R nextjs:nodejs /app/public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy essential node_modules for Prisma and bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy scripts directory
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Install bcryptjs in production (lightweight)
RUN npm install bcryptjs@2.4.3 --production

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 