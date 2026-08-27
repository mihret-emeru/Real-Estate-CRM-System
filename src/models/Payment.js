import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },

    // Registered client
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Qualified lead
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    installmentNumber: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    expectedAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["receipt", "chapa"],
      default: "receipt",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "pending_verification",
        "paid",
        "rejected",
        "review_required",
        "overdue",
      ],
      default: "pending",
    },

    receipt: {
      fileName: {
        type: String,
        default: "",
      },

      fileUrl: {
        type: String,
        default: "",
      },

      mimeType: {
        type: String,
        default: "",
      },

      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    chapaReceiptUrl: {
      type: String,
      default: "",
    },

    transactionReference: {
      type: String,
      default: "",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    verificationNotes: {
      type: String,
      default: "",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.pre("validate", function () {
  if (!this.client && !this.lead) {
    this.invalidate(
      "client",
      "A payment must belong to either a registered client or a qualified lead.",
    );
  }

  if (this.client && this.lead) {
    this.invalidate(
      "client",
      "A payment cannot belong to both a client and a lead.",
    );
  }
});

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
