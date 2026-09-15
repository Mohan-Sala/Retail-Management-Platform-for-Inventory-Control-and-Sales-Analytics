const mongoose = require("mongoose");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");
const Vendor = require("../models/Vendor");
const Inventory = require("../models/Inventory");

const forecastingService = require("./forecastingService");
const customerAnalyticsService = require("./customerAnalyticsService");
const customerSegmentationService = require("./customerSegmentationService");
const recommendationService = require("./recommendationService");

// In-Memory cache storage
let dashboardCache = {};

const getCacheKey = (options = {}) => {
  return JSON.stringify(options);
};

const invalidateDashboardCache = () => {
  dashboardCache = {};
  try {
    require("./aiService").clearAICache();
  } catch (err) {
    console.error("Failed to clear AI cache:", err);
  }
};

/**
 * @desc Get unified dashboard analytics. Uses cache if available.
 */
const getDashboardAnalytics = async (options = {}) => {
  const opts = options || {};
  const cacheKey = getCacheKey(opts);
  const now = Date.now();

  if (dashboardCache[cacheKey] && dashboardCache[cacheKey].expiry > now) {
    return dashboardCache[cacheKey].data;
  }

  const {
    vendorId = null,
    startDate = null,
    endDate = null,
    category = "all",
    city = "all",
    forecastDays = 30,
    historyDays = 30,
  } = opts;

  const historyDaysNum = parseInt(String(historyDays)) || 30;
  const thirtyDaysAgo = new Date(now - historyDaysNum * 24 * 60 * 60 * 1000);
  const startMatchDate = startDate ? new Date(startDate) : thirtyDaysAgo;
  const endMatchDate = endDate ? new Date(endDate) : new Date();

  // Scoping transactions match query
  const txMatch = {
    status: "paid",
    date: { $gte: startMatchDate, $lte: endMatchDate },
  };

  if (vendorId) {
    txMatch.vendorId = new mongoose.Types.ObjectId(vendorId);
  }

  // Scoping product match query
  const prodMatch = { status: "active" };
  if (vendorId) {
    prodMatch.vendorId = new mongoose.Types.ObjectId(vendorId);
  }
  if (category && category !== "all") {
    prodMatch.category = new RegExp(`^${category.trim()}$`, "i");
  }

  // Load datasets
  const allProducts = await Product.find(prodMatch).lean();
  const allProductIds = allProducts.map(p => p._id);

  // Filter transactions matching scoped product list if category filter is active
  if (category && category !== "all") {
    txMatch.productId = { $in: allProductIds };
  }

  const transactionsList = await Transaction.find(txMatch).populate("customerId").lean();

  // Filter transactions by customer city if city filter is active
  let targetTransactions = transactionsList;
  if (city && city !== "all") {
    targetTransactions = transactionsList.filter(
      (t) => t.customerId && t.customerId.city && t.customerId.city.toLowerCase() === city.trim().toLowerCase()
    );
  }

  // A. Revenue & Sales Computations
  let totalRevenue = 0;
  const dailyRevMap = {};
  const weeklyRevMap = {};
  const monthlyRevMap = {};
  let totalUnitsSold = 0;

  targetTransactions.forEach((tx) => {
    const amt = tx.amount || 0;
    const qty = tx.qty || 0;
    totalRevenue += amt;
    totalUnitsSold += qty;

    const txDate = new Date(tx.date);
    const dayStr = txDate.toISOString().split("T")[0];
    dailyRevMap[dayStr] = (dailyRevMap[dayStr] || 0) + amt;

    // Weekly grouping (approximate weekly index)
    const year = txDate.getFullYear();
    const tempDate = new Date(txDate.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((txDate.getTime() - tempDate.getTime()) / 86400000 + tempDate.getDay() + 1) / 7);
    const weekStr = `${year}-W${weekNum}`;
    weeklyRevMap[weekStr] = (weeklyRevMap[weekStr] || 0) + amt;

    const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyRevMap[monthStr]) {
      monthlyRevMap[monthStr] = { revenue: 0, orders: 0 };
    }
    monthlyRevMap[monthStr].revenue += amt;
    monthlyRevMap[monthStr].orders += 1;
  });

  const dailyRevenueTrend = Object.keys(dailyRevMap).map((d) => ({ date: d, revenue: dailyRevMap[d] })).sort((a, b) => a.date.localeCompare(b.date));
  const weeklyRevenueTrend = Object.keys(weeklyRevMap).map((w) => ({ week: w, revenue: weeklyRevMap[w] })).sort((a, b) => a.week.localeCompare(b.week));
  const monthlyRevenueTrend = Object.keys(monthlyRevMap).map((m) => ({
    month: m,
    revenue: monthlyRevMap[m].revenue,
    orders: monthlyRevMap[m].orders
  })).sort((a, b) => a.month.localeCompare(b.month));

  const totalTransactionsCount = targetTransactions.length;
  const avgOrderValue = totalTransactionsCount > 0 ? parseFloat((totalRevenue / totalTransactionsCount).toFixed(2)) : 0;
  const avgUnitsPerOrder = totalTransactionsCount > 0 ? parseFloat((totalUnitsSold / totalTransactionsCount).toFixed(1)) : 0;

  // B. Customer Computations
  const uniqueCustomers = Array.from(new Set(targetTransactions.map(t => t.customerId?._id?.toString()).filter(Boolean)));
  const totalCustomersCount = uniqueCustomers.length;

  const custAnalytics = await customerAnalyticsService.getCustomerAnalytics({ vendorId });

  const goldSeg = custAnalytics.segmentation?.find(s => s.segment === "Gold") || {};
  const silverSeg = custAnalytics.segmentation?.find(s => s.segment === "Silver") || {};
  const bronzeSeg = custAnalytics.segmentation?.find(s => s.segment === "Bronze") || {};

  const segData = {
    summaryMetrics: {
      goldCustomers: goldSeg.count || 0,
      silverCustomers: silverSeg.count || 0,
      bronzeCustomers: bronzeSeg.count || 0,
      goldRevenue: goldSeg.count ? (goldSeg.count * goldSeg.averageSpending) : 0,
      silverRevenue: silverSeg.count ? (silverSeg.count * silverSeg.averageSpending) : 0,
      bronzeRevenue: bronzeSeg.count ? (bronzeSeg.count * bronzeSeg.averageSpending) : 0,
      topSegment: [goldSeg, silverSeg, bronzeSeg].sort((a, b) => (b.count || 0) - (a.count || 0))[0]?.segment || "Bronze",
    }
  };

  // C. Inventory Computations
  const inventoryMatch = { productId: { $in: allProductIds } };
  const inventoriesList = await Inventory.find(inventoryMatch).populate("productId").lean();

  let healthyCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalInventoryVal = 0;
  let totalStockCount = 0;

  inventoriesList.forEach((inv) => {
    const stock = inv.currentStock || 0;
    const reorderPoint = inv.reorderPoint || 10;
    totalStockCount += stock;
    totalInventoryVal += stock * (inv.productId?.price || 0);

    if (stock <= 0) {
      outOfStockCount++;
    } else if (stock <= reorderPoint) {
      lowStockCount++;
    } else {
      healthyCount++;
    }
  });

  const avgStock = inventoriesList.length > 0 ? parseFloat((totalStockCount / inventoriesList.length).toFixed(1)) : 0;

  // D. Vendor Computations (Admin perspective or self vendor)
  const allVendors = await Vendor.find({ deletedAt: null }).lean();
  const vendorPerformance = [];

  for (const v of allVendors) {
    const vTxs = targetTransactions.filter(t => t.vendorId && t.vendorId.toString() === v._id.toString());
    const vRev = vTxs.reduce((sum, t) => sum + t.amount, 0);
    const vProductsCount = await Product.countDocuments({ vendorId: v._id, status: "active" });

    vendorPerformance.push({
      vendorId: v._id.toString(),
      businessName: v.businessName,
      revenue: vRev,
      salesCount: vTxs.length,
      productsCount: vProductsCount,
    });
  }

  vendorPerformance.sort((a, b) => b.revenue - a.revenue);

  // E. Product Performance
  const productPerformance = [];
  allProducts.forEach((p) => {
    const pTxs = targetTransactions.filter(t => t.productId && t.productId.toString() === p._id.toString());
    const pRev = pTxs.reduce((sum, t) => sum + t.amount, 0);
    const pSales = pTxs.reduce((sum, t) => sum + t.qty, 0);

    productPerformance.push({
      productId: p._id.toString(),
      productName: p.name,
      category: p.category,
      price: p.price,
      revenue: pRev,
      salesCount: pSales,
    });
  });

  const topSellingProducts = [...productPerformance].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
  const lowestSellingProducts = [...productPerformance].sort((a, b) => a.salesCount - b.salesCount).slice(0, 5);
  const highestRevenueProducts = [...productPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Category distributions (count of products per category)
  const catDistributionMap = {};
  productPerformance.forEach((p) => {
    catDistributionMap[p.category] = (catDistributionMap[p.category] || 0) + 1;
  });
  const categoryDistribution = Object.keys(catDistributionMap).map((cat) => ({
    name: cat,
    value: catDistributionMap[cat],
  }));

  // F. Forecasting and Recommendations Integrations
  const forecastData = {
    inventoryCoverage: 0,
    forecastDemand: 0,
  };

  // Calculate recommendation metrics over target customers (bypassed)
  const avgRecommendationScore = 0;
  const recommendationCoverage = 0;
  const mostRecommendedProduct = "N/A";
  const mostRecommendedCategory = "N/A";

  const topTrendingProduct = topSellingProducts[0] ? topSellingProducts[0].productName : "N/A";

  // Build dynamic activity feed logs
  const activityFeedList = [];
  targetTransactions.slice(0, 3).forEach((t) => {
    activityFeedList.push({
      id: `tx-${t._id.toString()}`,
      message: `Order ${t.orderNo} placed by ${t.customer} (₹${t.amount})`,
      time: new Date(t.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    });
  });
  allProducts.slice(0, 2).forEach((p) => {
    activityFeedList.push({
      id: `prod-${p._id.toString()}`,
      message: `New product "${p.name}" cataloged`,
      time: new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    });
  });

  // Call FastAPI analytics endpoints and merge
  let mlRevenue = null;
  let mlBenchmarking = null;
  try {
    const { callFastAPI } = require("../utils/mlClient");
    mlRevenue = await callFastAPI(`/api/analytics/revenue?days=${historyDays}${vendorId ? `&vendorId=${vendorId}` : ""}`);
    mlBenchmarking = await callFastAPI(`/api/analytics/benchmarking?days=${historyDays}`);
  } catch (err) {
    console.error("FastAPI analytics fallback triggered:", err.message);
  }

  // G. Combine into unified payload
  const result = {
    metadata: {
      generatedAt: new Date().toISOString(),
      lastTransaction: targetTransactions[0] ? targetTransactions[0].date : null,
      forecastPeriod: forecastDays,
      historyPeriod: historyDays,
      vendorScope: vendorId,
    },
    mlRevenue,
    mlBenchmarking,
    summary: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalProducts: allProducts.length,
      totalVendors: allVendors.length,
      totalCustomers: custAnalytics.summaryCards?.totalCustomers || totalCustomersCount,
      totalTransactions: totalTransactionsCount,
      totalInventoryItems: totalStockCount,
      productsSold: totalUnitsSold,
      averageOrderValue: avgOrderValue,
      averageCustomerSpending: custAnalytics.summaryCards?.averageCustomerSpending || 0,
      averageDailySales: parseFloat((totalRevenue / (historyDays || 30)).toFixed(2)),
      inventoryCoverage: forecastData.inventoryCoverage || 0,
      forecastDemand: forecastData.forecastDemand || 0,
      recommendationCoverage,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
    },
    revenue: {
      dailyRevenue: dailyRevenueTrend,
      weeklyRevenue: weeklyRevenueTrend,
      monthlyRevenue: monthlyRevenueTrend,
      yearlyRevenue: [],
    },
    sales: {
      productsSold: totalUnitsSold,
      unitsSold: totalUnitsSold,
      averageUnitsPerOrder: avgUnitsPerOrder,
    },
    inventory: {
      currentInventory: totalStockCount,
      healthyProducts: healthyCount,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      inventoryValue: totalInventoryVal,
      averageStock: avgStock,
      inventoryTurnover: totalTransactionsCount > 0 ? parseFloat((totalUnitsSold / (avgStock || 1)).toFixed(2)) : 0,
      inventoryCoverage: forecastData.inventoryCoverage || 0,
      statusDistribution: {
        healthy: healthyCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
    },
    customer: {
      totalCustomers: custAnalytics.summaryCards?.totalCustomers || totalCustomersCount,
      repeatCustomers: custAnalytics.summaryCards?.repeatCustomers || 0,
      newCustomers: targetCustDocsCount(targetTransactions, thirtyDaysAgo),
      customerGrowth: (custAnalytics.monthlyGrowth || []).map((g) => ({
        month: g.month,
        newCustomers: g.newCustomers,
        cumulative: g.totalCustomers,
      })),
      averageSpending: custAnalytics.summaryCards?.averageCustomerSpending || 0,
      averageOrderValue: custAnalytics.summaryCards?.averageOrderValue || 0,
      highestSpendingCustomer: custAnalytics.summaryCards?.highestSpendingCustomer || "N/A",
      segments: segData.summaryMetrics || {},
    },
    vendor: {
      performance: vendorPerformance,
      totalActiveVendors: allVendors.length,
      avgVendorRevenue: allVendors.length > 0 ? parseFloat((totalRevenue / allVendors.length).toFixed(2)) : 0,
    },
    product: {
      topSelling: topSellingProducts,
      lowestSelling: lowestSellingProducts,
      highestRevenue: highestRevenueProducts,
      categoryDistribution,
    },
    forecast: forecastData,
    recommendation: {
      mostRecommendedProduct,
      mostRecommendedCategory,
      recommendationCoverage,
      averageRecommendationScore: avgRecommendationScore,
      trendingProducts: topSellingProducts.slice(0, 3).map(p => p.productName),
      customersWithRecommendations: 0,
      topTrendingProduct: topTrendingProduct,
    },
    activityFeed: activityFeedList,
  };

  // Cache compiled payload for 5 minutes
  dashboardCache[cacheKey] = {
    data: result,
    expiry: now + 5 * 60 * 1000,
  };

  return result;
};

// Helper to count new customer documents registered in last 30 days
const targetCustDocsCount = (txs, thresholdDate) => {
  const seenCust = new Set();
  txs.forEach((t) => {
    if (t.customerId && new Date(t.customerId.createdAt) >= thresholdDate) {
      seenCust.add(t.customerId._id.toString());
    }
  });
  return seenCust.size;
};

module.exports = {
  getDashboardAnalytics,
  invalidateDashboardCache,
};
