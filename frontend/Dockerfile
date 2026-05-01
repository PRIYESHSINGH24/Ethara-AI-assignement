# ── Stage 1: Build the React app ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (layer caching)
COPY package*.json ./
RUN npm ci

# Accept the API URL as a build arg
# In Docker, nginx proxies /api → backend, so we use a relative path
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
