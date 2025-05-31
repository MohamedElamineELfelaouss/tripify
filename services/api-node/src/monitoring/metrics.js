import client from "prom-client";

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "tripify-api",
  version: process.env.SERVICE_VERSION || "1.0.0",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const grpcRequestDuration = new client.Histogram({
  name: "grpc_request_duration_seconds",
  help: "Duration of gRPC requests in seconds",
  labelNames: ["service", "method", "status"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const grpcRequestsTotal = new client.Counter({
  name: "grpc_requests_total",
  help: "Total number of gRPC requests",
  labelNames: ["service", "method", "status"],
});

const databaseOperations = new client.Histogram({
  name: "database_operation_duration_seconds",
  help: "Duration of database operations in seconds",
  labelNames: ["operation", "collection"],
  buckets: [0.01, 0.1, 0.3, 0.5, 1, 3, 5],
});

const cacheOperations = new client.Histogram({
  name: "cache_operation_duration_seconds",
  help: "Duration of cache operations in seconds",
  labelNames: ["operation", "hit"],
  buckets: [0.001, 0.01, 0.1, 0.3, 0.5, 1],
});

const activeConnections = new client.Gauge({
  name: "active_connections_total",
  help: "Total number of active connections",
  labelNames: ["type"],
});

const tripOperations = new client.Counter({
  name: "trip_operations_total",
  help: "Total number of trip operations",
  labelNames: ["operation", "status"],
});

const userOperations = new client.Counter({
  name: "user_operations_total",
  help: "Total number of user operations",
  labelNames: ["operation", "status"],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(grpcRequestDuration);
register.registerMetric(grpcRequestsTotal);
register.registerMetric(databaseOperations);
register.registerMetric(cacheOperations);
register.registerMetric(activeConnections);
register.registerMetric(tripOperations);
register.registerMetric(userOperations);

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};

// gRPC metrics helpers
export const recordGrpcMetrics = (service, method, status, duration) => {
  grpcRequestDuration.labels(service, method, status).observe(duration);

  grpcRequestsTotal.labels(service, method, status).inc();
};

// Database metrics helpers
export const recordDatabaseMetrics = (operation, collection, duration) => {
  databaseOperations.labels(operation, collection).observe(duration);
};

// Cache metrics helpers
export const recordCacheMetrics = (operation, hit, duration) => {
  cacheOperations.labels(operation, hit ? "hit" : "miss").observe(duration);
};

// Business metrics helpers
export const recordTripOperation = (operation, status) => {
  tripOperations.labels(operation, status).inc();
};

export const recordUserOperation = (operation, status) => {
  userOperations.labels(operation, status).inc();
};

export const updateActiveConnections = (type, value) => {
  activeConnections.labels(type).set(value);
};

export { register };
