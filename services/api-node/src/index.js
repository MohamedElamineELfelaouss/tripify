import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import "express-async-errors";

// Import configurations and middleware
import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { metricsMiddleware, register } from "./monitoring/metrics.js";

// Import routes
import userRoutes from "./routes/users.js";
import tripRoutes from "./routes/trips.js";
import discoveryRoutes from "./routes/discovery.js";
import recommendationRoutes from "./routes/recommendations.js";


// Import gRPC server
// import GrpcServer from "./grpc/index.js";
import consul from "./config/consul.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Metrics middleware
app.use(metricsMiddleware);


// Apply rate limiting
app.use("/api/", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Tripify API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// Metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// API Routes
app.use("/v1/users", userRoutes);
app.use("/v1/trips", tripRoutes);
app.use("/v1/discovery", discoveryRoutes);
app.use("/v1/recommendations", recommendationRoutes);

// Catch-all for undefined routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start servers
const PORT = process.env.PORT || 3000;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Tripify API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`); // Register with Consul
  try {
    const serviceDefinition = {
      ID: "api-node-http",
      Name: "api-node-http",
      Tags: [
        "http",
        "api",
        "node",
        // Traefik service discovery tags
        "traefik.enable=true",
        "traefik.http.routers.api-node.rule=Host(`localhost`) && PathPrefix(`/api`)",
        "traefik.http.routers.api-node.entrypoints=web",
        "traefik.http.services.api-node.loadbalancer.server.port=3000",
        "traefik.http.middlewares.api-stripprefix.stripprefix.prefixes=/api",
        "traefik.http.routers.api-node.middlewares=api-stripprefix",
      ],
      Address: "api-node",
      Port: parseInt(PORT),
      Check: {
        HTTP: `http://api-node:${PORT}/health`,
        Interval: "10s",
        Timeout: "3s",
      },
    };

    await consul.registerService(serviceDefinition);
    console.log(`✅ Registered HTTP service with Consul on port ${PORT}`);
  } catch (error) {
    console.error("❌ Failed to register with Consul:", error);
  }
});

// Start gRPC server
// const grpcServer = new GrpcServer();
// grpcServer.start(GRPC_PORT).catch((error) => {
//   console.error("Failed to start gRPC server:", error);
// });

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  // Close HTTP server
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
  // Close gRPC server
  // try {
  //   await grpcServer.stop();
  //   console.log("✅ gRPC server closed");
  // } catch (error) {
  //   console.error("❌ Error closing gRPC server:", error);
  // }

  // Close database connection
  try {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }

  process.exit(0);
};

// Handle signals for graceful shutdown
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  gracefulShutdown("unhandledRejection");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

export default app;
