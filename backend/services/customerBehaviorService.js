const CustomerBehavior = require("../models/CustomerBehavior");
const Product = require("../models/Product");
const SystemAudit = require("../models/SystemAudit");

const getOrCreateBehavior = async (customerId) => {
  let behavior = await CustomerBehavior.findOne({ customerId });
  if (!behavior) {
    behavior = new CustomerBehavior({ customerId });
    await behavior.save();
  }
  return behavior;
};

/**
 * @desc Track product page view, boosting category and vendor affinities, bounded to latest 20 views
 */
const trackProductView = async (customerId, productId) => {
  const behavior = await getOrCreateBehavior(customerId);
  const product = await Product.findById(productId);
  if (!product) return behavior;

  // Update viewed list (bounded to latest 20)
  behavior.recentlyViewedProducts = [
    { productId, viewedAt: new Date() },
    ...behavior.recentlyViewedProducts.filter((p) => p.productId.toString() !== productId.toString()),
  ].slice(0, 20);

  // Boost Category affinity score
  if (product.category) {
    const catIdx = behavior.favoriteCategories.findIndex((c) => c.category === product.category);
    if (catIdx > -1) {
      behavior.favoriteCategories[catIdx].score += 1;
    } else {
      behavior.favoriteCategories.push({ category: product.category, score: 1 });
    }
  }

  // Boost Vendor affinity score
  if (product.vendorId) {
    const venIdx = behavior.favoriteVendors.findIndex((v) => v.vendorId.toString() === product.vendorId.toString());
    if (venIdx > -1) {
      behavior.favoriteVendors[venIdx].score += 1;
    } else {
      behavior.favoriteVendors.push({ vendorId: product.vendorId, score: 1 });
    }
  }

  // Boost Brand affinity score
  if (product.brand) {
    const brandIdx = behavior.favoriteBrands.findIndex((b) => b.brand === product.brand);
    if (brandIdx > -1) {
      behavior.favoriteBrands[brandIdx].score += 1;
    } else {
      behavior.favoriteBrands.push({ brand: product.brand, score: 1 });
    }
  }

  behavior.lastActivityAt = new Date();
  await behavior.save();

  await SystemAudit.create({
    userId: customerId,
    action: "CUSTOMER_BEHAVIOR_UPDATED",
    details: `Product view tracked: ${product.name}`,
    timestamp: new Date(),
  });

  // Invalidate caches
  const recommendationService = require("./recommendationService");
  const dashboardAnalyticsService = require("./dashboardAnalyticsService");
  recommendationService.clearRecommendationCache();
  dashboardAnalyticsService.invalidateDashboardCache();

  return behavior;
};

/**
 * @desc Track purchase logs, boosting affinity scores by a larger delta (+3)
 */
const trackProductPurchase = async (customerId, productId) => {
  const behavior = await getOrCreateBehavior(customerId);
  const product = await Product.findById(productId);
  if (!product) return behavior;

  behavior.recentlyPurchasedProducts = [
    { productId, purchasedAt: new Date() },
    ...behavior.recentlyPurchasedProducts.filter((p) => p.productId.toString() !== productId.toString()),
  ].slice(0, 20);

  if (product.category) {
    const catIdx = behavior.favoriteCategories.findIndex((c) => c.category === product.category);
    if (catIdx > -1) behavior.favoriteCategories[catIdx].score += 3;
    else behavior.favoriteCategories.push({ category: product.category, score: 3 });
  }

  if (product.vendorId) {
    const venIdx = behavior.favoriteVendors.findIndex((v) => v.vendorId.toString() === product.vendorId.toString());
    if (venIdx > -1) behavior.favoriteVendors[venIdx].score += 3;
    else behavior.favoriteVendors.push({ vendorId: product.vendorId, score: 3 });
  }

  behavior.lastActivityAt = new Date();
  await behavior.save();

  const recommendationService = require("./recommendationService");
  const dashboardAnalyticsService = require("./dashboardAnalyticsService");
  recommendationService.clearRecommendationCache();
  dashboardAnalyticsService.invalidateDashboardCache();

  return behavior;
};

/**
 * @desc Log search query tracking keyword lists and search frequency counts
 */
const trackSearchKeyword = async (customerId, keyword) => {
  if (!keyword) return null;
  const behavior = await getOrCreateBehavior(customerId);

  behavior.lastSearchKeywords = [
    { keyword, searchedAt: new Date() },
    ...behavior.lastSearchKeywords.filter((k) => k.keyword.toLowerCase() !== keyword.toLowerCase()),
  ].slice(0, 10);

  behavior.searchFrequency += 1;
  behavior.lastActivityAt = new Date();
  await behavior.save();

  const recommendationService = require("./recommendationService");
  recommendationService.clearRecommendationCache();
  return behavior;
};

/**
 * @desc Increment recommendations click-through tracking counters
 */
const trackRecommendationClick = async (customerId, productId) => {
  const behavior = await getOrCreateBehavior(customerId);
  behavior.totalRecommendationClicks += 1;
  behavior.lastRecommendationInteraction = new Date();
  await behavior.save();

  await SystemAudit.create({
    userId: customerId,
    action: "RECOMMENDATION_CLICKED",
    details: `Recommendation clicked for product ${productId}`,
    timestamp: new Date(),
  });

  return behavior;
};

/**
 * @desc Log a conversion from recommendation clicks
 */
const trackRecommendationConversion = async (customerId, productId) => {
  const behavior = await getOrCreateBehavior(customerId);
  behavior.recommendationConversions += 1;
  await behavior.save();

  await SystemAudit.create({
    userId: customerId,
    action: "RECOMMENDATION_CONVERTED",
    details: `Recommendation purchase conversion for product ${productId}`,
    timestamp: new Date(),
  });

  return behavior;
};

module.exports = {
  getOrCreateBehavior,
  trackProductView,
  trackProductPurchase,
  trackSearchKeyword,
  trackRecommendationClick,
  trackRecommendationConversion,
};
