import express from "express";
import cors from "cors";
import axios from "axios";
import NodeCache from "node-cache";
import rateLimit from "express-rate-limit";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";
import { Consul } from "@creditkarma/consul-client";
import { register, collectDefaultMetrics } from "prom-client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Initialize Consul
const consul = new Consul({
  host: process.env.CONSUL_HOST || "consul",
  port: process.env.CONSUL_PORT || 8500,
});

// Initialize Prometheus metrics
collectDefaultMetrics({ register });

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
    version: "1.0.0",
  });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Load proto file for gRPC
const PROTO_PATH = path.join(__dirname, "../../contracts/tripify.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const tripifyProto = grpc.loadPackageDefinition(packageDefinition).tripify.v1;

// Helper function to get cached data with Redis fallback
async function getCachedData(key, fetchFunction, ttl = 300) {
  try {
    // Try local cache first
    let data = cache.get(key);
    if (data) {
      return data;
    }

    // Try Redis cache
    const redisData = await redis.get(key);
    if (redisData) {
      data = JSON.parse(redisData);
      // Store in local cache
      cache.set(key, data, ttl);
      return data;
    }

    // Fetch fresh data
    data = await fetchFunction();

    // Store in both caches
    cache.set(key, data, ttl);
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    throw error;
  }
}

// gRPC Service Implementations
const dataService = {
  async GetFlights(call, callback) {
    try {
      const { origin, destination, departure_date, return_date, adults } =
        call.request;
      const cacheKey = `flights:${origin}:${destination}:${departure_date}:${return_date}:${adults}`;

      const flightData = await getCachedData(cacheKey, async () => {
        // Mock flight data for demo - replace with actual Amadeus API call
        return {
          flights: [
            {
              id: "FL001",
              airline: "Emirates",
              flight_number: "EK203",
              origin: origin,
              destination: destination,
              departure_time: "2024-02-15T08:00:00Z",
              arrival_time: "2024-02-15T16:30:00Z",
              duration: "8h 30m",
              price: {
                amount: 850.0,
                currency: "USD",
              },
              stops: 0,
              aircraft: "Boeing 777",
            },
            {
              id: "FL002",
              airline: "Lufthansa",
              flight_number: "LH441",
              origin: origin,
              destination: destination,
              departure_time: "2024-02-15T14:20:00Z",
              arrival_time: "2024-02-15T22:45:00Z",
              duration: "8h 25m",
              price: {
                amount: 720.0,
                currency: "USD",
              },
              stops: 1,
              aircraft: "Airbus A330",
            },
          ],
        };
      });

      callback(null, {
        flights: flightData.flights.map((flight) => ({
          id: flight.id,
          airline: flight.airline,
          flight_number: flight.flight_number,
          origin: flight.origin,
          destination: flight.destination,
          departure_time: flight.departure_time,
          arrival_time: flight.arrival_time,
          duration: flight.duration,
          price: flight.price,
          stops: flight.stops,
          aircraft: flight.aircraft,
        })),
      });
    } catch (error) {
      console.error("GetFlights error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  async GetHotels(call, callback) {
    try {
      const { city, check_in, check_out, guests, rooms } = call.request;
      const cacheKey = `hotels:${city}:${check_in}:${check_out}:${guests}:${rooms}`;

      const hotelData = await getCachedData(cacheKey, async () => {
        // Mock hotel data for demo
        return {
          hotels: [
            {
              id: "HT001",
              name: "Grand Luxury Hotel",
              city: city,
              address: "123 Main Street, Downtown",
              rating: 4.8,
              review_count: 1250,
              price_per_night: {
                amount: 280.0,
                currency: "USD",
              },
              amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant"],
              image_url:
                "https://images.unsplash.com/photo-1566073771259-6a8506099945",
              cancellation_policy:
                "Free cancellation until 24 hours before check-in",
            },
            {
              id: "HT002",
              name: "Boutique City Hotel",
              city: city,
              address: "456 Central Avenue",
              rating: 4.5,
              review_count: 890,
              price_per_night: {
                amount: 180.0,
                currency: "USD",
              },
              amenities: ["WiFi", "Restaurant", "Bar", "Business Center"],
              image_url:
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
              cancellation_policy:
                "Free cancellation until 48 hours before check-in",
            },
          ],
        };
      });

      callback(null, {
        hotels: hotelData.hotels.map((hotel) => ({
          id: hotel.id,
          name: hotel.name,
          city: hotel.city,
          address: hotel.address,
          rating: hotel.rating,
          review_count: hotel.review_count,
          price_per_night: hotel.price_per_night,
          amenities: hotel.amenities,
          image_url: hotel.image_url,
          cancellation_policy: hotel.cancellation_policy,
        })),
      });
    } catch (error) {
      console.error("GetHotels error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  async GetWeather(call, callback) {
    try {
      const { city, country_code } = call.request;
      const cacheKey = `weather:${city}:${country_code}`;

      const weatherData = await getCachedData(
        cacheKey,
        async () => {
          if (WEATHER_API_KEY) {
            try {
              const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                  params: {
                    q: `${city},${country_code}`,
                    appid: WEATHER_API_KEY,
                    units: "metric",
                  },
                }
              );

              return {
                city: response.data.name,
                country: response.data.sys.country,
                temperature: response.data.main.temp,
                feels_like: response.data.main.feels_like,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                weather_condition: response.data.weather[0].main,
                description: response.data.weather[0].description,
                wind_speed: response.data.wind.speed,
                wind_direction: response.data.wind.deg,
                visibility: response.data.visibility,
                timestamp: new Date().toISOString(),
              };
            } catch (apiError) {
              console.warn(
                "Weather API error, using mock data:",
                apiError.message
              );
              return getMockWeatherData(city, country_code);
            }
          } else {
            return getMockWeatherData(city, country_code);
          }
        },
        1800
      ); // 30 minutes cache for weather

      callback(null, weatherData);
    } catch (error) {
      console.error("GetWeather error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  async GetDestinationImages(call, callback) {
    try {
      const { destination, count = 5 } = call.request;
      const cacheKey = `images:${destination}:${count}`;

      const imageData = await getCachedData(
        cacheKey,
        async () => {
          if (UNSPLASH_API_KEY) {
            try {
              const response = await axios.get(
                `https://api.unsplash.com/search/photos`,
                {
                  params: {
                    query: destination,
                    per_page: count,
                    orientation: "landscape",
                  },
                  headers: {
                    Authorization: `Client-ID ${UNSPLASH_API_KEY}`,
                  },
                }
              );

              return {
                images: response.data.results.map((photo) => ({
                  id: photo.id,
                  url: photo.urls.regular,
                  thumbnail: photo.urls.thumb,
                  alt_description:
                    photo.alt_description || `${destination} photo`,
                  photographer: photo.user.name,
                  photographer_url: photo.user.links.html,
                })),
              };
            } catch (apiError) {
              console.warn(
                "Unsplash API error, using mock data:",
                apiError.message
              );
              return getMockImageData(destination, count);
            }
          } else {
            return getMockImageData(destination, count);
          }
        },
        3600
      ); // 1 hour cache for images

      callback(null, imageData);
    } catch (error) {
      console.error("GetDestinationImages error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  async GetExchangeRates(call, callback) {
    try {
      const { base_currency, target_currencies } = call.request;
      const cacheKey = `exchange:${base_currency}:${target_currencies.join(
        ","
      )}`;

      const exchangeData = await getCachedData(
        cacheKey,
        async () => {
          // Mock exchange rate data
          const rates = {};
          target_currencies.forEach((currency) => {
            rates[currency] = Math.random() * 2 + 0.5; // Random rate between 0.5 and 2.5
          });

          return {
            base_currency: base_currency,
            rates: rates,
            timestamp: new Date().toISOString(),
          };
        },
        3600
      ); // 1 hour cache for exchange rates

      callback(null, exchangeData);
    } catch (error) {
      console.error("GetExchangeRates error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },

  async GetDestinationInfo(call, callback) {
    try {
      const { destination } = call.request;
      const cacheKey = `destination:${destination}`;

      const destinationData = await getCachedData(
        cacheKey,
        async () => {
          // Mock destination info
          return {
            name: destination,
            country: "Demo Country",
            description: `${destination} is a beautiful destination with rich culture and stunning landscapes.`,
            best_time_to_visit: "April to October",
            time_zone: "UTC+1",
            language: "English",
            currency: "USD",
            population: 1500000,
            area_km2: 1200,
            attractions: [
              `${destination} Old Town`,
              `${destination} Museum`,
              `${destination} Cathedral`,
              `${destination} Park`,
            ],
            activities: [
              "Sightseeing",
              "Museums",
              "Walking Tours",
              "Food Tours",
              "Shopping",
            ],
            transportation: ["Metro", "Bus", "Taxi", "Walking", "Bicycle"],
          };
        },
        86400
      ); // 24 hours cache for destination info

      callback(null, destinationData);
    } catch (error) {
      console.error("GetDestinationInfo error:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
  },
};

// Mock data functions
function getMockWeatherData(city, country_code) {
  return {
    city: city,
    country: country_code,
    temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
    feels_like: Math.floor(Math.random() * 30) + 5,
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
    weather_condition: "Clear",
    description: "clear sky",
    wind_speed: Math.floor(Math.random() * 10) + 2, // 2-12 m/s
    wind_direction: Math.floor(Math.random() * 360),
    visibility: 10000,
    timestamp: new Date().toISOString(),
  };
}

function getMockImageData(destination, count) {
  const images = [];
  for (let i = 0; i < count; i++) {
    images.push({
      id: `img_${i + 1}`,
      url: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=600`,
      thumbnail: `https://images.unsplash.com/photo-${
        1500000000000 + i
      }?w=300&h=200`,
      alt_description: `Beautiful ${destination} photo ${i + 1}`,
      photographer: `Photographer ${i + 1}`,
      photographer_url: `https://unsplash.com/@photographer${i + 1}`,
    });
  }
  return { images };
}

// Create gRPC server
const grpcServer = new grpc.Server();
grpcServer.addService(tripifyProto.DataService.service, dataService);

// Start servers
const PORT = process.env.PORT || 4000;
const GRPC_PORT = process.env.GRPC_PORT || 50052;

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Data Service HTTP server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Start gRPC server
grpcServer.bindAsync(
  `0.0.0.0:${GRPC_PORT}`,
  grpc.ServerCredentials.createInsecure(),
  async (err, port) => {
    if (err) {
      console.error("gRPC server failed to bind:", err);
      return;
    }

    grpcServer.start();
    console.log(`🚀 Data Service gRPC server running on port ${port}`); // Register with Consul
    try {
      await consul.agent.service.register({
        ID: `data-service-${process.env.HOSTNAME || "local"}-${port}`,
        Name: "data-service",
        Address: process.env.SERVICE_HOST || "data-service",
        Port: parseInt(port),
        Tags: ["data", "grpc", "external-apis"],
        Check: {
          GRPC: `${process.env.SERVICE_HOST || "data-service"}:${port}`,
          Interval: "10s",
          Timeout: "5s",
        },
        Meta: {
          version: process.env.SERVICE_VERSION || "1.0.0",
          environment: process.env.NODE_ENV || "development",
        },
      });
      console.log("✅ Registered data-service with Consul");
    } catch (consulErr) {
      console.warn("Failed to register with Consul:", consulErr.message);
    }
  }
);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  // Close gRPC server
  grpcServer.tryShutdown((err) => {
    if (err) {
      console.error("Error shutting down gRPC server:", err);
    } else {
      console.log("✅ gRPC server closed");
    }
  });

  // Close Redis connection
  try {
    await redis.quit();
    console.log("✅ Redis connection closed");
  } catch (error) {
    console.error("❌ Error closing Redis:", error);
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
