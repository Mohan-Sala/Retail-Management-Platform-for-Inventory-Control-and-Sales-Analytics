const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const User = require("../models/User");

/**
 * @desc Compile customer analytics summary cards, charts, and tables
 */
const getCustomerAnalytics = async (options = {}) => {
  const { vendorId = null, startDate = null, endDate = null, category = "all", city = "all", search = "" } = options;

  // Build match query for Transactions
  const txMatch = { status: "paid" };
  if (vendorId) {
    txMatch.vendorId = new mongoose.Types.ObjectId(vendorId);
  }

  // Handle date filters
  if (startDate || endDate) {
    txMatch.date = {};
    if (startDate) txMatch.date.$gte = new Date(startDate);
    if (endDate) txMatch.date.$lte = new Date(endDate);
  }

  // Fetch all transactions matching filter to compute statistics
  const matchingTransactions = await Transaction.find(txMatch).lean();
  const matchedCustomerIds = Array.from(new Set(matchingTransactions.map((tx) => tx.customerId?.toString()).filter(Boolean)));

  // Build match query for Customers
  const customerMatch = { isActive: true };
  if (vendorId) {
    // Scoped to customers who have bought from this vendor
    customerMatch._id = { $in: matchedCustomerIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  // Handle city filter
  if (city && city !== "all") {
    customerMatch.city = new RegExp(`^${city.trim()}$`, "i");
  }

  // Handle search filter
  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    customerMatch.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  // Retrieve matching customers
  const allMatchedCustomers = await Customer.find(customerMatch).lean();

  // Handle category filter on customers
  let customersList = allMatchedCustomers;
  if (category && category !== "all") {
    const catLower = category.trim().toLowerCase();
    customersList = allMatchedCustomers.filter((c) => {
      const spend = c.totalSpending || 0;
      let actualCat = "bronze";
      if (spend >= 5000) actualCat = "gold";
      else if (spend >= 1500) actualCat = "silver";
      return actualCat === catLower;
    });
  }

  const customerIdsFiltered = customersList.map((c) => c._id.toString());

  // Re-filter transactions to match only the filtered customers
  const txs = matchingTransactions.filter((tx) => tx.customerId && customerIdsFiltered.includes(tx.customerId.toString()));

  // 1. Customer Summary metrics
  const totalCustomers = customersList.length;
  const activeCustomers = customersList.filter((c) => c.isActive).length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newCustomers = customersList.filter((c) => c.createdAt >= thirtyDaysAgo).length;

  const totalOrders = txs.length;
  const totalCustomerRevenue = txs.reduce((sum, t) => sum + t.amount, 0);

  const avgOrderValue = totalOrders > 0 ? parseFloat((totalCustomerRevenue / totalOrders).toFixed(2)) : 0;
  const avgCustomerSpending = totalCustomers > 0 ? parseFloat((totalCustomerRevenue / totalCustomers).toFixed(2)) : 0;

  // Group by customer to find top/lowest spending and repeat shoppers
  const customerSpendMap = {};
  txs.forEach((t) => {
    const cid = t.customerId.toString();
    if (!customerSpendMap[cid]) {
      customerSpendMap[cid] = { orders: 0, spending: 0 };
    }
    customerSpendMap[cid].orders += 1;
    customerSpendMap[cid].spending += t.amount;
  });

  let repeatCustomers = 0;
  let highestSpendingVal = 0;
  let highestSpendingCustomer = "N/A";
  let lowestSpendingVal = Infinity;
  let lowestSpendingCustomer = "N/A";

  customersList.forEach((c) => {
    const cid = c._id.toString();
    const stats = customerSpendMap[cid] || { orders: 0, spending: 0 };
    
    if (stats.orders > 1) {
      repeatCustomers += 1;
    }

    if (stats.spending > highestSpendingVal) {
      highestSpendingVal = stats.spending;
      highestSpendingCustomer = c.name;
    }

    if (stats.spending > 0 && stats.spending < lowestSpendingVal) {
      lowestSpendingVal = stats.spending;
      lowestSpendingCustomer = c.name;
    }
  });

  if (lowestSpendingVal === Infinity) {
    lowestSpendingVal = 0;
    lowestSpendingCustomer = "N/A";
  }

  // 2. Customer Segmentation (Gold, Silver, Bronze)
  const segments = {
    Gold: { count: 0, revenue: 0 },
    Silver: { count: 0, revenue: 0 },
    Bronze: { count: 0, revenue: 0 },
  };

  customersList.forEach((c) => {
    const cid = c._id.toString();
    const stats = customerSpendMap[cid] || { orders: 0, spending: 0 };
    const spend = c.totalSpending || 0;
    let tier = "Bronze";
    if (spend >= 5000) tier = "Gold";
    else if (spend >= 1500) tier = "Silver";

    segments[tier].count += 1;
    segments[tier].revenue += stats.spending;
  });

  const segmentation = Object.keys(segments).map((key) => {
    const count = segments[key].count;
    const rev = segments[key].revenue;
    return {
      segment: key,
      count,
      percentage: totalCustomers > 0 ? parseFloat(((count / totalCustomers) * 100).toFixed(1)) : 0,
      revenueContribution: totalCustomerRevenue > 0 ? parseFloat(((rev / totalCustomerRevenue) * 100).toFixed(1)) : 0,
      averageSpending: count > 0 ? parseFloat((rev / count).toFixed(2)) : 0,
    };
  });

  // 3. Top Customers list
  const topCustomersData = customersList.map((c) => {
    const cid = c._id.toString();
    const stats = customerSpendMap[cid] || { orders: 0, spending: 0 };
    const spend = c.totalSpending || 0;
    let tier = "Bronze";
    if (spend >= 5000) tier = "Gold";
    else if (spend >= 1500) tier = "Silver";

    const lastPurchaseDate = txs.filter((tx) => tx.customerId.toString() === cid)
      .sort((a, b) => b.date - a.date)[0]?.date || null;

    return {
      id: c._id.toString(),
      name: c.name,
      orders: stats.orders,
      revenue: stats.spending,
      averageOrderValue: stats.orders > 0 ? parseFloat((stats.spending / stats.orders).toFixed(2)) : 0,
      category: tier,
      lastPurchase: lastPurchaseDate,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // 4. Monthly Customer Growth & Trends
  // Group customers and transactions by month
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyDataMap = {};

  // Initialize last 12 months maps
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const timeline = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const label = `${monthsList[d.getMonth()]} ${d.getFullYear()}`;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    timeline.push({ label, key, year: d.getFullYear(), month: d.getMonth() + 1 });
    monthlyDataMap[key] = { newCustomers: 0, revenue: 0, orders: 0, customersSet: new Set() };
  }

  // Count new customers in each month
  customersList.forEach((c) => {
    const created = new Date(c.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].newCustomers += 1;
    }
  });

  // Track transactions and revenue in each month
  txs.forEach((t) => {
    const txDate = new Date(t.date);
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].revenue += t.amount;
      monthlyDataMap[key].orders += 1;
      monthlyDataMap[key].customersSet.add(t.customerId.toString());
    }
  });

  let cumulativeCustomers = totalCustomers - customersList.filter((c) => new Date(c.createdAt) >= new Date(timeline[0].year, timeline[0].month - 1, 1)).length;

  const monthlyGrowth = timeline.map((time) => {
    const mData = monthlyDataMap[time.key];
    cumulativeCustomers += mData.newCustomers;
    return {
      month: time.label,
      newCustomers: mData.newCustomers,
      totalCustomers: cumulativeCustomers,
      revenue: parseFloat(mData.revenue.toFixed(2)),
      orders: mData.orders,
    };
  });

  const monthlyPurchaseTrend = timeline.map((time) => {
    const mData = monthlyDataMap[time.key];
    const uniqueCustCount = mData.customersSet.size;
    return {
      month: time.label,
      revenue: parseFloat(mData.revenue.toFixed(2)),
      orders: mData.orders,
      customers: uniqueCustCount,
      averageOrderValue: mData.orders > 0 ? parseFloat((mData.revenue / mData.orders).toFixed(2)) : 0,
    };
  });

  // 4.1 Daily Customer Growth & Trends (last 30 days)
  const dailyDataMap = {};
  const dailyTimeline = [];
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const day = String(d.getDate()).padStart(2, "0");
    const monthName = d.toLocaleString("default", { month: "short" });
    const label = `${day} ${monthName}`;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dailyTimeline.push({ label, key, date: d });
    dailyDataMap[key] = { newCustomers: 0, revenue: 0, orders: 0, customersSet: new Set() };
  }

  customersList.forEach((c) => {
    const created = new Date(c.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
    if (dailyDataMap[key]) {
      dailyDataMap[key].newCustomers += 1;
    }
  });

  txs.forEach((t) => {
    const txDate = new Date(t.date);
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}-${String(txDate.getDate()).padStart(2, "0")}`;
    if (dailyDataMap[key]) {
      dailyDataMap[key].revenue += t.amount;
      dailyDataMap[key].orders += 1;
      dailyDataMap[key].customersSet.add(t.customerId.toString());
    }
  });

  const dailyTimelineStart = new Date(dailyTimeline[0].date);
  dailyTimelineStart.setHours(0, 0, 0, 0);

  let cumulativeDailyCustomers = totalCustomers - customersList.filter((c) => new Date(c.createdAt) >= dailyTimelineStart).length;

  const dailyGrowth = dailyTimeline.map((time) => {
    const mData = dailyDataMap[time.key];
    cumulativeDailyCustomers += mData.newCustomers;
    return {
      day: time.label,
      newCustomers: mData.newCustomers,
      totalCustomers: cumulativeDailyCustomers,
      revenue: parseFloat(mData.revenue.toFixed(2)),
      orders: mData.orders,
    };
  });

  const dailyPurchaseTrend = dailyTimeline.map((time) => {
    const mData = dailyDataMap[time.key];
    const uniqueCustCount = mData.customersSet.size;
    return {
      day: time.label,
      revenue: parseFloat(mData.revenue.toFixed(2)),
      orders: mData.orders,
      customers: uniqueCustCount,
      averageOrderValue: mData.orders > 0 ? parseFloat((mData.revenue / mData.orders).toFixed(2)) : 0,
    };
  });

  // 5. City Breakdown analytics
  const cityDataMap = {};
  customersList.forEach((c) => {
    const city = c.city || "Other";
    if (!cityDataMap[city]) {
      cityDataMap[city] = { count: 0, revenue: 0, orders: 0 };
    }
    cityDataMap[city].count += 1;
    const cid = c._id.toString();
    const stats = customerSpendMap[cid] || { orders: 0, spending: 0 };
    cityDataMap[city].orders += stats.orders;
    cityDataMap[city].revenue += stats.spending;
  });

  const cityAnalytics = Object.keys(cityDataMap).map((city) => {
    const data = cityDataMap[city];
    return {
      city,
      customerCount: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      orders: data.orders,
      averageSpending: data.count > 0 ? parseFloat((data.revenue / data.count).toFixed(2)) : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // 6. CLV statistics
  const clvAnalytics = {
    totalSpending: totalCustomerRevenue,
    orders: totalOrders,
    averageOrderValue: avgOrderValue,
    customerLifetimeValue: totalCustomers > 0 ? parseFloat((totalCustomerRevenue / totalCustomers).toFixed(2)) : 0,
  };

  // 7. Repeat Purchase Analysis
  const firstTimeCustomersCount = totalCustomers - repeatCustomers;
  const repeatPurchaseRate = totalCustomers > 0 ? parseFloat(((repeatCustomers / totalCustomers) * 100).toFixed(1)) : 0;
  
  const totalRepeatOrders = txs.filter((t) => {
    const cid = t.customerId.toString();
    const stats = customerSpendMap[cid];
    return stats && stats.orders > 1;
  }).length;
  const averageRepeatOrders = repeatCustomers > 0 ? parseFloat((totalRepeatOrders / repeatCustomers).toFixed(1)) : 0;

  const repeatPurchaseAnalysis = {
    firstTimeCustomers: firstTimeCustomersCount,
    repeatCustomers,
    repeatPurchaseRate,
    averageRepeatOrders,
  };

  // Calculate Customer Growth (last 30 days vs prior 30 days)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const recentCustCount = customersList.filter((c) => c.createdAt >= thirtyDaysAgo).length;
  const priorCustCount = customersList.filter((c) => c.createdAt >= sixtyDaysAgo && c.createdAt < thirtyDaysAgo).length;
  const customerGrowth = priorCustCount > 0 
    ? parseFloat((((recentCustCount - priorCustCount) / priorCustCount) * 100).toFixed(1)) 
    : (recentCustCount > 0 ? 100 : 0);

  // 8. Category Distribution
  const categoryDistribution = segmentation.map((seg) => ({
    category: seg.segment,
    count: seg.count,
    percentage: seg.percentage,
  }));

  // Compiling the combined payload
  const summaryPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      vendorId,
      filters: { startDate, endDate, category, city, search },
    },
    summaryCards: {
      totalCustomers,
      activeCustomers,
      newCustomers,
      repeatCustomers,
      averageOrderValue: avgOrderValue,
      averageCustomerSpending: avgCustomerSpending,
      totalCustomerRevenue,
      highestSpendingCustomer,
      lowestSpendingCustomer,
      customerGrowth,
    },
    segmentation,
    topCustomers: topCustomersData,
    monthlyGrowth,
    monthlyPurchaseTrend,
    dailyGrowth,
    dailyPurchaseTrend,
    cityAnalytics,
    clvAnalytics,
    repeatPurchaseAnalysis,
    categoryDistribution,
  };

  // Call FastAPI customer intelligence service and merge
  try {
    const { callFastAPI } = require("../utils/mlClient");
    const mlCustomerIntelligence = await callFastAPI("/api/customer-intelligence/segmentation");
    summaryPayload.mlCustomerIntelligence = mlCustomerIntelligence;
  } catch (err) {
    console.error("FastAPI customer intelligence fallback triggered:", err.message);
  }

  return summaryPayload;
};

module.exports = {
  getCustomerAnalytics,
};
