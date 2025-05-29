import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
      maxlength: [100, "Trip title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (value) {
          return value >= new Date();
        },
        message: "Start date must be in the future",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    budget: {
      estimated: {
        type: Number,
        min: [0, "Budget cannot be negative"],
      },
      spent: {
        type: Number,
        default: 0,
        min: [0, "Spent amount cannot be negative"],
      },
    },
    status: {
      type: String,
      enum: ["planning", "booked", "active", "completed", "cancelled"],
      default: "planning",
    },
    privacy: {
      type: String,
      enum: ["private", "friends", "public"],
      default: "private",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "viewer",
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
      },
    ],
    itinerary: [
      {
        day: {
          type: Number,
          required: true,
          min: 1,
        },
        date: Date,
        activities: [
          {
            time: String,
            title: {
              type: String,
              required: true,
              trim: true,
            },
            description: String,
            location: {
              name: String,
              address: String,
              coordinates: {
                lat: Number,
                lng: Number,
              },
            },
            estimatedCost: {
              type: Number,
              min: 0,
            },
            actualCost: {
              type: Number,
              min: 0,
            },
            notes: String,
            completed: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    accommodations: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["hotel", "hostel", "apartment", "house", "resort", "other"],
          default: "hotel",
        },
        checkIn: Date,
        checkOut: Date,
        address: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
        cost: Number,
        confirmationNumber: String,
        notes: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
    transportation: [
      {
        type: {
          type: String,
          enum: ["flight", "train", "bus", "car", "ferry", "other"],
          required: true,
        },
        from: {
          type: String,
          required: true,
        },
        to: {
          type: String,
          required: true,
        },
        departureTime: Date,
        arrivalTime: Date,
        confirmationNumber: String,
        cost: Number,
        notes: String,
      },
    ],
    photos: [
      {
        url: String,
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for trip duration
tripSchema.virtual("duration").get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Virtual for budget remaining
tripSchema.virtual("budgetRemaining").get(function () {
  if (this.budget.estimated && this.budget.spent !== undefined) {
    return this.budget.estimated - this.budget.spent;
  }
  return null;
});

// Virtual for completion percentage
tripSchema.virtual("completionPercentage").get(function () {
  if (!this.itinerary || this.itinerary.length === 0) return 0;

  let totalActivities = 0;
  let completedActivities = 0;

  this.itinerary.forEach((day) => {
    if (day.activities) {
      totalActivities += day.activities.length;
      completedActivities += day.activities.filter(
        (activity) => activity.completed
      ).length;
    }
  });

  return totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;
});

// Index for searching
tripSchema.index({
  title: "text",
  description: "text",
  destination: "text",
  tags: "text",
});
tripSchema.index({ creator: 1, startDate: -1 });
tripSchema.index({ destination: 1, startDate: 1 });
tripSchema.index({ status: 1, startDate: 1 });

// Middleware to update itinerary dates when trip dates change
tripSchema.pre("save", function (next) {
  if (
    this.isModified("startDate") &&
    this.itinerary &&
    this.itinerary.length > 0
  ) {
    this.itinerary.forEach((day, index) => {
      if (day.day && this.startDate) {
        const dayDate = new Date(this.startDate);
        dayDate.setDate(dayDate.getDate() + (day.day - 1));
        day.date = dayDate;
      }
    });
  }
  next();
});

export default mongoose.model("Trip", tripSchema);
