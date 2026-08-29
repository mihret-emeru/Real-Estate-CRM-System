import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // User who receives the notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification category
    type: {
      type: String,

      enum: [
        "payment_due",
        "payment_receipt_submitted",
        "payment_verified",
        "payment_rejected",
        "payment_review",
        "contract_created",
        "contract_updated",
        "agent_assigned",
        "new_message",
        "property_update",
        "system",
      ],

      required: true,
    },

    // Short notification heading
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification description
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Where the notification should take the client
    link: {
      type: String,
      default: "",
      trim: true,
    },

    // Used when the notification belongs to
    // a payment, contract, message, property, etc.
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Whether the client has opened/read it
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Useful for quickly retrieving a user's newest notifications
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
