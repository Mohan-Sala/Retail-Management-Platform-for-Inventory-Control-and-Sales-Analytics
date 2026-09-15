const mongoose = require("mongoose");

const customerClassificationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    rank: {
      type: String,
      enum: ["Bronze", "Silver", "Gold"],
      default: "Bronze",
      index: true,
    },
    firstPurchaseAt: {
      type: Date,
    },
    lastPurchaseAt: {
      type: Date,
    },
     lifetimeValue: {
      type: Number,
      default: 0,
    },
    customerLifetimeValue: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    purchaseFrequency: {
      type: Number,
      default: 0,
    },
    lastPurchaseDaysAgo: {
      type: Number,
      default: 0,
    },
    retentionScore: {
      type: Number,
      default: 0,
    },
    churnRiskScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so a customer has exactly one classification record per vendor
customerClassificationSchema.index({ customerId: 1, vendorId: 1 }, { unique: true });

module.exports = mongoose.model("CustomerClassification", customerClassificationSchema);
