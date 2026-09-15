const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");
const RecommendationFeedback = require("../models/RecommendationFeedback");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * @desc Get customer experience insights
 */
const getCustomerInsights = async (customerId) => {
  const user = await User.findById(customerId);
  if (!user) throw new Error("Customer profile not found");

  const orders = await Order.find({ customerId, orderStatus: { $ne: "cancelled" } }).lean();
  const wishlist = await Wishlist.findOne({ customerId }).lean();
  const feedbacks = await RecommendationFeedback.find({ customerId }).lean();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlySpending = orders
    .filter(o => new Date(o.createdAt) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? parseFloat((totalSpent / totalOrders).toFixed(2)) : 0;

  const savings = orders.reduce((sum, o) => sum + (o.discountAmount || o.discount || 0), 0);

  const categoryCounts = {};
  const vendorCounts = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      const cat = item.snapshot?.category || "uncategorized";
      const vendorName = item.snapshot?.vendorName || "Unknown Vendor";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
      vendorCounts[vendorName] = (vendorCounts[vendorName] || 0) + item.quantity;
    });
  });

  const favoriteCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => ({ category: entry[0], count: entry[1] }));

  const favoriteVendors = Object.entries(vendorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => ({ vendorName: entry[0], count: entry[1] }));

  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const accountAgeMonths = Math.max(1, Math.round(accountAgeMs / (1000 * 60 * 60 * 24 * 30)));
  const purchaseFrequency = parseFloat((totalOrders / accountAgeMonths).toFixed(2));

  let wishlistConversionRate = 0;
  if (wishlist && wishlist.items.length > 0) {
    const wishlistProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
    const purchasedProductIds = new Set();
    orders.forEach(o => {
      o.items.forEach(item => {
        if (item.productId) {
          purchasedProductIds.add(item.productId.toString());
        }
      });
    });
    const convertedCount = [...wishlistProductIds].filter(id => purchasedProductIds.has(id)).length;
    wishlistConversionRate = parseFloat(((convertedCount / wishlistProductIds.size) * 100).toFixed(2));
  }

  let recommendationAcceptanceRate = 0;
  if (feedbacks.length > 0) {
    const acceptedCount = feedbacks.filter(f => f.action === "CLICKED" || f.action === "PURCHASED").length;
    recommendationAcceptanceRate = parseFloat(((acceptedCount / feedbacks.length) * 100).toFixed(2));
  }

  return {
    favoriteCategories,
    favoriteVendors,
    monthlySpending,
    purchaseFrequency,
    averageOrderValue,
    savings,
    wishlistConversionRate,
    recommendationAcceptanceRate,
    totalOrders,
    totalSpent,
  };
};

module.exports = {
  getCustomerInsights,
};
