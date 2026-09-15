const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "vendor", "staff"],
      required: [true, "User role is required"],
    },
    question: {
      type: String,
      required: [true, "Question is required"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
    },
    tokens: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      default: "gemini",
    },
    model: {
      type: String,
      default: "gemini-1.5-flash",
    },
    responseTime: {
      type: Number,
      default: 0,
    },
    promptVersion: {
      type: String,
      default: "1.0.0",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
    },
    sources: [
      {
        name: String,
        type: String,
        recordCount: Number,
      }
    ],
    confidence: {
      type: Number,
      default: 100,
    },
    cacheHit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for sorting queries
chatHistorySchema.index({ userId: 1, createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

module.exports = ChatHistory;
