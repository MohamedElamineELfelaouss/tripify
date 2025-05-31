import express from "express";
import consul from "../config/consul.js";

const router = express.Router();

/**
 * Test service discovery - Get data service info via Consul
 */
router.get("/data-service", async (req, res) => {
  try {
    // Discover data-service through Consul
    const services = await consul.discoverService("data-service-http");

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data service not found in Consul registry",
      });
    }
    const dataService = services[0];
    const serviceUrl = `http://${dataService.ServiceAddress || dataService.Address}:${dataService.ServicePort || dataService.Port}`;

    // Make a health check request to the discovered service
    try {
      const response = await fetch(`${serviceUrl}/health`);
      const healthData = await response.json();

      res.json({
        success: true,
        message:
          "Successfully discovered and contacted data service via Consul",
        discovery: {
          serviceName: dataService.ServiceName || dataService.Service,
          address: dataService.ServiceAddress || dataService.Address,
          port: dataService.ServicePort || dataService.Port,
          tags: dataService.ServiceTags || dataService.Tags,
          serviceUrl,
        },
        healthCheck: healthData,
        timestamp: new Date().toISOString(),
      });
    } catch (fetchError) {
      res.status(503).json({
        success: false,
        message: "Service discovered but not reachable",
        discovery: {
          serviceName: dataService.ServiceName || dataService.Service,
          address: dataService.ServiceAddress || dataService.Address,
          port: dataService.ServicePort || dataService.Port,
          serviceUrl,
        },
        error: fetchError.message,
      });
    }
  } catch (error) {
    console.error("Service discovery error:", error);
    res.status(500).json({
      success: false,
      message: "Service discovery failed",
      error: error.message,
    });
  }
});

/**
 * List all services in Consul
 */
router.get("/services", async (req, res) => {
  try {
    const allServices = await consul.getAllServices();

    res.json({
      success: true,
      message: "Retrieved all services from Consul",
      services: allServices,
      count: Object.keys(allServices).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve services from Consul",
      error: error.message,
    });
  }
});

/**
 * Test inter-service communication - Get weather data via data-service
 */
router.get("/weather/:city", async (req, res) => {
  try {
    const { city } = req.params;

    // Discover data-service through Consul
    const services = await consul.discoverService("data-service-http");

    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data service not found in Consul registry",
      });
    }
    const dataService = services[0];
    const serviceUrl = `http://${dataService.ServiceAddress || dataService.Address}:${dataService.ServicePort || dataService.Port}`;

    // Make request to data service weather endpoint
    try {
      const response = await fetch(`${serviceUrl}/api/weather/${city}`);

      if (!response.ok) {
        throw new Error(
          `Data service responded with status: ${response.status}`
        );
      }

      const weatherData = await response.json();

      res.json({
        success: true,
        message: `Weather data retrieved via service discovery for ${city}`,
        data: weatherData,
        serviceInfo: {
          discoveredFrom: "consul",
          serviceName: dataService.ServiceName || dataService.Service,
          serviceAddress: `${dataService.ServiceAddress || dataService.Address}:${dataService.ServicePort || dataService.Port}`,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (fetchError) {
      res.status(503).json({
        success: false,
        message: "Failed to communicate with data service",
        error: fetchError.message,
        serviceInfo: {
          serviceName: dataService.ServiceName || dataService.Service,
          serviceAddress: `${dataService.ServiceAddress || dataService.Address}:${dataService.ServicePort || dataService.Port}`,
        },
      });
    }
  } catch (error) {
    console.error("Inter-service communication error:", error);
    res.status(500).json({
      success: false,
      message: "Service discovery and communication failed",
      error: error.message,
    });
  }
});

export default router;
