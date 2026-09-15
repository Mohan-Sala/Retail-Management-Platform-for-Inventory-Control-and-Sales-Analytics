const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Report type is required"],
      enum: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
        "revenue",
        "sales",
        "inventory",
        "forecast",
        "customer",
        "vendor",
        "product",
        "transaction",
        "recommendation",
        "insights",
        "executive",
        "custom_export",
      ],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    format: {
      type: String,
      required: [true, "Export format is required"],
      enum: ["pdf", "xlsx", "csv"],
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    storageProvider: {
      type: String,
      default: "local",
    },
    fileUrl: {
      type: String,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    checksum: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
    latestVersion: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorMessage: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ creatorId: 1, status: 1, type: 1, latestVersion: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
