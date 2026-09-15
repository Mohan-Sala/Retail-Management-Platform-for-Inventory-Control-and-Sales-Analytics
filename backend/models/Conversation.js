const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
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
      required: [true, "Role is required"],
    },
    title: {
      type: String,
      required: [true, "Conversation title is required"],
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 150,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for loading sorted sidebar list
conversationSchema.index({ userId: 1, isDeleted: 1, isPinned: -1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
