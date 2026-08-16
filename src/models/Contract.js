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
      default: null,
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
      default: null,
    },

    downPayment: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      default: null,
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
      enum: ["pending_signature", "signed", "completed", "cancelled"],
      default: "pending_signature",
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

    paymentSchedule: [
      {
        installmentNumber: {
          type: Number,
        },

        dueDate: {
          type: Date,
        },

        amount: {
          type: Number,
        },

        status: {
          type: String,
          enum: ["pending", "paid", "overdue"],
          default: "pending",
        },

        paidDate: {
          type: Date,
          default: null,
        },
      },
    ],

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

contractSchema.pre("validate", function () {
  if (!this.client && !this.lead) {
    this.invalidate(
      "client",
      "A contract must have either a registered client or a qualified lead.",
    );
  }

  if (this.client && this.lead) {
    this.invalidate(
      "client",
      "A contract cannot have both a registered client and a lead.",
    );
  }
});

export default mongoose.models.Contract ||
  mongoose.model("Contract", contractSchema);
