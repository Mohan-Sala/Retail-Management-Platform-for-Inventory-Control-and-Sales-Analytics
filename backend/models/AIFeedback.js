const mongoose = require("mongoose");

const aiFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatHistory",
      required: [true, "Message ID is required"],
      unique: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating (1 or -1) is required"],
      enum: [1, -1],
    },
    feedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIFeedback", aiFeedbackSchema);
