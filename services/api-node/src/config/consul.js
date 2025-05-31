// Simple Consul HTTP client
class ConsulClient {
  constructor(host = "consul", port = 8500) {
    this.baseUrl = `http://${host}:${port}`;
  }
  async registerService(service) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/agent/service/register`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(service),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Consul registration error:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to register service: ${error.message}`);
    }
  }

  async deregisterService(serviceId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/agent/service/deregister/${serviceId}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to deregister service: ${error.message}`);
    }
  }
  async getServices() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/agent/services`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get services: ${error.message}`);
    }
  }

  async getAllServices() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/catalog/services`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get all services: ${error.message}`);
    }
  }

  async discoverService(serviceName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/catalog/service/${serviceName}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const services = await response.json();
      return services.filter(
        (service) => service.ServiceAddress || service.Address
      );
    } catch (error) {
      throw new Error(
        `Failed to discover service ${serviceName}: ${error.message}`
      );
    }
  }

  async getHealthyServices(serviceName) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/health/service/${serviceName}?passing=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const healthData = await response.json();
      return healthData.map((item) => item.Service);
    } catch (error) {
      throw new Error(
        `Failed to get healthy services for ${serviceName}: ${error.message}`
      );
    }
  }
}

const consul = new ConsulClient(
  process.env.CONSUL_HOST || "consul",
  process.env.CONSUL_PORT || 8500
);

export default consul;
