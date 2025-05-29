import express from "express";
import mongoose from "mongoose";
import Trip from "../models/Trip.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply rate limiting to all trip routes
router.use(apiLimiter);

// GET /api/trips - Get user's trips with filtering and pagination
router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      destination,
      search,
      sortBy = "startDate",
      sortOrder = "desc",
    } = req.query; // Build query filters
    const query = {
      $or: [
        { creator: req.user._id },
        {
          "collaborators.user": req.user._id,
          "collaborators.status": "accepted",
        },
      ],
    };

    if (status) {
      query.status = status;
    }

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const trips = await Trip.find(query)
      .populate("creator", "name email")
      .populate("collaborators.user", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trips",
    });
  }
});

// GET /api/trips/:id - Get specific trip details
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid trip ID",
      });
    }

    const trip = await Trip.findById(id)
      .populate("creator", "name email")
      .populate("collaborators.user", "name email");

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // Check if user has access to this trip
    const hasAccess =
      trip.creator._id.toString() === req.user._id.toString() ||
      trip.collaborators.some(
        (collab) =>
          collab.user._id.toString() === req.user._id.toString() &&
          collab.status === "accepted"
      ) ||
      (trip.privacy === "public" && trip.isPublic);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied to this trip",
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trip",
    });
  }
});

// POST /api/trips - Create new trip
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      startDate,
      endDate,
      budget,
      privacy = "private",
      tags = [],
    } = req.body;

    // Validate required fields
    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Title, destination, start date, and end date are required",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        error: "Start date must be in the future",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date",
      });
    }

    // Create new trip
    const trip = new Trip({
      title,
      description,
      destination,
      startDate: start,
      endDate: end,
      budget: budget || {},
      privacy,
      tags,
      creator: req.user._id,
    });

    await trip.save();

    // Populate creator info
    await trip.populate("creator", "name email");

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error creating trip:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create trip",
    });
  }
});

// PUT /api/trips/:id - Update trip
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid trip ID",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // Check if user can edit this trip
    const canEdit =
      trip.creator.toString() === req.user._id.toString() ||
      trip.collaborators.some(
        (collab) =>
          collab.user.toString() === req.user._id.toString() &&
          collab.status === "accepted" &&
          ["editor", "admin"].includes(collab.role)
      );

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: "Permission denied to edit this trip",
      });
    } // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "destination",
      "startDate",
      "endDate",
      "budget",
      "status",
      "privacy",
      "tags",
      "itinerary",
      "accommodations",
      "transportation",
      "photos",
      "isPublic",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate dates if they're being updated
    if (updates.startDate || updates.endDate) {
      const start = new Date(updates.startDate || trip.startDate);
      const end = new Date(updates.endDate || trip.endDate);

      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: "End date must be after start date",
        });
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("creator", "name email")
      .populate("collaborators.user", "name email");

    res.json({
      success: true,
      message: "Trip updated successfully",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Error updating trip:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update trip",
    });
  }
});

// DELETE /api/trips/:id - Delete trip
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid trip ID",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // Only creator can delete the trip
    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the trip creator can delete this trip",
      });
    }

    await Trip.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete trip",
    });
  }
});

// POST /api/trips/:id/collaborators - Add collaborator to trip
router.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role = "viewer" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid trip ID",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    } // Check if user can add collaborators
    const canAddCollaborators =
      trip.creator.toString() === req.user._id.toString() ||
      trip.collaborators.some(
        (collab) =>
          collab.user.toString() === req.user._id.toString() &&
          collab.status === "accepted" &&
          collab.role === "admin"
      );

    if (!canAddCollaborators) {
      return res.status(403).json({
        success: false,
        error: "Permission denied to add collaborators",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user is already a collaborator or creator
    if (trip.creator.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "User is already the creator of this trip",
      });
    }

    const existingCollaborator = trip.collaborators.find(
      (collab) => collab.user.toString() === user._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        error: "User is already a collaborator",
      });
    }

    // Add collaborator
    trip.collaborators.push({
      user: user._id,
      role,
      status: "pending",
    });

    await trip.save();
    await trip.populate("collaborators.user", "name email");

    res.status(201).json({
      success: true,
      message: "Collaborator added successfully",
      data: trip.collaborators[trip.collaborators.length - 1],
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add collaborator",
    });
  }
});

// PUT /api/trips/:id/collaborators/:collaboratorId - Update collaborator role or status
router.put("/:id/collaborators/:collaboratorId", auth, async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role, status } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(collaboratorId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    const collaborator = trip.collaborators.id(collaboratorId);

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        error: "Collaborator not found",
      });
    } // Check permissions for different actions
    if (status && collaborator.user.toString() === req.user._id.toString()) {
      // User can accept/decline their own invitation
      collaborator.status = status;
    } else if (
      role &&
      (trip.creator.toString() === req.user._id.toString() ||
        trip.collaborators.some(
          (collab) =>
            collab.user.toString() === req.user._id.toString() &&
            collab.status === "accepted" &&
            collab.role === "admin"
        ))
    ) {
      // Creator or admin can change roles
      collaborator.role = role;
    } else {
      return res.status(403).json({
        success: false,
        error: "Permission denied",
      });
    }

    await trip.save();
    await trip.populate("collaborators.user", "name email");

    res.json({
      success: true,
      message: "Collaborator updated successfully",
      data: collaborator,
    });
  } catch (error) {
    console.error("Error updating collaborator:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update collaborator",
    });
  }
});

// DELETE /api/trips/:id/collaborators/:collaboratorId - Remove collaborator
router.delete("/:id/collaborators/:collaboratorId", auth, async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(collaboratorId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    const collaborator = trip.collaborators.id(collaboratorId);

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        error: "Collaborator not found",
      });
    } // Check permissions: creator, admin, or the collaborator themselves can remove
    const canRemove =
      trip.creator.toString() === req.user._id.toString() ||
      collaborator.user.toString() === req.user._id.toString() ||
      trip.collaborators.some(
        (collab) =>
          collab.user.toString() === req.user._id.toString() &&
          collab.status === "accepted" &&
          collab.role === "admin"
      );

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        error: "Permission denied to remove collaborator",
      });
    }

    trip.collaborators.pull(collaboratorId);
    await trip.save();

    res.json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove collaborator",
    });
  }
});

// GET /api/trips/public/search - Search public trips
router.get("/public/search", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      destination,
      search,
      sortBy = "startDate",
      sortOrder = "desc",
    } = req.query;

    // Build query for public trips
    const query = {
      privacy: "public",
      isPublic: true,
    };

    if (destination) {
      query.destination = { $regex: destination, $options: "i" };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query
    const trips = await Trip.find(query)
      .populate("creator", "name")
      .select("-collaborators -photos") // Exclude sensitive information
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error searching public trips:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search public trips",
    });
  }
});

export default router;
