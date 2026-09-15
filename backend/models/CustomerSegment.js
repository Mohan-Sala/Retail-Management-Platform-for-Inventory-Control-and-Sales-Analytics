const mongoose = require("mongoose");

const customerSegmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    segment: {
      type: String,
      enum: ["New Customer", "Active Customer", "Repeat Customer", "At Risk", "Inactive Customer", "High Value Customer", "Loyal Customer"],
      required: true,
      index: true,
    },
    previousSegment: {
      type: String,
      default: "",
    },
    segmentChangedAt: {
      type: Date,
      default: Date.now,
    },
    segmentReason: String,
    calculatedMetrics: {
      type: mongoose.Schema.Types.Mixed,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    rulesVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

customerSegmentSchema.index({ customerId: 1 }, { unique: true });

module.exports = mongoose.model("CustomerSegment", customerSegmentSchema);
