const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true,
    },
    category: {
      type: String,
      enum: ["inventory", "sales", "customer", "vendor", "forecast", "reports", "ai", "system"],
      default: "system",
      index: true,
    },
    roleVisibility: {
      type: [String],
      enum: ["admin", "vendor", "manager", "staff"],
      default: [],
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
    },
    icon: {
      type: String,
    },
    color: {
      type: String,
    },
    notificationFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate middleware to auto-generate notificationFingerprint if missing
notificationSchema.pre("validate", function () {
  if (!this.notificationFingerprint) {
    const crypto = require("crypto");
    const raw = JSON.stringify({
      type: this.type,
      category: this.category || "system",
      vendorId: this.vendorId ? this.vendorId.toString() : "",
      userId: this.userId ? this.userId.toString() : "",
      metadata: this.metadata || {},
      salt: Math.random().toString(),
    });
    this.notificationFingerprint = crypto.createHash("sha256").update(raw).digest("hex");
  }
});

// Compound indexing for visibility and sorting
notificationSchema.index({ roleVisibility: 1, isDeleted: 1, isArchived: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
