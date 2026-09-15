const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    gst: {
      type: String,
      required: [true, "GST number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      index: true,
    },
    commission: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [0, "Commission cannot be negative"],
      max: [100, "Commission cannot exceed 100%"],
      default: 10,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search capabilities
vendorSchema.index({ businessName: "text", ownerName: "text", city: "text" });

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
