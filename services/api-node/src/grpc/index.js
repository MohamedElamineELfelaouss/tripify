import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

// Services
import * as tripService from "./services/tripService.js";
import * as userService from "./services/userService.js";
import * as gatewayService from "./services/gatewayService.js";

// Metrics and health
import { register as metricsRegister } from "../monitoring/metrics.js";
import consul from "../config/consul.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load proto file
const PROTO_PATH = "/contracts/tripify.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const tripifyProto = grpc.loadPackageDefinition(packageDefinition).tripify.v1;

// gRPC Server Implementation
export class GrpcServer {
  constructor() {
    this.server = new grpc.Server();
    this.setupServices();
  }

  setupServices() {
    // API Gateway Service
    this.server.addService(tripifyProto.ApiGateway.service, {
      RouteRequest: gatewayService.routeRequest,
      GetHealth: gatewayService.getHealth,
    });

    // Trip Service
    this.server.addService(tripifyProto.TripService.service, {
      CreateTrip: tripService.createTrip,
      GetTrip: tripService.getTrip,
      UpdateTrip: tripService.updateTrip,
      DeleteTrip: tripService.deleteTrip,
      SearchTrips: tripService.searchTrips,
      AddCollaborator: tripService.addCollaborator,
      GetTripAnalytics: tripService.getTripAnalytics,
    });

    // User Service
    this.server.addService(tripifyProto.UserService.service, {
      CreateUser: userService.createUser,
      GetUser: userService.getUser,
      UpdateUser: userService.updateUser,
      AuthenticateUser: userService.authenticateUser,
      RefreshToken: userService.refreshToken,
      ResetPassword: userService.resetPassword,
      UpdateUserPreferences: userService.updateUserPreferences,
    });
  }

  async start(port = process.env.GRPC_PORT || 50051) {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        async (err, port) => {
          if (err) {
            console.error("gRPC server failed to bind:", err);
            reject(err);
            return;
          }

          this.server.start();
          console.log(`🚀 gRPC server running on port ${port}`);

          // Register with Consul
          try {
            await this.registerWithConsul(port);
          } catch (consulErr) {
            console.warn("Failed to register with Consul:", consulErr.message);
          }

          resolve(port);
        }
      );
    });
  }
  async registerWithConsul(port) {
    const serviceName = "tripify-api";
    const serviceId = `${serviceName}-${process.env.HOSTNAME || "local"}-${port}`;

    const payload = {
      Node: process.env.HOSTNAME || "local",
      Address: process.env.SERVICE_HOST || "api-service",
      Service: {
        ID: serviceId,
        Service: serviceName,
        Tags: ["api", "grpc", "tripify"],
        Address: process.env.SERVICE_HOST || "api-service",
        Port: parseInt(port),
        Meta: {
          version: process.env.SERVICE_VERSION || "1.0.0",
          environment: process.env.NODE_ENV || "development",
        },
      },
      Check: {
        Name: `${serviceName} health check`,
        ServiceID: serviceId,
        Definition: {
          TCP: `${process.env.SERVICE_HOST || "api-service"}:${port}`,
          Interval: "10s",
          Timeout: "5s",
          DeregisterCriticalServiceAfter: "30s",
        },
      },
    };

    await consul.registerEntity(payload);
    console.log(`✅ Registered ${serviceName} with Consul`);
  }

  async stop() {
    return new Promise((resolve) => {
      this.server.tryShutdown((err) => {
        if (err) {
          console.error("Error shutting down gRPC server:", err);
        } else {
          console.log("🛑 gRPC server shut down gracefully");
        }
        resolve();
      });
    });
  }
}

export default GrpcServer;
