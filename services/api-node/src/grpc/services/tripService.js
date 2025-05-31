import Trip from "../../models/Trip.js";
import User from "../../models/User.js";
import { createError } from "../../utils/errorUtils.js";
import Redis from "ioredis";
import grpc from "@grpc/grpc-js";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Trip Service gRPC Implementations
export const createTrip = async (call, callback) => {
  try {
    const {
      title,
      description,
      destination,
      start_date,
      end_date,
      budget,
      is_public,
      user_id,
    } = call.request;

    const trip = new Trip({
      title,
      description,
      destination,
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      budget: {
        amount: budget.amount,
        currency: budget.currency,
      },
      isPublic: is_public,
      createdBy: user_id,
      collaborators: [user_id],
    });

    await trip.save();

    // Cache the trip
    await redis.setex(`trip:${trip._id}`, 3600, JSON.stringify(trip));

    callback(null, {
      trip: {
        id: trip._id.toString(),
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        start_date: trip.startDate.toISOString(),
        end_date: trip.endDate.toISOString(),
        budget: {
          amount: trip.budget.amount,
          currency: trip.budget.currency,
        },
        is_public: trip.isPublic,
        collaborators: trip.collaborators.map((c) => c.toString()),
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create trip error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const getTrip = async (call, callback) => {
  try {
    const { trip_id, user_id } = call.request;

    // Try cache first
    const cached = await redis.get(`trip:${trip_id}`);
    if (cached) {
      const trip = JSON.parse(cached);

      // Check access permissions
      if (!trip.isPublic && !trip.collaborators.includes(user_id)) {
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "Access denied",
        });
      }

      return callback(null, {
        trip: {
          id: trip._id,
          title: trip.title,
          description: trip.description,
          destination: trip.destination,
          start_date: trip.startDate,
          end_date: trip.endDate,
          budget: trip.budget,
          is_public: trip.isPublic,
          collaborators: trip.collaborators,
          created_at: trip.createdAt,
          updated_at: trip.updatedAt,
        },
      });
    }

    // Fetch from database
    const trip = await Trip.findById(trip_id).populate(
      "collaborators",
      "name email"
    );

    if (!trip) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Trip not found",
      });
    }

    // Check access permissions
    if (
      !trip.isPublic &&
      !trip.collaborators.some((c) => c._id.toString() === user_id)
    ) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Access denied",
      });
    }

    // Cache the result
    await redis.setex(`trip:${trip._id}`, 3600, JSON.stringify(trip));

    callback(null, {
      trip: {
        id: trip._id.toString(),
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        start_date: trip.startDate.toISOString(),
        end_date: trip.endDate.toISOString(),
        budget: {
          amount: trip.budget.amount,
          currency: trip.budget.currency,
        },
        is_public: trip.isPublic,
        collaborators: trip.collaborators.map((c) => c._id.toString()),
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get trip error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const updateTrip = async (call, callback) => {
  try {
    const {
      trip_id,
      user_id,
      title,
      description,
      destination,
      start_date,
      end_date,
      budget,
      is_public,
    } = call.request;

    const trip = await Trip.findById(trip_id);

    if (!trip) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Trip not found",
      });
    }

    // Check if user is owner or collaborator
    if (
      trip.createdBy.toString() !== user_id &&
      !trip.collaborators.includes(user_id)
    ) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Access denied",
      });
    }

    // Update fields
    if (title) trip.title = title;
    if (description) trip.description = description;
    if (destination) trip.destination = destination;
    if (start_date) trip.startDate = new Date(start_date);
    if (end_date) trip.endDate = new Date(end_date);
    if (budget) {
      trip.budget.amount = budget.amount;
      trip.budget.currency = budget.currency;
    }
    if (typeof is_public !== "undefined") trip.isPublic = is_public;

    await trip.save();

    // Update cache
    await redis.setex(`trip:${trip._id}`, 3600, JSON.stringify(trip));

    callback(null, {
      trip: {
        id: trip._id.toString(),
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        start_date: trip.startDate.toISOString(),
        end_date: trip.endDate.toISOString(),
        budget: {
          amount: trip.budget.amount,
          currency: trip.budget.currency,
        },
        is_public: trip.isPublic,
        collaborators: trip.collaborators.map((c) => c.toString()),
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update trip error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const deleteTrip = async (call, callback) => {
  try {
    const { trip_id, user_id } = call.request;

    const trip = await Trip.findById(trip_id);

    if (!trip) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Trip not found",
      });
    }

    // Only owner can delete
    if (trip.createdBy.toString() !== user_id) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Only trip owner can delete",
      });
    }

    await Trip.findByIdAndDelete(trip_id);

    // Remove from cache
    await redis.del(`trip:${trip_id}`);

    callback(null, {
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const searchTrips = async (call, callback) => {
  try {
    const {
      query,
      destination,
      min_budget,
      max_budget,
      start_date,
      end_date,
      page = 1,
      limit = 10,
      user_id,
    } = call.request;

    const filter = {
      $or: [{ isPublic: true }, { collaborators: user_id }],
    };

    if (query) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      ];
    }

    if (destination) {
      filter.destination = { $regex: destination, $options: "i" };
    }

    if (min_budget || max_budget) {
      filter["budget.amount"] = {};
      if (min_budget) filter["budget.amount"].$gte = min_budget;
      if (max_budget) filter["budget.amount"].$lte = max_budget;
    }

    if (start_date || end_date) {
      filter.startDate = {};
      if (start_date) filter.startDate.$gte = new Date(start_date);
      if (end_date) filter.startDate.$lte = new Date(end_date);
    }

    const skip = (page - 1) * limit;
    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email");

    const total = await Trip.countDocuments(filter);

    callback(null, {
      trips: trips.map((trip) => ({
        id: trip._id.toString(),
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        start_date: trip.startDate.toISOString(),
        end_date: trip.endDate.toISOString(),
        budget: {
          amount: trip.budget.amount,
          currency: trip.budget.currency,
        },
        is_public: trip.isPublic,
        collaborators: trip.collaborators.map((c) => c.toString()),
        created_at: trip.createdAt.toISOString(),
        updated_at: trip.updatedAt.toISOString(),
      })),
      total_count: total,
      page: page,
      total_pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search trips error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const addCollaborator = async (call, callback) => {
  try {
    const { trip_id, user_id, collaborator_email } = call.request;

    const trip = await Trip.findById(trip_id);

    if (!trip) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Trip not found",
      });
    }

    // Check if user is owner or collaborator
    if (
      trip.createdBy.toString() !== user_id &&
      !trip.collaborators.includes(user_id)
    ) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Access denied",
      });
    }

    // Find collaborator by email
    const collaborator = await User.findOne({ email: collaborator_email });

    if (!collaborator) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }

    // Check if already a collaborator
    if (trip.collaborators.includes(collaborator._id)) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "User is already a collaborator",
      });
    }

    trip.collaborators.push(collaborator._id);
    await trip.save();

    // Update cache
    await redis.del(`trip:${trip_id}`);

    callback(null, {
      success: true,
      message: "Collaborator added successfully",
      collaborator: {
        id: collaborator._id.toString(),
        name: collaborator.name,
        email: collaborator.email,
      },
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

export const getTripAnalytics = async (call, callback) => {
  try {
    const { user_id, time_range } = call.request;

    const dateFilter = {};
    const now = new Date();

    switch (time_range) {
      case "week":
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case "month":
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case "year":
        dateFilter.createdAt = {
          $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        // All time
        break;
    }

    const userFilter = {
      ...dateFilter,
      $or: [{ createdBy: user_id }, { collaborators: user_id }],
    };

    const analytics = await Promise.all([
      Trip.countDocuments(userFilter),
      Trip.countDocuments({ ...userFilter, isPublic: true }),
      Trip.aggregate([
        { $match: userFilter },
        { $group: { _id: null, avgBudget: { $avg: "$budget.amount" } } },
      ]),
      Trip.aggregate([
        { $match: userFilter },
        { $group: { _id: "$destination", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const [totalTrips, publicTrips, budgetData, topDestinations] = analytics;

    callback(null, {
      total_trips: totalTrips,
      public_trips: publicTrips,
      private_trips: totalTrips - publicTrips,
      average_budget: budgetData[0]?.avgBudget || 0,
      top_destinations: topDestinations.map((dest) => ({
        destination: dest._id,
        trip_count: dest.count,
      })),
      time_range: time_range || "all",
    });
  } catch (error) {
    console.error("Get trip analytics error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};
