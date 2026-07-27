import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    interestedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    source: {
      type: String,
      enum: [
        "website",
        "facebook",
        "client_registration",
        "phone_call",
        "office_visit",
        "referral",
      ],
      required: true,
    },

    leadScore: {
      type: Number,
      default: 10,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "negotiation", "won", "lost"],
      default: "new",
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Lead || mongoose.model("Lead", leadSchema);

