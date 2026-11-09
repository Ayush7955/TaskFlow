# ─── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY . .

# ─── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S taskflow -u 1001 -G nodejs

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder --chown=taskflow:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=taskflow:nodejs . .

# Remove dev files
RUN rm -rf tests .eslintrc.json .prettierrc nodemon.json

# Switch to non-root user
USER taskflow

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:5000/api/v1/health || exit 1

# Start with dumb-init for proper PID 1 signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
