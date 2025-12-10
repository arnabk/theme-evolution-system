# Multi-stage build for production
FROM oven/bun:1 AS base

# Install build dependencies for native modules (sqlite3)
# Also install Node.js/npm for sqlite3 native module compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies (including native modules)
# Use npm for sqlite3 to ensure native module is built correctly
RUN bun install --frozen-lockfile --production && \
    cd /app && npm rebuild sqlite3 --build-from-source || npm install sqlite3 --production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install all dependencies (including devDependencies for build)
# Ensure native modules are built
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/bash nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# Copy public directory if it exists (Next.js may not create it)
RUN mkdir -p /app/public || true
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Ensure sqlite3 native module is properly built for the runtime platform
RUN cd /app && npm rebuild sqlite3 --build-from-source || npm install sqlite3 --production

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Bun to run the Next.js server
CMD ["bun", "run", "start"]

