import mongoose from "mongoose";

const propertyInteractionSchema = new mongoose.Schema(
  {
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

    type: {
      type: String,
      enum: ["view"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

propertyInteractionSchema.index({
  client: 1,
  property: 1,
  type: 1,
});

export default mongoose.models.PropertyInteraction ||
  mongoose.model("PropertyInteraction", propertyInteractionSchema);
