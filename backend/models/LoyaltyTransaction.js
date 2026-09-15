const mongoose = require("mongoose");

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["earned", "redeemed", "expired", "refunded", "adjusted"],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["ORDER", "RETURN", "ADMIN", "COUPON", "ADJUSTMENT"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LoyaltyTransaction", loyaltyTransactionSchema);
