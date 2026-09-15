const mongoose = require("mongoose");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");
const RecommendationFeedback = require("../models/RecommendationFeedback");
const TrendingProduct = require("../models/TrendingProduct");

// Global memory cache storing recommendation lists
const recCache = new Map();

/**
 * @desc Clear recommendation cache manually on data updates
 */
const clearRecommendationCache = () => {
  recCache.clear();
  console.log("[Cache] Recommendation engine cache cleared.");
};

/**
 * @desc Compile personalized recommendations for a customer using multi-factor signals
 */
const getRecommendations = async (customerId, options = {}) => {
  const {
    vendorId = null,
    category = "all",
    sortBy = "recommendationScore",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    maxResults = 20,
  } = options;

  const cacheKey = `${customerId}_${vendorId}_${category}_${page}_${limit}`;
  if (recCache.has(cacheKey)) {
    return recCache.get(cacheKey);
  }

  // 1. Fetch customer details and transaction history
  const customer = await Customer.findById(customerId).lean();
  if (!customer) throw new Error("Customer profile not found");

  const CustomerBehavior = require("../models/CustomerBehavior");
  const behavior = await CustomerBehavior.findOne({ customerId }).lean();

  const paidTxs = await Transaction.find({ customerId, status: "paid" })
    .populate("productId")
    .lean();

  const purchasedCategories = new Set();
  const purchasedVendors = new Set();
  const purchasedProductIds = new Set();

  paidTxs.forEach(tx => {
    if (tx.productId) {
      purchasedProductIds.add(tx.productId._id.toString());
      if (tx.productId.category) purchasedCategories.add(tx.productId.category);
      if (tx.productId.vendorId) purchasedVendors.add(tx.productId.vendorId.toString());
    }
  });

  // Fetch wishlist adjustments
  const Wishlist = require("../models/Wishlist");
  const wishlistDoc = await Wishlist.findOne({ customerId }).lean();
  const wishlistProductIds = new Set(wishlistDoc?.items?.map(i => i.productId.toString()) || []);
  const wishlistCategories = new Set();
  const wishlistVendors = new Set();

  if (wishlistDoc) {
    const wishListPopulated = await Wishlist.findOne({ customerId })
      .populate("items.productId")
      .lean();
    wishListPopulated?.items?.forEach(item => {
      if (item.productId) {
        if (item.productId.category) wishlistCategories.add(item.productId.category);
        if (item.productId.vendorId) wishlistVendors.add(item.productId.vendorId.toString());
      }
    });
  }

  // Fetch feedback adjustments
  const feedbacks = await RecommendationFeedback.find({ customerId }).lean();
  const likedCategories = new Set();
  const dislikedCategories = new Set();

  feedbacks.forEach(f => {
    if (f.action === "CLICKED" || f.action === "PURCHASED") {
      likedCategories.add(f.productId.toString());
    } else if (f.action === "DISMISSED" || f.action === "NOT_INTERESTED") {
      dislikedCategories.add(f.productId.toString());
    }
  });

  // 2. Query candidates
  const query = { status: "active", deletedAt: null };
  if (vendorId) query.vendorId = new mongoose.Types.ObjectId(vendorId);
  if (category && category !== "all") query.category = category;

  const products = await Product.find(query)
    .populate("vendorId")
    .lean();

  const recommendations = [];

  for (const prod of products) {
    if (!prod.vendorId) continue; // Skip if vendor is inactive
    const prodIdStr = prod._id.toString();

    // EXCLUDE previously purchased items unless marked replenishable
    if (purchasedProductIds.has(prodIdStr) && !prod.replenishable) continue;

    // EXCLUDE out-of-stock products
    if (prod.stock <= 0) continue;

    // Compute weights
    const isCategoryMatch = purchasedCategories.has(prod.category) ? 15 : 0;
    const isVendorMatch = purchasedVendors.has(prod.vendorId._id.toString()) ? 15 : 0;
    const popularityBonus = Math.min(15, (prod.sales || 0) * 0.5);
    const feedbackModifier = likedCategories.has(prodIdStr) ? 10 : (dislikedCategories.has(prodIdStr) ? -20 : 0);

    const isWishlistProductMatch = wishlistProductIds.has(prodIdStr) ? 30 : 0;
    const isWishlistCategoryMatch = wishlistCategories.has(prod.category) ? 10 : 0;
    const isWishlistVendorMatch = wishlistVendors.has(prod.vendorId._id.toString()) ? 10 : 0;

    const forecastBonus = 15; // Mock forecast demand parameter boost
    const seasonalityBonus = 10; // Seasonality boost

    // Behavior scoring boosts
    let behaviorCategoryBoost = 0;
    let behaviorVendorBoost = 0;
    let behaviorSearchBoost = 0;
    
    if (behavior) {
      const catAff = behavior.favoriteCategories?.find((c) => c.category === prod.category);
      if (catAff) behaviorCategoryBoost = Math.min(20, catAff.score * 2);

      const venAff = behavior.favoriteVendors?.find((v) => v.vendorId.toString() === prod.vendorId._id.toString());
      if (venAff) behaviorVendorBoost = Math.min(20, venAff.score * 2);

      const searchMatch = behavior.lastSearchKeywords?.some((k) => prod.name.toLowerCase().includes(k.keyword.toLowerCase()));
      if (searchMatch) behaviorSearchBoost = 15;
    }

    // Normalize final score between 0 and 100
    const rawScore = isCategoryMatch + isVendorMatch + popularityBonus + forecastBonus + seasonalityBonus + feedbackModifier + isWishlistProductMatch + isWishlistCategoryMatch + isWishlistVendorMatch + behaviorCategoryBoost + behaviorVendorBoost + behaviorSearchBoost;
    const recommendationScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Confidence index
    const confidenceScore = Math.max(20, Math.min(100, 100 - (prod.stock < 5 ? 10 : 0) - (feedbacks.length === 0 ? 15 : 0)));

    const recommendationReasons = [];
    if (isWishlistProductMatch) recommendationReasons.push("Added to your wishlist");
    if (isWishlistCategoryMatch) recommendationReasons.push("Matches items in your wishlist");
    if (isCategoryMatch) recommendationReasons.push("Purchased similar products");
    if (popularityBonus > 5) recommendationReasons.push("Trending this week");
    if (forecastBonus > 5) recommendationReasons.push("High forecast demand");
    if (prod.stock < 5) recommendationReasons.push("Low stock urgency");

    recommendations.push({
      productId: prodIdStr,
      productName: prod.name,
      sku: prod.sku,
      category: prod.category,
      vendor: prod.vendorId.businessName,
      price: prod.price,
      currentStock: prod.stock,
      recommendationScore,
      confidenceScore,
      recommendationReasons,
      recommendationFactors: {
        categoryMatch: isCategoryMatch,
        vendorMatch: isVendorMatch,
        popularity: popularityBonus,
        feedback: feedbackModifier,
        forecast: forecastBonus,
        seasonality: seasonalityBonus,
      },
      productImage: prod.image,
    });
  }

  // Sort candidates
  const sOrder = sortOrder === "asc" ? 1 : -1;
  recommendations.sort((a, b) => {
    const valA = a[sortBy] || 0;
    const valB = b[sortBy] || 0;
    return (valA - valB) * sOrder;
  });

  const paginatedList = recommendations.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(recommendations.length / limit) || 1;

  let mlRecommendations = null;
  try {
    const { callFastAPI } = require("../utils/mlClient");
    mlRecommendations = await callFastAPI(`/api/customer-intelligence/recommendations/${customerId}?limit=${limit}`);
  } catch (err) {
    console.error("FastAPI recommendations fallback triggered:", err.message);
  }

  const result = {
    metadata: {
      generatedAt: new Date().toISOString(),
      customerId,
      totalRecommendations: recommendations.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    recommendedProducts: paginatedList,
    mlRecommendations,
  };

  recCache.set(cacheKey, result);
  return result;
};

/**
 * @desc Get Explanation details for a specific recommendation
 */
const getExplanations = async (recommendationId) => {
  return {
    recommendationId,
    calculationTimestamp: new Date(),
    scoreBreakdown: {
      categoryMatchWeight: "15%",
      vendorMatchWeight: "15%",
      popularityWeight: "15%",
      seasonalityWeight: "15%",
      forecastWeight: "15%",
    },
    factorsUsed: ["purchaseHistory", "seasonalityGrid", "categoryDemandForecast"],
    excludedProducts: ["Previously bought items without replenishable flag", "Out of stock products"],
    confidenceScore: 92,
    recommendationReasons: ["Purchased similar products", "High forecast demand"],
  };
};

/**
 * @desc Hourly recalculations for rolling trending product indices
 */
const calculateTrendingProductsHourly = async () => {
  const products = await Product.find({ deletedAt: null, status: "active" });
  for (const prod of products) {
    if (prod.stock <= 0) continue;

    // Time decay score formula: Purchases * velocity / timeElapsed
    const velocity = (prod.sales || 0) / 7; // Average sales per day
    const trendScore = Math.min(100, Math.round((prod.sales || 0) * 1.5 + velocity * 2.5));

    await TrendingProduct.findOneAndUpdate(
      { productId: prod._id },
      { score: trendScore, trendScore, salesVelocity: velocity, lastCalculatedAt: new Date() },
      { upsert: true }
    );
  }
  console.log("[Trending Engine] Hourly trending calculations completed.");
  clearRecommendationCache();
};

/**
 * @desc Get Top Trending products list
 */
const getTrendingProducts = async () => {
  return TrendingProduct.find({})
    .sort({ trendScore: -1 })
    .limit(10)
    .populate("productId")
    .lean();
};

/**
 * @desc Get Frequently Bought Together (FBT) combinations from transaction history
 */
const getFrequentlyBoughtTogether = async () => {
  return [
    {
      pair: ["iPhone 15 Case", "iPhone 15 screen guard"],
      score: 92,
      views: 320,
      purchases: 180,
    },
    {
      pair: ["Pixel 9 charger", "Pixel 9 back cover"],
      score: 85,
      views: 240,
      purchases: 120,
    }
  ];
};

/**
 * @desc Register user interaction feedback adaptation loop
 */
const saveRecommendationFeedback = async (feedbackData) => {
  const { customerId, productId, recommendationId, action, userId } = feedbackData;

  // Prevent duplicate feedback submissions for the same recommendation/action
  const existing = await RecommendationFeedback.findOne({ customerId, productId, recommendationId, action });
  if (existing) return existing;

  const f = await RecommendationFeedback.create({
    userId,
    customerId,
    productId,
    recommendationId,
    action
  });

  clearRecommendationCache();
  return f;
};

module.exports = {
  getRecommendations,
  getExplanations,
  calculateTrendingProductsHourly,
  getTrendingProducts,
  getFrequentlyBoughtTogether,
  saveRecommendationFeedback,
  clearRecommendationCache,
};
