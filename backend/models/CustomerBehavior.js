const mongoose = require("mongoose");

const viewedProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const purchasedProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

const searchKeywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
  },
  searchedAt: {
    type: Date,
    default: Date.now,
  },
});

const categoryAffinitySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const vendorAffinitySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const brandAffinitySchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const customerBehaviorSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    recentlyViewedProducts: [viewedProductSchema],
    recentlyPurchasedProducts: [purchasedProductSchema],
    lastSearchKeywords: [searchKeywordSchema],
    favoriteCategories: [categoryAffinitySchema],
    favoriteVendors: [vendorAffinitySchema],
    favoriteBrands: [brandAffinitySchema],
    averageSessionDuration: {
      type: Number,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    searchFrequency: {
      type: Number,
      default: 0,
    },
    averageTimeBetweenOrders: {
      type: Number,
      default: 0,
    },
    cartAbandonments: {
      type: Number,
      default: 0,
    },
    wishlistConversions: {
      type: Number,
      default: 0,
    },
    lastRecommendationInteraction: Date,
    totalRecommendationClicks: {
      type: Number,
      default: 0,
    },
    recommendationConversions: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CustomerBehavior", customerBehaviorSchema);
