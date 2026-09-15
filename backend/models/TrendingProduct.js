const mongoose = require("mongoose");

const trendingProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    wishlistAdds: {
      type: Number,
      default: 0,
    },
    salesVelocity: {
      type: Number,
      default: 0,
    },
    trendScore: {
      type: Number,
      default: 0,
      index: true,
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TrendingProduct", trendingProductSchema);
