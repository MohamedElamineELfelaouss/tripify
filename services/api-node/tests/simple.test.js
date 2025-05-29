const axios = require("axios");

const API_BASE_URL = "http://localhost:3000";

describe("Tripify API Tests", () => {
  let authToken;
  let testTripId;

  const testUser = {
    firstName: "Jest",
    lastName: "User",
    email: `jest.user.${Date.now()}@example.com`,
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

  test("Health check endpoint", async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toBe("Tripify API is running!");
  });

  test("User registration", async () => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/users/register`,
      testUser
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user.email).toBe(testUser.email);
    expect(response.data.data.token).toBeDefined();

    authToken = response.data.data.token;
  });

  test("User login", async () => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/users/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
  });

  test("Create trip", async () => {
    const testTrip = {
      title: "Jest Test Trip",
      description: "A test trip created by Jest",
      destination: "Tokyo, Japan",
      startDate: "2025-08-01",
      endDate: "2025-08-10",
      budget: 3000,
      isPublic: false,
    };

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

    testTripId = response.data.data.id;
  });

  test("Get user trips", async () => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/trips`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.trips).toBeInstanceOf(Array);
    expect(response.data.data.trips.length).toBeGreaterThan(0);
  });

  test("Update trip", async () => {
    const updateData = { title: "Updated Jest Test Trip" };

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
  });

  test("Public trip search", async () => {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/trips/public/search?destination=Paris`
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.trips).toBeInstanceOf(Array);
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
