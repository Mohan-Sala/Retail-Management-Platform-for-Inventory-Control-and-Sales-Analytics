const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  location: String,
  notes: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const shipmentSchema = new mongoose.Schema(
  {
    shipmentNumber: {
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
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    carrier: {
      type: String,
      default: "ShopSense Logistics",
    },
    trackingNumber: {
      type: String,
      required: true,
      index: true,
    },
    currentLocation: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    shippingCost: {
      type: Number,
      default: 0,
    },
    shipmentStatus: {
      type: String,
      enum: ["Pending", "Packed", "Dispatched", "In Transit", "Out For Delivery", "Delivered", "Failed", "Returned"],
      default: "Pending",
      index: true,
    },
    shippedAt: Date,
    packedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    returnedAt: Date,
    deliveryOTP: String,
    deliveryProofImages: [String],
    deliveryNotes: String,
    estimatedDeliveryWindow: String,
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
