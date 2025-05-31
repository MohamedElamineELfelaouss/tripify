import grpc from "@grpc/grpc-js";

// Gateway Service gRPC Implementations
export const routeRequest = async (call, callback) => {
  try {
    const { service, method, payload, headers } = call.request;

    // Simple routing logic - in a real implementation, this would
    // route to appropriate microservices based on the service name
    const routes = {
      "trip-service": {
        host: process.env.TRIP_SERVICE_HOST || "localhost",
        port: process.env.TRIP_SERVICE_PORT || 50051,
      },
      "user-service": {
        host: process.env.USER_SERVICE_HOST || "localhost",
        port: process.env.USER_SERVICE_PORT || 50051,
      },
      "data-service": {
        host: process.env.DATA_SERVICE_HOST || "data-service",
        port: process.env.DATA_SERVICE_PORT || 50052,
      },
      "recommendation-service": {
        host: process.env.RECOMMENDATION_SERVICE_HOST || "localhost",
        port: process.env.RECOMMENDATION_SERVICE_PORT || 50053,
      },
      "notification-service": {
        host: process.env.NOTIFICATION_SERVICE_HOST || "localhost",
        port: process.env.NOTIFICATION_SERVICE_PORT || 50054,
      },
    };

    const route = routes[service];

    if (!route) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Service ${service} not found`,
      });
    }

    // For this example, we'll return a success response
    // In a real implementation, you would forward the request to the appropriate service
    callback(null, {
      status_code: 200,
      payload: Buffer.from(
        JSON.stringify({
          message: `Request routed to ${service}`,
          method,
          timestamp: new Date().toISOString(),
        })
      ),
      headers: {
        "content-type": "application/json",
        "x-gateway-version": "1.0.0",
        ...headers,
      },
    });
  } catch (error) {
    console.error("Route request error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const getHealth = async (call, callback) => {
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION || "1.0.0",
      uptime: process.uptime(),
      services: {
        database: "healthy", // You could add actual health checks here
        redis: "healthy",
        api: "healthy",
      },
    };

    callback(null, {
      status: "SERVING",
      timestamp: healthStatus.timestamp,
      version: healthStatus.version,
      uptime_seconds: Math.floor(healthStatus.uptime),
      services: JSON.stringify(healthStatus.services),
    });
  } catch (error) {
    console.error("Health check error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};
