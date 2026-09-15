const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const CustomerSegment = require("../models/CustomerSegment");
const Order = require("../models/Order");
const User = require("../models/User");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const Notification = require("../models/Notification");
const SystemAudit = require("../models/SystemAudit");

/**
 * @desc Deterministically evaluate and save customer segmentation parameters
 */
const calculateSegment = async (customerId) => {
  const user = await User.findById(customerId);
  if (!user) return null;

  const orders = await Order.find({ customerId, orderStatus: "delivered" }).lean();
  const loyalty = await LoyaltyAccount.findOne({ customerId }).lean();

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completedOrders = orders.length;

  let lastPurchaseDaysAgo = 999;
  if (orders.length > 0) {
    const lastOrder = orders.reduce((latest, o) => {
      return new Date(o.createdAt) > new Date(latest.createdAt) ? o : latest;
    }, orders[0]);
    const diffTime = Math.abs(Date.now() - new Date(lastOrder.createdAt).getTime());
    lastPurchaseDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } else {
    const diffTime = Math.abs(Date.now() - new Date(user.createdAt).getTime());
    lastPurchaseDaysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  let segment = "Active Customer";
  let reason = "Customer shows typical active buying habits.";

  if (lastPurchaseDaysAgo > 90) {
    segment = "Inactive Customer";
    reason = "No purchase has been logged in over 90 days.";
  } else if (lastPurchaseDaysAgo > 30 && completedOrders > 0) {
    segment = "At Risk";
    reason = "Customer has purchase history but hasn't ordered in over 30 days.";
  } else if (new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && completedOrders <= 1) {
    segment = "New Customer";
    reason = "Customer account registered in the past 7 days.";
  } else if (totalSpent >= 10000) {
    segment = "High Value Customer";
    reason = "Total completed purchase value exceeds ₹10,000 threshold.";
  } else if (loyalty && (loyalty.currentTier === "Silver" || loyalty.currentTier === "Gold")) {
    segment = "Loyal Customer";
    reason = "Customer reached Silver or Gold loyalty tier status levels.";
  } else if (completedOrders >= 2) {
    segment = "Repeat Customer";
    reason = "Customer has completed multiple platform purchases.";
  }

  let doc = await CustomerSegment.findOne({ customerId });
  const previousSegment = doc ? doc.segment : "";

  const calculatedMetrics = {
    totalSpent,
    completedOrders,
    lastPurchaseDaysAgo,
    loyaltyTier: loyalty ? loyalty.currentTier : "Bronze",
  };

  if (!doc) {
    doc = new CustomerSegment({
      customerId,
      segment,
      previousSegment: "",
      segmentReason: reason,
      calculatedMetrics,
      calculatedAt: new Date(),
    });
  } else {
    if (doc.segment !== segment) {
      doc.previousSegment = previousSegment;
      doc.segmentChangedAt = new Date();
      doc.segment = segment;
      doc.segmentReason = reason;
    }
    doc.calculatedMetrics = calculatedMetrics;
    doc.calculatedAt = new Date();
  }

  await doc.save();

  // Create audit trail log
  if (previousSegment !== segment) {
    await SystemAudit.create({
      userId: customerId,
      action: "CUSTOMER_SEGMENT_UPDATED",
      details: `Segment changed from ${previousSegment || "None"} to ${segment}. Reason: ${reason}`,
      timestamp: new Date(),
    });

    // Send personalized re-engagement notifications
    if (segment === "At Risk" || segment === "Inactive Customer") {
      await Notification.create({
        userId: customerId,
        title: "We Miss You!",
        message: "Check out our latest arrivals and enjoy exclusive checkout discount points just for you.",
        type: "promotional",
      });
    } else if (previousSegment === "At Risk" || previousSegment === "Inactive Customer") {
      await Notification.create({
        userId: customerId,
        title: "Welcome Back!",
        message: "Thank you for shopping with us again. Check out your personalized dashboard for rewards.",
        type: "promotional",
      });
    }
  }
  
  const dashboardAnalyticsService = require("./dashboardAnalyticsService");
  const businessInsightsService = require("./businessInsightsService");

  dashboardAnalyticsService.invalidateDashboardCache();
  businessInsightsService.invalidateBusinessInsightsCache();

  return doc;
};

const getCustomerSegment = async (customerId) => {
  let seg = await CustomerSegment.findOne({ customerId }).lean();
  if (!seg) {
    seg = await calculateSegment(customerId);
  }
  return seg;
};

/**
 * @desc Get customer segmentation lists, parameters, filters, and summary stats
 */
const getSegmentationData = async (options = {}) => {
  const {
    vendorId = null,
    category = "all",
    city = "all",
    minSpending = null,
    maxSpending = null,
    search = "",
    sortBy = "spending",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = options;

  // Build match query for active customers
  const customerMatch = { isActive: true };

  if (city && city !== "all") {
    customerMatch.city = new RegExp(`^${city.trim()}$`, "i");
  }

  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    customerMatch.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  // Construct MongoDB Aggregation Pipeline
  const pipeline = [
    { $match: customerMatch },
    // Lookup transaction statistics matching this customer
    {
      $lookup: {
        from: "transactions",
        let: { custId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$customerId", "$$custId"] },
                  { $eq: ["$status", "paid"] },
                  ...(vendorId ? [{ $eq: ["$vendorId", new mongoose.Types.ObjectId(vendorId)] }] : [])
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              orders: { $sum: 1 },
              spending: { $sum: "$amount" },
              lastPurchase: { $max: "$date" }
            }
          }
        ],
        as: "txStats"
      }
    },
    {
      $addFields: {
        stats: { $arrayElemAt: ["$txStats", 0] }
      }
    },
    {
      $addFields: {
        orders: { $ifNull: ["$stats.orders", 0] },
        spending: { $ifNull: ["$stats.spending", 0] },
        lastPurchase: { $ifNull: ["$stats.lastPurchase", null] }
      }
    }
  ];

  // If vendorId is scoped, filter customers who have transactions with this vendor
  if (vendorId) {
    pipeline.push({ $match: { orders: { $gt: 0 } } });
  }

  // Add category field based on spending
  pipeline.push({
    $addFields: {
      category: {
        $cond: [
          { $gte: ["$spending", 5000] },
          "Gold",
          {
            $cond: [
              { $gte: ["$spending", 1500] },
              "Silver",
              "Bronze"
            ]
          }
        ]
      }
    }
  });

  // Category and spending range filters
  if (category && category !== "all") {
    pipeline.push({ $match: { category: new RegExp(`^${category.trim()}$`, "i") } });
  }

  const spendFilter = {};
  if (minSpending !== null && !isNaN(parseFloat(minSpending))) {
    spendFilter.$gte = parseFloat(minSpending);
  }
  if (maxSpending !== null && !isNaN(parseFloat(maxSpending))) {
    spendFilter.$lte = parseFloat(maxSpending);
  }
  if (Object.keys(spendFilter).length > 0) {
    pipeline.push({ $match: { spending: spendFilter } });
  }

  // Project only required fields
  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      phone: 1,
      city: 1,
      address: 1,
      orders: 1,
      spending: 1,
      lastPurchase: 1,
      category: 1,
      createdAt: 1,
    }
  });

  // Execute pipeline
  const allResults = await Customer.aggregate(pipeline);

  // Calculate summary metrics
  const totalCustomers = allResults.length;
  let bronzeCount = 0;
  let silverCount = 0;
  let goldCount = 0;
  let bronzeRevenue = 0;
  let silverRevenue = 0;
  let goldRevenue = 0;
  let totalRevenue = 0;
  let highestSpendingVal = 0;
  let highestSpendingCustomer = "N/A";

  allResults.forEach((c) => {
    const spend = c.spending || 0;
    totalRevenue += spend;

    if (c.category === "Gold") {
      goldCount++;
      goldRevenue += spend;
    } else if (c.category === "Silver") {
      silverCount++;
      silverRevenue += spend;
    } else {
      bronzeCount++;
      bronzeRevenue += spend;
    }

    if (spend > highestSpendingVal) {
      highestSpendingVal = spend;
      highestSpendingCustomer = c.name;
    }
  });

  const avgSpending = totalCustomers > 0 ? parseFloat((totalRevenue / totalCustomers).toFixed(2)) : 0;

  const distributionPercentages = {
    Gold: totalCustomers > 0 ? parseFloat(((goldCount / totalCustomers) * 100).toFixed(1)) : 0,
    Silver: totalCustomers > 0 ? parseFloat(((silverCount / totalCustomers) * 100).toFixed(1)) : 0,
    Bronze: totalCustomers > 0 ? parseFloat(((bronzeCount / totalCustomers) * 100).toFixed(1)) : 0,
  };

  const summaryMetrics = {
    totalCustomers,
    bronzeCustomers: bronzeCount,
    silverCustomers: silverCount,
    goldCustomers: goldCount,
    bronzeRevenue: parseFloat(bronzeRevenue.toFixed(2)),
    silverRevenue: parseFloat(silverRevenue.toFixed(2)),
    goldRevenue: parseFloat(goldRevenue.toFixed(2)),
    averageSpending: avgSpending,
    highestSpendingCustomer,
    distributionPercentages,
  };

  // Add percentageContribution to list of customers
  const customerList = allResults.map((c) => {
    const contribution = totalRevenue > 0 ? parseFloat(((c.spending / totalRevenue) * 100).toFixed(2)) : 0;
    return {
      ...c,
      percentageContribution: contribution,
    };
  });

  // Apply sorting
  const sOrder = sortOrder === "asc" ? 1 : -1;
  customerList.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (typeof valA === "string") {
      return valA.localeCompare(valB) * sOrder;
    }
    if (valA instanceof Date) {
      return (+valA - +valB) * sOrder;
    }
    return ((valA || 0) - (valB || 0)) * sOrder;
  });

  // Apply pagination slicing
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIdx = (pageNum - 1) * limitNum;
  const paginatedList = customerList.slice(startIdx, startIdx + limitNum);

  const pagination = {
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(totalCustomers / limitNum) || 1,
    total: totalCustomers,
  };

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      vendorId,
      filters: { category, city, minSpending, maxSpending, search },
    },
    summaryMetrics,
    customers: paginatedList,
    pagination,
  };
};

module.exports = {
  calculateSegment,
  getCustomerSegment,
  getSegmentationData,
};
