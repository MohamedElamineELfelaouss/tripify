import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    preferences: {
      budget: {
        type: String,
        enum: ["low", "medium", "high", "luxury"],
        default: "medium",
      },
      travelStyle: {
        type: [String],
        enum: [
          "adventure",
          "cultural",
          "relaxation",
          "business",
          "family",
          "romantic",
        ],
        default: ["cultural"],
      },
      preferredDestinations: [String],
      dietaryRestrictions: [String],
    },
    profile: {
      avatar: String,
      dateOfBirth: Date,
      nationality: String,
      phoneNumber: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    gamification: {
      points: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
      badges: [String],
      achievements: [String],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for better query performance
userSchema.index({ "preferences.travelStyle": 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Add points for gamification
userSchema.methods.addPoints = function (points) {
  this.gamification.points += points;

  // Level up logic (every 1000 points = new level)
  const newLevel = Math.floor(this.gamification.points / 1000) + 1;
  if (newLevel > this.gamification.level) {
    this.gamification.level = newLevel;
  }

  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model("User", userSchema);

export default User;
