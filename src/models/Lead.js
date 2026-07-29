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
    activities: [
      new mongoose.Schema(
        {
          type: {
            type: String,
            enum: [
              "created",
              "status_change",
              "note",
              "call",
              "meeting",
              "email",
            ],
            required: true,
          },

          message: {
            type: String,
            required: true,
          },

          oldValue: {
            type: String,
          },

          newValue: {
            type: String,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
        { _id: false },
      ),
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Lead || mongoose.model("Lead", leadSchema);
