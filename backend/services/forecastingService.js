const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Inventory = require("../models/Inventory");
const Vendor = require("../models/Vendor");
const mongoose = require("mongoose");

// Cache storage map
const forecastCache = new Map();

/**
 * @desc Clear the forecasting cache manually when stock/transactions modify
 */
const clearForecastCache = () => {
  console.log("[CACHE] Invalidate forecasting cache.");
  forecastCache.clear();
  try {
    require("./dashboardAnalyticsService").invalidateDashboardCache();
  } catch (err) {
    console.error("Error invalidating dashboard analytics cache:", err);
  }
  try {
    require("./businessIntelligenceService").invalidateBusinessIntelligenceCache();
  } catch (err) {
    console.error("Error invalidating business intelligence cache:", err);
  }
  try {
    require("./businessInsightsService").invalidateBusinessInsightsCache();
  } catch (err) {
    console.error("Error invalidating business insights cache:", err);
  }
};

/**
 * @desc Get dynamic inventory forecasting analytics
 */
const getForecastData = async (queryOptions = {}) => {
  const {
    historyDays = 30,
    forecastDays = 30,
    vendorId,
    category,
    search,
    status,
    sortBy = "forecastDemand",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = queryOptions;

  // Generate cache key for request options
  const cacheKey = JSON.stringify({
    historyDays,
    forecastDays,
    vendorId,
    category,
    search,
    status,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  // Check if cache contains valid entry
  if (forecastCache.has(cacheKey)) {
    const cachedEntry = forecastCache.get(cacheKey);
    if (Date.now() - cachedEntry.timestamp < 5 * 60 * 1000) {
      return cachedEntry.data;
    }
  }

  // Base Match stage for Product filters
  const matchStage = {};
  if (vendorId) {
    matchStage.vendorId = new mongoose.Types.ObjectId(vendorId);
  }
  if (category) {
    matchStage.category = category;
  }

  const historyWindowDate = new Date();
  historyWindowDate.setDate(historyWindowDate.getDate() - parseInt(historyDays));

  const pipeline = [
    { $match: matchStage },

    // Join with Inventory
    {
      $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "productId",
        as: "inventoryInfo",
      },
    },
    { $unwind: { path: "$inventoryInfo", preserveNullAndEmptyArrays: true } },

    // Join with Vendor
    {
      $lookup: {
        from: "vendors",
        localField: "vendorId",
        foreignField: "_id",
        as: "vendorInfo",
      },
    },
    { $unwind: { path: "$vendorInfo", preserveNullAndEmptyArrays: true } },

    // Join with matching paid transactions in the historical window
    {
      $lookup: {
        from: "transactions",
        let: { prodId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$productId", "$$prodId"] },
                  { $eq: ["$status", "paid"] },
                  { $gte: ["$date", historyWindowDate] },
                ],
              },
            },
          },
        ],
        as: "recentTransactions",
      },
    },

    // Intermediate counts and defaults
    {
      $addFields: {
        totalQtySoldInWindow: { $sum: "$recentTransactions.qty" },
        currentStock: { $ifNull: ["$inventoryInfo.currentStock", 0] },
        minimumStock: { $ifNull: ["$inventoryInfo.minimumStock", 10] },
        maximumStock: { $ifNull: ["$inventoryInfo.maximumStock", 100] },
      },
    },

    // Daily Sales Rate
    {
      $addFields: {
        averageSalesPerDay: {
          $round: [
            { $divide: ["$totalQtySoldInWindow", parseFloat(historyDays)] },
            2,
          ],
        },
      },
    },

    // Forecast Demand
    {
      $addFields: {
        forecastDemand: {
          $round: [
            { $multiply: ["$averageSalesPerDay", parseFloat(forecastDays)] },
            0,
          ],
        },
      },
    },

    // Status and secondary metrics calculations
    {
      $addFields: {
        suggestedReorderQuantity: {
          $max: [
            0,
            { $round: [{ $subtract: ["$forecastDemand", "$currentStock"] }, 0] },
          ],
        },
        estimatedRemainingDays: {
          $cond: {
            if: { $eq: ["$averageSalesPerDay", 0] },
            then: null,
            else: {
              $round: [
                { $divide: ["$currentStock", "$averageSalesPerDay"] },
                1,
              ],
            },
          },
        },
        stockCoveragePercentage: {
          $cond: {
            if: { $gt: ["$forecastDemand", 0] },
            then: {
              $round: [
                { $multiply: [{ $divide: ["$currentStock", "$forecastDemand"] }, 100] },
                0,
              ],
            },
            else: 100,
          },
        },
        stockUtilizationRate: {
          $cond: {
            if: { $gt: ["$maximumStock", 0] },
            then: {
              $round: [
                { $multiply: [{ $divide: ["$forecastDemand", "$maximumStock"] }, 100] },
                0,
              ],
            },
            else: 0,
          },
        },
      },
    },

    // Final statuses & dates
    {
      $addFields: {
        forecastStatus: {
          $cond: {
            if: { $eq: ["$currentStock", 0] },
            then: "Out of Stock Risk",
            else: {
              $cond: {
                if: { $lt: ["$currentStock", "$forecastDemand"] },
                then: "Low Stock Risk",
                else: "Healthy",
              },
            },
          },
        },
        projectedStockoutDate: {
          $cond: {
            if: { $gt: ["$averageSalesPerDay", 0] },
            then: {
              $add: [
                new Date(),
                { $multiply: ["$estimatedRemainingDays", 24 * 60 * 60 * 1000] },
              ],
            },
            else: null,
          },
        },
      },
    },
  ];

  // Apply search constraints
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { "vendorInfo.businessName": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Apply forecast status constraint
  if (status) {
    pipeline.push({
      $match: { forecastStatus: status },
    });
  }

  // Sort specifications
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const mongoSort = {};
  if (sortBy === "productName") {
    mongoSort["name"] = sortDirection;
  } else {
    mongoSort[sortBy] = sortDirection;
  }
  pipeline.push({ $sort: mongoSort });

  // Strip temporary array projections before calculating aggregates to conserve memory
  pipeline.push({
    $project: {
      recentTransactions: 0,
      inventoryInfo: 0,
    },
  });

  // Calculate total matched count
  const countPipeline = [...pipeline, { $count: "count" }];
  const countResult = await Product.aggregate(countPipeline);
  const totalProducts = countResult[0]?.count || 0;

  // Calculate metadata aggregates
  const aggPipeline = [
    ...pipeline,
    {
      $group: {
        _id: null,
        totalForecastDemand: { $sum: "$forecastDemand" },
        averageForecastDemand: { $avg: "$forecastDemand" },
      },
    },
  ];
  const aggResult = await Product.aggregate(aggPipeline);
  const totalForecastDemand = aggResult[0]?.totalForecastDemand || 0;
  const averageForecastDemand = aggResult[0]?.averageForecastDemand
    ? Math.round(aggResult[0].averageForecastDemand)
    : 0;

  // Pagination slicing
  const pageVal = parseInt(page);
  const limitVal = parseInt(limit);
  const skip = (pageVal - 1) * limitVal;

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limitVal });

  const data = await Product.aggregate(pipeline);

  // Format array
  const forecasts = data.map((item) => ({
    productId: item._id.toString(),
    productName: item.name,
    sku: item.sku,
    vendorId: item.vendorId ? item.vendorId.toString() : "",
    vendorName: item.vendorInfo?.businessName || "Unknown Vendor",
    category: item.category,
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    maximumStock: item.maximumStock,
    averageSalesPerDay: item.averageSalesPerDay,
    forecastDemand: item.forecastDemand,
    suggestedReorderQuantity: item.suggestedReorderQuantity,
    estimatedRemainingDays: item.estimatedRemainingDays, // null representing Infinity
    stockCoveragePercentage: item.stockCoveragePercentage,
    stockUtilizationRate: item.stockUtilizationRate,
    projectedStockoutDate: item.projectedStockoutDate,
    forecastStatus: item.forecastStatus,
    forecastDays: parseInt(forecastDays),
    historyDays: parseInt(historyDays),
    lastUpdated: item.updatedAt || item.createdAt,
  }));

  // Call FastAPI forecasting endpoint and merge
  let mlForecast = null;
  try {
    const { callFastAPI } = require("../utils/mlClient");
    mlForecast = await callFastAPI(`/api/forecasting/predict?days=${forecastDays}`);
  } catch (err) {
    console.error("FastAPI forecast fallback triggered:", err.message);
  }

  const responsePayload = {
    forecasts,
    metadata: {
      generatedAt: new Date().toISOString(),
      forecastDays: parseInt(forecastDays),
      historyDays: parseInt(historyDays),
      totalProducts,
      totalForecastDemand,
      averageForecastDemand,
      page: pageVal,
      pages: Math.ceil(totalProducts / limitVal) || 1,
      limit: limitVal,
    },
    mlForecast,
  };

  // Save to cache
  forecastCache.set(cacheKey, {
    timestamp: Date.now(),
    data: responsePayload,
  });

  return responsePayload;
};

module.exports = {
  getForecastData,
  clearForecastCache,
};
