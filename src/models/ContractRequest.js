import mongoose from "mongoose";

const contractRequestSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Fixed price copied from the Property model by the API.
    propertyPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "ETB",
    },

    paymentType: {
      type: String,
      enum: ["full_payment", "installment"],
      required: true,
    },

    downPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    installmentMonths: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "one_time",
    },

    terms: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "contract_created"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

contractRequestSchema.index({ agent: 1, createdAt: -1 });
contractRequestSchema.index({ status: 1, createdAt: -1 });
contractRequestSchema.index({ lead: 1, property: 1 });

export default mongoose.models.ContractRequest ||
  mongoose.model("ContractRequest", contractRequestSchema);
