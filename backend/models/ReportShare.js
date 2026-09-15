const mongoose = require("mongoose");

const reportShareSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: [true, "Report ID is required"],
      index: true,
    },
    token: {
      type: String,
      required: [true, "Share token is required"],
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    downloadLimit: {
      type: Number,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    maxUniqueViewers: {
      type: Number,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    accessHistory: [
      {
        ip: {
          type: String,
        },
        userAgent: {
          type: String,
        },
        success: {
          type: Boolean,
          default: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportShare", reportShareSchema);
