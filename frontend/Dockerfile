# Multi-stage Dockerfile for TAPTCH React Frontend (Vite)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy source files
COPY shared ./shared
COPY frontend ./frontend

# Build shared and frontend
RUN npm run build --workspace=shared
RUN npx vite build --config frontend/vite.config.ts

# Production static serving stage via NGINX
FROM nginx:alpine AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
