const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID reference is required"],
      unique: true,
      index: true,
    },
    currentStock: {
      type: Number,
      required: [true, "Current stock level is required"],
      min: [0, "Current stock cannot be negative"],
    },
    minimumStock: {
      type: Number,
      required: [true, "Minimum stock level is required"],
      min: [0, "Minimum stock cannot be negative"],
      default: 10,
    },
    maximumStock: {
      type: Number,
      required: [true, "Maximum stock level is required"],
      min: [0, "Maximum stock cannot be negative"],
      default: 100,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Mongoose virtual property for dynamic status calculations
inventorySchema.virtual("status").get(function () {
  if (this.currentStock === 0) return "Out of Stock";
  if (this.currentStock <= this.minimumStock) return "Low Stock";
  return "Healthy";
});

// Pre-validate hook to verify constraints
inventorySchema.pre("validate", function () {
  if (this.minimumStock < 0) {
    this.invalidate("minimumStock", "minimumStock must be greater than or equal to 0");
  }
  if (this.currentStock < 0) {
    this.invalidate("currentStock", "currentStock must be greater than or equal to 0");
  }
  if (this.maximumStock <= this.minimumStock) {
    this.invalidate("maximumStock", "maximumStock must be strictly greater than minimumStock");
  }
  if (this.maximumStock < this.currentStock) {
    this.invalidate("maximumStock", "maximumStock must be greater than or equal to currentStock");
  }
});

// Pre-save hook to automatically update lastUpdated if stock levels are modified
inventorySchema.pre("save", function () {
  if (this.isModified("currentStock") || this.isModified("minimumStock") || this.isModified("maximumStock")) {
    this.lastUpdated = new Date();
  }
});

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
