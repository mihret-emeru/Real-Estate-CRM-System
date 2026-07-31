import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    salePrice: {
      type: Number,
      required: true,
    },

    downPayment: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      required: true,
    },

    installmentMonths: {
      type: Number,
      default: 0,
    },

    paymentFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "monthly",
    },

    status: {
      type: String,
      enum: ["draft", "pending_signature", "signed", "completed", "cancelled"],
      default: "draft",
    },

    contractType: {
      type: String,
      enum: ["generated", "uploaded"],
      default: "generated",
    },

    document: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    terms: {
      type: String,
      default: "",
    },

    startDate: Date,

    endDate: Date,
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Contract ||
  mongoose.model("Contract", contractSchema);

