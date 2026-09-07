import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ==========================================
    // CONVERSATION
    // ==========================================

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // ==========================================
    // SENDER
    // ==========================================

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // RECEIVER
    // ==========================================

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // MESSAGE CONTENT
    // ==========================================

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // ==========================================
    // READ STATUS
    // ==========================================

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// MESSAGE QUERY INDEX
// ==========================================

MessageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;

