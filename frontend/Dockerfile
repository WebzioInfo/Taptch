# Multi-stage Dockerfile for TAPTCH React Frontend (Vite Standalone)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy frontend package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files and configs
COPY tsconfig*.json vite.config.ts index.html tailwind.config.js postcss.config.js ./
COPY src ./src

# Environment build arguments
ARG VITE_API_URL=https://api.taptch.com
ARG VITE_APP_URL=https://taptch.com
ARG VITE_APP_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build frontend
RUN npm run build

# Production static serving stage via NGINX
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
