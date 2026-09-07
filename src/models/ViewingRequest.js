import mongoose from "mongoose";

const ViewingRequestSchema = new mongoose.Schema(
  {
    // ==========================================================
    // CLIENT
    // ==========================================================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================================
    // AGENT
    // ==========================================================

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================================
    // PROPERTY
    // ==========================================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // ==========================================================
    // CONVERSATION
    // ==========================================================

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // ==========================================================
    // REQUESTED DATE & TIME
    // ==========================================================

    requestedDate: {
      type: Date,
      required: true,
    },

    requestedTime: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================================
    // CLIENT MESSAGE
    // ==========================================================

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
      index: true,
    },

    // ==========================================================
    // AGENT RESPONSE
    // ==========================================================

    agentNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // ==========================================================
    // FINAL SCHEDULE
    // ==========================================================

    scheduledDate: {
      type: Date,
      default: null,
    },

    scheduledTime: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const ViewingRequest =
  mongoose.models.ViewingRequest ||
  mongoose.model("ViewingRequest", ViewingRequestSchema);

export default ViewingRequest;

