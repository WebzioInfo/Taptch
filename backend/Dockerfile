# Multi-stage Dockerfile for TAPTCH NestJS Backend Engine (Standalone)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy backend package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files and configs
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Build backend
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "dist/main.js"]
