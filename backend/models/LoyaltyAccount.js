const mongoose = require("mongoose");

const loyaltyAccountSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    availablePoints: {
      type: Number,
      default: 0,
    },
    redeemedPoints: {
      type: Number,
      default: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
    },
    lifetimeSpent: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    currentTier: {
      type: String,
      default: "Bronze",
    },
    nextTier: {
      type: String,
      default: "Silver",
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LoyaltyAccount", loyaltyAccountSchema);
