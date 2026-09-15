const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock level is required"],
      min: [0, "Stock cannot be negative"],
    },
    reorderLevel: {
      type: Number,
      required: [true, "Reorder level is required"],
      min: [0, "Reorder level cannot be negative"],
      default: 10,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: [true, "Vendor ID reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "draft", "out_of_stock"],
      default: "active",
      index: true,
    },
    image: {
      type: String,
      default: "https://picsum.photos/seed/default/400/400",
    },
    description: {
      type: String,
      trim: true,
    },
    sales: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
productSchema.index({ name: "text", sku: "text", category: "text" });
const handleCacheInvalidation = () => {
  try {
    const { invalidateMlCache } = require("../utils/mlClient");
    invalidateMlCache();
  } catch (e) {}
};
productSchema.post("save", handleCacheInvalidation);
productSchema.post("findOneAndUpdate", handleCacheInvalidation);
productSchema.post("findOneAndDelete", handleCacheInvalidation);
productSchema.post("updateOne", handleCacheInvalidation);
productSchema.post("updateMany", handleCacheInvalidation);
const Product = mongoose.model("Product", productSchema);
module.exports = Product;