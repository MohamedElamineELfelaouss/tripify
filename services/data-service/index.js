import express from "express";
import cors from "cors";
import axios from "axios";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import consul from "./consul.js";

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting for external API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many API requests from this IP, please try again later.",
});

app.use("/api/external", apiLimiter);

// Configuration
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "data-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Prometheus metrics endpoint
app.get("/metrics", (req, res) => {
  // Basic metrics - in production use proper metrics library like prom-client
  res.set("Content-Type", "text/plain");
  res.send(`
# HELP tripify_data_requests_total Total number of data requests
# TYPE tripify_data_requests_total counter
tripify_data_requests_total 100

# HELP tripify_cache_hits_total Cache hits
# TYPE tripify_cache_hits_total counter
tripify_cache_hits_total 75

# HELP tripify_external_api_calls_total External API calls
# TYPE tripify_external_api_calls_total counter
tripify_external_api_calls_total 25
  `);
});

// Flight Search API (Amadeus)
app.get("/api/external/flights", async (req, res) => {
  try {
    const { from, to, departure, returnDate } = req.query;
    const cacheKey = `flights_${from}_${to}_${departure}_${returnDate}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: "cache",
        data: cached,
      });
    }

    // Mock flight data (replace with real Amadeus API)
    const mockFlights = [
      {
        id: "AF1234",
        airline: "Air France",
        from: from,
        to: to,
        departure: departure,
        arrival: returnDate,
        price: Math.floor(Math.random() * 500) + 200,
        currency: "EUR",
        duration: "2h 15m",
        stops: 0,
      },
      {
        id: "LH5678",
        airline: "Lufthansa",
        from: from,
        to: to,
        departure: departure,
        arrival: returnDate,
        price: Math.floor(Math.random() * 500) + 250,
        currency: "EUR",
        duration: "2h 45m",
        stops: 1,
      },
    ];

    cache.set(cacheKey, mockFlights);

    res.json({
      source: "api",
      data: mockFlights,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch flight data" });
  }
});

// Amadeus Flight Search
app.get("/api/flights/search", async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.query;

    // Mock implementation - replace with real Amadeus API
    const flightData = {
      flights: [
        {
          id: "AF123",
          airline: "Air France",
          origin,
          destination,
          departureDate,
          price: { amount: 450, currency: "EUR" },
          duration: "2h 30m",
        },
      ],
    };

    res.json(flightData);
  } catch (error) {
    res.status(500).json({ error: "Flight search failed" });
  }
});

// Weather Data
app.get("/api/weather/:location", async (req, res) => {
  try {
    const { location } = req.params;

    // Mock implementation - replace with OpenWeatherMap
    const weatherData = {
      location,
      temperature: 22,
      condition: "sunny",
      humidity: 65,
      forecast: [
        { date: "2025-05-30", temp: 24, condition: "cloudy" },
        { date: "2025-05-31", temp: 20, condition: "rainy" },
      ],
    };

    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: "Weather data failed" });
  }
});

// Destination Images
app.get("/api/images/:destination", async (req, res) => {
  try {
    const { destination } = req.params;

    // Mock implementation - replace with Unsplash API
    const images = {
      destination,
      images: [
        {
          id: "1",
          url: "https://images.unsplash.com/photo-1502602898536-47ad22581b52",
          photographer: "John Doe",
        },
      ],
    };

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Image search failed" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`Data service running on port ${PORT}`);

  // Register with Consul with retry logic
  const registerWithConsul = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(
          `Attempting to register with Consul (attempt ${i + 1}/${retries})...`
        );
        const serviceDefinition = {
          ID: "data-service-http",
          Name: "data-service-http",
          Tags: [
            "http",
            "data",
            "external-apis",
            // Traefik service discovery tags
            "traefik.enable=true",
            "traefik.http.routers.data-service.rule=Host(`localhost`) && PathPrefix(`/data`)",
            "traefik.http.routers.data-service.entrypoints=web",
            "traefik.http.services.data-service.loadbalancer.server.port=4000",
            "traefik.http.middlewares.data-stripprefix.stripprefix.prefixes=/data",
            "traefik.http.routers.data-service.middlewares=data-stripprefix",
          ],
          Address: "data-service",
          Port: parseInt(PORT),
          Check: {
            HTTP: `http://data-service:${PORT}/health`,
            Interval: "10s",
            Timeout: "3s",
          },
        };

        await consul.registerService(serviceDefinition);
        console.log(`✅ Registered Data Service with Consul on port ${PORT}`);
        return;
      } catch (error) {
        console.error(
          `❌ Failed to register with Consul (attempt ${i + 1}):`,
          error.message
        );
        if (i < retries - 1) {
          console.log(`Retrying in 5 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
    console.error("❌ Failed to register with Consul after all retries");
  };

  // Wait a bit for Consul to be ready
  setTimeout(() => {
    registerWithConsul();
  }, 2000);
});
