import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    propertyType: {
      type: String,
      enum: ["apartment", "villa", "commercial"],
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Pricing
    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "ETB",
    },

    paymentType: {
      type: String,
      enum: ["full_payment", "installment"],
      default: "full_payment",
    },

    // Location
    location: {
      city: {
        type: String,
        required: true,
      },

      subCity: {
        type: String,
      },

      address: {
        type: String,
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    // Property Details
    bedrooms: {
      type: Number,
      default: 0,
    },

    bathrooms: {
      type: Number,
      default: 0,
    },

    floorNumber: {
      type: Number,
      default: 0,
    },

    totalFloors: {
      type: Number,
      default: 0,
    },

    area: {
      type: Number,
      default: 0,
    },

    parkingSpace: {
      type: Boolean,
      default: false,
    },

    // Media
    images: [
      {
        type: String,
      },
    ],

    virtualTour: {
      type: String,
      default: "",
    },

    // Ownership
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    ownerPhone: {
      type: String,
    },

    // Created by manager/agent
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Property ||
  mongoose.model("Property", PropertySchema);
