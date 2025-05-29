import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

describe("Tripify API Integration Tests", () => {
  let authToken;
  let testUserId;
  let testTripId;

  const testUser = {
    firstName: "Integration",
    lastName: "Test",
    email: `integration.test.${Date.now()}@example.com`,
    password: "testpass123",
  };

  beforeAll(async () => {
    // Wait for API to be ready
    let attempts = 0;
    while (attempts < 10) {
      try {
        await axios.get(`${API_BASE_URL}/health`);
        break;
      } catch (error) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  });

  describe("Health Check", () => {
    test("should return API status", async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toBe("Tripify API is running!");
    });
  });

  describe("User Registration and Authentication", () => {
    test("should register a new user", async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/register`,
        testUser
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.user.email).toBe(testUser.email);
      expect(response.data.data.token).toBeDefined();

      authToken = response.data.data.token;
      testUserId = response.data.data.user.id;
    });

    test("should login with valid credentials", async () => {
      const response = await axios.post(`${API_BASE_URL}/api/v1/users/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.token).toBeDefined();
    });

    test("should get user profile with auth token", async () => {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.email).toBe(testUser.email);
    });
  });

  describe("Trip Management", () => {
    const testTrip = {
      title: "Test Trip to Paris",
      description: "A wonderful test trip",
      destination: "Paris, France",
      startDate: "2025-07-01",
      endDate: "2025-07-10",
      budget: 2000,
      isPublic: true,
    };

    test("should create a new trip", async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/trips`,
        testTrip,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(testTrip.title);
      expect(response.data.data.destination).toBe(testTrip.destination);

      testTripId = response.data.data.id;
    });

    test("should get user trips", async () => {
      const response = await axios.get(`${API_BASE_URL}/api/v1/trips`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.trips).toBeInstanceOf(Array);
      expect(response.data.data.trips.length).toBeGreaterThan(0);
    });

    test("should get a specific trip", async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trips/${testTripId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(testTripId);
    });

    test("should update a trip", async () => {
      const updateData = {
        title: "Updated Test Trip to Paris",
        budget: 2500,
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/trips/${testTripId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(updateData.title);
      expect(response.data.data.budget).toBe(updateData.budget);
    });

    test("should search public trips", async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trips/public/search?destination=Paris`
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.trips).toBeInstanceOf(Array);
    });
  });

  describe("Rate Limiting", () => {
    test("should enforce rate limits", async () => {
      const requests = [];

      // Make multiple rapid requests
      for (let i = 0; i < 50; i++) {
        requests.push(
          axios.get(`${API_BASE_URL}/health`).catch((error) => error.response)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(
        (res) => res && res.status === 429
      );

      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testTripId && authToken) {
      try {
        await axios.delete(`${API_BASE_URL}/api/v1/trips/${testTripId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (error) {
        console.log("Cleanup error:", error.message);
      }
    }
  });
});
