const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: String,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID reference is required"],
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID reference is required"],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID reference is required"],
      index: true,
    },
    qty: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["paid", "pending", "refunded", "failed"],
      default: "paid",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet", "bank", "cod"],
      default: "upi",
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const handleCacheInvalidation = () => {
  try {
    const { invalidateMlCache } = require("../utils/mlClient");
    invalidateMlCache();
  } catch (e) {}
};

transactionSchema.post("save", handleCacheInvalidation);
transactionSchema.post("findOneAndUpdate", handleCacheInvalidation);
transactionSchema.post("findOneAndDelete", handleCacheInvalidation);
transactionSchema.post("updateOne", handleCacheInvalidation);
transactionSchema.post("updateMany", handleCacheInvalidation);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
