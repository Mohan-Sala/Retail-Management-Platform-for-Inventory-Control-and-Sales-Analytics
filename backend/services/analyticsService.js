const dashboardAnalyticsService = require("./dashboardAnalyticsService");

/**
 * @desc Get legacy analytics flat structure using dashboardAnalyticsService as single source of truth.
 */
const getAnalytics = async (queryOptions = {}) => {
  const options = typeof queryOptions === "string" ? { vendorId: queryOptions } : (queryOptions || {});
  const data = await dashboardAnalyticsService.getDashboardAnalytics(options);

  return {
    totalRevenue: data.summary.totalRevenue,
    totalTransactions: data.summary.totalTransactions,
    totalProducts: data.summary.totalProducts,
    totalVendors: data.summary.totalVendors,
    productsSold: data.summary.productsSold,
    activeVendors: data.vendor.totalActiveVendors,
    lowStock: data.summary.lowStockItems,
    categoryDistribution: data.product.categoryDistribution,
    topVendorsBySales: data.vendor.performance,
    revenueByMonth: data.revenue.monthlyRevenue,
    activityFeed: [], // Backward compatible placeholder
    forecastDemand: data.summary.forecastDemand,
    productsAtRisk: data.forecast.productsAtRisk || [],
    predictedStockouts: data.forecast.predictedStockouts || [],
    inventoryCoverage: data.summary.inventoryCoverage,
    totalCustomers: data.summary.totalCustomers,
    avgCustomerSpending: data.summary.averageCustomerSpending,
    avgOrderValue: data.summary.averageOrderValue,
    topCustomer: data.customer.highestSpendingCustomer,
    repeatCustomers: data.customer.repeatCustomers,
    customerGrowth: data.customer.customerGrowth,
    latestCustomer: data.customer.highestSpendingCustomer || "N/A",
    totalCustomerRevenue: data.summary.totalRevenue,
    goldCustomers: data.customer.segments?.goldCustomers || 0,
    silverCustomers: data.customer.segments?.silverCustomers || 0,
    bronzeCustomers: data.customer.segments?.bronzeCustomers || 0,
    goldRevenue: data.customer.segments?.goldRevenue || 0,
    silverRevenue: data.customer.segments?.silverRevenue || 0,
    bronzeRevenue: data.customer.segments?.bronzeRevenue || 0,
    topSegment: data.customer.segments?.topSegment || "Bronze",
    mostRecommendedProduct: data.recommendation.mostRecommendedProduct,
    mostRecommendedCategory: data.recommendation.mostRecommendedCategory,
    recommendationCoverage: data.recommendation.recommendationCoverage,
    avgRecommendationScore: data.recommendation.averageRecommendationScore,
    customersWithRecommendations: data.recommendation.customersWithRecommendations || 0,
    recommendationAccuracyPlaceholder: 85.5,
    topTrendingProduct: data.recommendation.topTrendingProduct || "N/A",
    recommendationTimestamp: data.metadata.generatedAt,
  };
};

module.exports = {
  getAnalytics,
};
