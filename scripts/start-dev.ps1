# Tripify Development Environment Startup Script
# This script starts all services with monitoring and service discovery

Write-Host "🚀 Starting Tripify Microservices Architecture..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info 2>$null | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Create network if it doesn't exist
Write-Host "📡 Creating Docker network..." -ForegroundColor Yellow
docker network create tripify-network 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Network already exists" -ForegroundColor Yellow
}

# Start core services
Write-Host "🏗️ Starting core services..." -ForegroundColor Yellow
docker-compose up -d mongo redis

# Wait for databases to be ready
Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep 10

# Start API services
Write-Host "🔧 Starting API services..." -ForegroundColor Yellow
docker-compose up -d api-node data-service

# Start monitoring stack
Write-Host "📊 Starting monitoring stack..." -ForegroundColor Yellow
docker-compose -f docker-compose.monitoring.yml up -d

# Start API Gateway
Write-Host "🌐 Starting API Gateway..." -ForegroundColor Yellow
docker-compose up -d traefik

# Start Frontend
Write-Host "💻 Starting Frontend..." -ForegroundColor Yellow
docker-compose up -d web-react

# Show status
Write-Host "📋 Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "✅ Tripify is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Services available at:" -ForegroundColor Cyan
Write-Host "  Frontend:     http://localhost" -ForegroundColor White
Write-Host "  API Gateway:  http://localhost/traefik" -ForegroundColor White
Write-Host "  API Docs:     http://localhost/api/health" -ForegroundColor White
Write-Host "  Data Service: http://localhost/data/health" -ForegroundColor White
Write-Host "  Grafana:      http://localhost/grafana (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:   http://localhost/prometheus" -ForegroundColor White
Write-Host "  Jaeger:       http://localhost/jaeger" -ForegroundColor White
Write-Host "  Consul:       http://localhost/consul" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs: docker-compose logs -f [service-name]" -ForegroundColor Yellow
Write-Host "🛑 To stop all:  docker-compose down && docker-compose -f docker-compose.monitoring.yml down" -ForegroundColor Yellow
