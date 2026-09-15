const mongoose = require("mongoose");

const businessInsightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["REVENUE", "SALES", "CUSTOMER", "INVENTORY", "FORECAST", "RECOMMENDATION", "VENDOR", "PRODUCT", "SYSTEM"],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["POSITIVE", "NEGATIVE", "WARNING", "OPPORTUNITY", "TREND"],
      required: true,
    },
    impactScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      index: true,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: String,
      default: "default-system",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BusinessInsight", businessInsightSchema);
