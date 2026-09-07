import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // ==========================================
    // CLIENT
    // ==========================================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // AGENT
    // ==========================================

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // PROPERTY
    // ==========================================

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    // ==========================================
    // CONVERSATION STATUS
    // ==========================================
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },

    // ==========================================
    // LAST MESSAGE
    // ==========================================

    lastMessage: {
      type: String,
      default: "",
      trim: true,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // UNREAD COUNTS
    // ==========================================

    clientUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    agentUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// ONE CONVERSATION PER CLIENT + AGENT + PROPERTY
// ==========================================

conversationSchema.index(
  {
    client: 1,
    agent: 1,
    property: 1,
  },
  {
    unique: true,
  },
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

export default Conversation;

