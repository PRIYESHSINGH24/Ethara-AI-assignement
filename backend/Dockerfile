# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching — only reinstalls on dependency change)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# ── Stage 2: Production image ────────────────────────────────────
FROM node:20-alpine AS production

# Set non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Create the data directory for the JSON DB with correct ownership
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

# No EXPOSE or HEALTHCHECK needed as Railway manages the port and performs health checks via railway.json


CMD ["node", "src/server.js"]
