const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: String,
    deviceType: String,
    browser: String,
    operatingSystem: String,
    ipAddress: String,
    loginAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserSession", userSessionSchema);
