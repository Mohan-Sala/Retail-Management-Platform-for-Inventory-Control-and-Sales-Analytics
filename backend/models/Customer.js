const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, "Total orders cannot be negative"],
    },
    totalSpending: {
      type: Number,
      default: 0,
      min: [0, "Total spending cannot be negative"],
      index: true,
    },
    lastPurchaseDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to dynamically calculate customer category
customerSchema.virtual("customerCategory").get(function () {
  if (this.totalSpending >= 5000) {
    return "Gold";
  }
  if (this.totalSpending >= 1500) {
    return "Silver";
  }
  return "Bronze";
});

// Index for createdAt queries
customerSchema.index({ createdAt: 1 });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
