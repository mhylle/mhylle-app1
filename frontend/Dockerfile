# Multi-stage Dockerfile for Angular Frontend
# Optimized for production deployment with subpath support

# Stage 1: Build the Angular application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies (use npm ci for faster, reliable builds)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments for subpath configuration
ARG BASE_HREF="/app1/"
ARG DEPLOY_URL="/app1/"

# Build the Angular application for production
RUN npm run build -- \
    --configuration=production \
    --base-href=${BASE_HREF} \
    --deploy-url=${DEPLOY_URL} \
    --output-path=dist \
    --aot \
    --build-optimizer

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist/app1 /usr/share/nginx/html/

# Create nginx cache directory and set permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
