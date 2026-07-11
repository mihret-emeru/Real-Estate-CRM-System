import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    preferredPropertyType: {
      type: String,
      enum: ["house", "apartment", "villa", "land", "commercial", "other"],
      default: "other",
    },

    minBudget: {
      type: Number,
    },

    maxBudget: {
      type: Number,
    },

    currency: {
      type: String,
      enum: ["ETB", "USD"],
      default: "ETB",
    },
    role: {
      type: String,
      enum: ["admin", "manager", "agent", "client"],
      default: "client",
    },

    profileImage: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
