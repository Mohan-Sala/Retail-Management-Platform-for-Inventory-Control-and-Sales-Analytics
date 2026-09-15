const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    couponType: {
      type: String,
      enum: ["GLOBAL", "VENDOR"],
      required: true,
      default: "GLOBAL",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maximumDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicableCategories: [
      {
        type: String,
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    excludedCategories: [
      {
        type: String,
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    stackable: {
      type: Boolean,
      default: false,
    },
    autoApply: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    minimumQuantity: {
      type: Number,
      default: 1,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    usageLimit: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usagePerCustomer: {
      type: Number,
      default: 1,
    },
    maximumTotalUsagePerCustomer: {
      type: Number,
      default: 0,
    },
    eligibleRoles: [
      {
        type: String,
        default: ["customer"],
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
