import request from "supertest";
import app from "../src/index.js";

describe("Tripify API", () => {
  let authToken;
  let userId;

  describe("Health Check", () => {
    test("GET /health should return API status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Tripify API is running!");
      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
    });
  });

  describe("User Authentication", () => {
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: `test${Date.now()}@example.com`,
      password: "password123",
    };

    test("POST /api/v1/users/register should create a new user", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);

      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    test("POST /api/v1/users/register should reject duplicate email", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User already exists with this email");
    });

    test("POST /api/v1/users/login should authenticate user", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    test("POST /api/v1/users/login should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("Protected Routes", () => {
    test("GET /api/v1/users/profile should require authentication", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test("GET /api/v1/users/profile should return user data when authenticated", async () => {
      const response = await request(app)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(userId);
    });

    test("GET /api/v1/users/leaderboard should return leaderboard data", async () => {
      const response = await request(app)
        .get("/api/v1/users/leaderboard")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.leaderboard).toBeDefined();
      expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    test("Registration should be rate limited after 3 attempts", async () => {
      // Note: This test might fail if other tests have used up the rate limit
      // In a real test environment, you'd want to reset rate limits between tests

      const attempts = [];
      for (let i = 0; i < 4; i++) {
        const testUser = {
          firstName: "Test",
          lastName: "User",
          email: `ratetest${Date.now()}-${i}@example.com`,
          password: "password123",
        };

        const response = await request(app)
          .post("/api/v1/users/register")
          .send(testUser);

        attempts.push(response.status);
      }

      // First few should succeed (201), last one should be rate limited (429)
      expect(attempts[attempts.length - 1]).toBe(429);
    }, 10000); // Increased timeout for multiple requests
  });

  describe("Input Validation", () => {
    test("POST /api/v1/users/register should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send({
          email: "incomplete@example.com",
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("POST /api/v1/users/register should validate email format", async () => {
      const response = await request(app)
        .post("/api/v1/users/register")
        .send({
          firstName: "Test",
          lastName: "User",
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Error Handling", () => {
    test("GET /nonexistent should return 404", async () => {
      const response = await request(app).get("/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Route.*not found/);
    });
  });
});
