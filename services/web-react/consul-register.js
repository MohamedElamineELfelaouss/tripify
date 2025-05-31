// Simple Consul registration for Nginx static service
const http = require("http");

class ConsulClient {
  constructor(host = "consul", port = 8500) {
    this.baseUrl = `http://${host}:${port}`;
  }

  async registerService(service) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(service);
      const options = {
        hostname: "consul",
        port: 8500,
        path: "/v1/agent/service/register",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      };

      const req = http.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(
            "✅ Successfully registered web-react service with Consul"
          );
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.write(data);
      req.end();
    });
  }
}

async function registerWithConsul() {
  const consul = new ConsulClient();

  const retries = 5;
  for (let i = 0; i < retries; i++) {
    try {
      const serviceDefinition = {
        ID: "web-react-frontend",
        Name: "web-react-frontend",
        Tags: [
          "frontend",
          "react",
          "nginx",
          // Traefik service discovery tags
          "traefik.enable=true",
          "traefik.http.routers.frontend.rule=Host(`localhost`)",
          "traefik.http.routers.frontend.entrypoints=web",
          "traefik.http.services.frontend.loadbalancer.server.port=80",
          // Highest priority to handle root path
          "traefik.http.routers.frontend.priority=1",
        ],
        Address: "web-react",
        Port: 80,
        Check: {
          HTTP: "http://web-react:80/",
          Interval: "10s",
          Timeout: "3s",
        },
      };

      await consul.registerService(serviceDefinition);
      console.log(
        "🎯 Web React service registered with Consul for Traefik discovery"
      );
      return;
    } catch (error) {
      console.error(
        `❌ Failed to register with Consul (attempt ${i + 1}):`,
        error.message
      );
      if (i < retries - 1) {
        console.log("Retrying in 3 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
  console.error("❌ Failed to register with Consul after all retries");
}

// Wait for Consul and then register
setTimeout(() => {
  registerWithConsul();
}, 5000);

// Keep the process alive
setInterval(() => {
  // Health check - could ping Consul here
}, 30000);
