# Tripify React App - Docker Setup

This document explains how to build and run the Tripify React application using Docker.

## Files Created

- `Dockerfile` - Multi-stage build configuration
- `nginx.conf` - Custom Nginx configuration for serving the React SPA
- `.dockerignore` - Excludes unnecessary files from Docker build context
- `README-Docker.md` - This documentation file

## Building the Docker Image

```bash
# Navigate to the web-react directory
cd "c:\Users\ASUS\Desktop\tripify\services\web-react"

# Build the Docker image
docker build -t tripify-web-react .
```

## Running the Container

```bash
# Run the container (development/testing)
docker run -d -p 3000:80 --name tripify-web-test tripify-web-react

# Run the container (production - different port)
docker run -d -p 80:80 --name tripify-web-prod tripify-web-react
```

## Container Management

```bash
# Check running containers
docker ps

# View container logs
docker logs tripify-web-test

# Stop the container
docker stop tripify-web-test

# Remove the container
docker rm tripify-web-test

# Access the container shell (for debugging)
docker exec -it tripify-web-test sh
```

## Testing the Application

Once the container is running, you can access the application at:
- **Development**: http://localhost:3000
- **Production**: http://localhost (port 80)

The application includes:
- ✅ React SPA with client-side routing
- ✅ Nginx with gzip compression
- ✅ Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- ✅ Static asset caching
- ✅ Fallback routing for SPA

## Docker Image Details

- **Base Images**: 
  - Build stage: `node:18-alpine`
  - Runtime stage: `nginx:alpine`
- **Exposed Port**: 80
- **Build Size**: Optimized multi-stage build
- **Security**: Runs as non-root user

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Add environment-specific configuration
2. **Health Checks**: Add Docker health check commands
3. **Resource Limits**: Set memory and CPU limits
4. **Logging**: Configure log rotation and monitoring
5. **HTTPS**: Add SSL termination (reverse proxy recommended)

## Troubleshooting

If you encounter issues:

1. Check container logs: `docker logs tripify-web-test`
2. Verify the container is running: `docker ps`
3. Test HTTP response: `Invoke-WebRequest http://localhost:3000`
4. Access container shell: `docker exec -it tripify-web-test sh`
