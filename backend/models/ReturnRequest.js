const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
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
    returnReasonCategory: {
      type: String,
      required: true,
      trim: true,
    },
    returnType: {
      type: String,
      enum: ["Refund", "Replacement", "Exchange"],
      required: true,
      default: "Refund",
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventoryRestock: {
      type: Boolean,
      default: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
