#!/bin/bash

# Tripify Development Environment Startup Script
# This script starts all services with monitoring and service discovery

echo "🚀 Starting Tripify Microservices Architecture..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create network if it doesn't exist
echo "📡 Creating Docker network..."
docker network create tripify-network 2>/dev/null || echo "Network already exists"

# Start core services
echo "🏗️ Starting core services..."
docker-compose up -d mongo redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Start API services
echo "🔧 Starting API services..."
docker-compose up -d api-node data-service

# Start monitoring stack
echo "📊 Starting monitoring stack..."
docker-compose -f docker-compose.monitoring.yml up -d

# Start API Gateway
echo "🌐 Starting API Gateway..."
docker-compose up -d traefik

# Start Frontend
echo "💻 Starting Frontend..."
docker-compose up -d web-react

# Show status
echo "📋 Checking service status..."
docker-compose ps

echo ""
echo "✅ Tripify is now running!"
echo ""
echo "🌍 Services available at:"
echo "  Frontend:     http://localhost"
echo "  API Gateway:  http://localhost/traefik"
echo "  API Docs:     http://localhost/api/health"
echo "  Data Service: http://localhost/data/health"
echo "  Grafana:      http://localhost/grafana (admin/admin)"
echo "  Prometheus:   http://localhost/prometheus"
echo "  Jaeger:       http://localhost/jaeger"
echo "  Consul:       http://localhost/consul"
echo ""
echo "📊 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop all:  docker-compose down && docker-compose -f docker-compose.monitoring.yml down"
