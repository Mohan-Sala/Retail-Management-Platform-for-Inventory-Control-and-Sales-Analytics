const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  snapshot: {
    productName: { type: String, required: true },
    productSKU: { type: String, required: true },
    vendorName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    productImage: { type: String },
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: {
    type: String,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
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
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["on_time", "delayed"],
      default: "on_time",
    },
    slaDays: {
      type: Number,
      default: 3,
    },
    statusHistory: [statusHistorySchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    couponCode: {
      type: String,
    },
    discountBreakdown: {
      couponDiscount: {
        type: Number,
        default: 0,
      },
      loyaltyDiscount: {
        type: Number,
        default: 0,
      },
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsRedeemed: {
      type: Number,
      default: 0,
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

orderSchema.post("save", handleCacheInvalidation);
orderSchema.post("findOneAndUpdate", handleCacheInvalidation);
orderSchema.post("findOneAndDelete", handleCacheInvalidation);
orderSchema.post("updateOne", handleCacheInvalidation);
orderSchema.post("updateMany", handleCacheInvalidation);

module.exports = mongoose.model("Order", orderSchema);
