import axios from "axios";

// Simple Consul HTTP client for data-service
class ConsulClient {
  constructor(host = "consul", port = 8500) {
    this.baseUrl = `http://${host}:${port}`;
  }

  async registerService(service) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/v1/agent/service/register`,
        service,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (error) {
      console.error(
        "Consul registration error:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to register service: ${error.message}`);
    }
  }

  async deregisterService(serviceId) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/v1/agent/service/deregister/${serviceId}`
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to deregister service: ${error.message}`);
    }
  }

  async getServices() {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/agent/services`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get services: ${error.message}`);
    }
  }
}

const consul = new ConsulClient(
  process.env.CONSUL_HOST || "consul",
  process.env.CONSUL_PORT || 8500
);

export default consul;
