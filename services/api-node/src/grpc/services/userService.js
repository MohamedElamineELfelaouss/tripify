import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import grpc from "@grpc/grpc-js";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// User Service gRPC Implementations
export const createUser = async (call, callback) => {
  try {
    const { name, email, password, preferences } = call.request;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      preferences: preferences || {},
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "tripify-secret",
      { expiresIn: "7d" }
    );

    // Cache user data
    await redis.setex(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      })
    );

    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: JSON.stringify(user.preferences),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      token,
    });
  } catch (error) {
    console.error("Create user error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const getUser = async (call, callback) => {
  try {
    const { user_id } = call.request;

    // Try cache first
    const cached = await redis.get(`user:${user_id}`);
    if (cached) {
      const userData = JSON.parse(cached);
      return callback(null, {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          preferences: JSON.stringify(userData.preferences),
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        },
      });
    }

    // Fetch from database
    const user = await User.findById(user_id).select("-password");

    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Cache the result
    await redis.setex(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
    );

    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: JSON.stringify(user.preferences),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const updateUser = async (call, callback) => {
  try {
    const { user_id, name, email, preferences } = call.request;

    const user = await User.findById(user_id);

    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "Email already in use",
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (preferences) {
      user.preferences =
        typeof preferences === "string" ? JSON.parse(preferences) : preferences;
    }

    await user.save();

    // Update cache
    await redis.setex(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
    );

    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: JSON.stringify(user.preferences),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const authenticateUser = async (call, callback) => {
  try {
    const { email, password } = call.request;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "tripify-secret",
      { expiresIn: "7d" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || "tripify-refresh-secret",
      { expiresIn: "30d" }
    );

    // Store refresh token in Redis
    await redis.setex(
      `refresh_token:${user._id}`,
      30 * 24 * 60 * 60,
      refreshToken
    );

    // Cache user data
    await redis.setex(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      })
    );

    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: JSON.stringify(user.preferences),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      token,
      refresh_token: refreshToken,
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (error) {
    console.error("Authenticate user error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const refreshToken = async (call, callback) => {
  try {
    const { refresh_token } = call.request;

    // Verify refresh token
    const decoded = jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET || "tripify-refresh-secret"
    );

    if (decoded.type !== "refresh") {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "Invalid refresh token",
      });
    }

    // Check if refresh token exists in Redis
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (!storedToken || storedToken !== refresh_token) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "Refresh token not found or expired",
      });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Generate new access token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "tripify-secret",
      { expiresIn: "7d" }
    );

    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        preferences: JSON.stringify(user.preferences),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      token,
      refresh_token: refresh_token, // Keep the same refresh token
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "Invalid or expired refresh token",
      });
    }

    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const resetPassword = async (call, callback) => {
  try {
    const { email, reset_token, new_password } = call.request;

    // In a real implementation, you would:
    // 1. Verify the reset token (sent via email)
    // 2. Check if it's not expired
    // 3. Update the password

    // For this example, we'll implement a basic version
    const user = await User.findOne({ email });

    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    user.password = hashedPassword;
    await user.save();

    // Invalidate all existing tokens
    await redis.del(`refresh_token:${user._id}`);
    await redis.del(`user:${user._id}`);

    callback(null, {
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const updateUserPreferences = async (call, callback) => {
  try {
    const { user_id, preferences } = call.request;

    const user = await User.findById(user_id);

    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Update preferences
    user.preferences =
      typeof preferences === "string" ? JSON.parse(preferences) : preferences;

    await user.save();

    // Update cache
    await redis.setex(
      `user:${user._id}`,
      3600,
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
    );

    callback(null, {
      success: true,
      message: "Preferences updated successfully",
      preferences: JSON.stringify(user.preferences),
    });
  } catch (error) {
    console.error("Update user preferences error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};
