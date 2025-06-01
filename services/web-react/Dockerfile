# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Node.js for Consul registration
FROM node:18-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy consul registration script
COPY consul-register.js /app/consul-register.js

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo 'nginx -t' >> /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'node /app/consul-register.js &' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Expose port 80 (Nginx default port)
EXPOSE 80

CMD ["/start.sh"]
