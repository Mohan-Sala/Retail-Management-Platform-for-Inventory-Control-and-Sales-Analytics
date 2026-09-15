const mongoose = require("mongoose");

const apiUsageMetricSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
      index: true,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    successRequests: {
      type: Number,
      default: 0,
    },
    failedRequests: {
      type: Number,
      default: 0,
    },
    averageLatency: {
      type: Number,
      default: 0,
    },
    maxLatency: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

apiUsageMetricSchema.index({ endpoint: 1, method: 1 }, { unique: true });

module.exports = mongoose.model("ApiUsageMetric", apiUsageMetricSchema);
