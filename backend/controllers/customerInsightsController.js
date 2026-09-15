const customerInsightsService = require("../services/customerInsightsService");
const ApiResponse = require("../utils/ApiResponse");

const getInsights = async (req, res, next) => {
  try {
    const insights = await customerInsightsService.getCustomerInsights(req.user._id);
    return res.status(200).json(new ApiResponse(200, insights, "Customer insights compiled successfully"));
  } catch (e) {
    next(e);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const insights = await customerInsightsService.getCustomerInsights(req.user._id);
    const summary = {
      monthlySpending: insights.monthlySpending,
      averageOrderValue: insights.averageOrderValue,
      totalOrders: insights.totalOrders,
      totalSpent: insights.totalSpent,
      savings: insights.savings,
    };
    return res.status(200).json(new ApiResponse(200, summary, "Customer insights summary compiled successfully"));
  } catch (e) {
    next(e);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const Order = require("../models/Order");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      customerId: req.user._id,
      orderStatus: { $ne: "cancelled" },
      createdAt: { $gte: sixMonthsAgo },
    }).lean();

    const monthlyMap = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { month: key, spending: 0, count: 0 };
    }

    orders.forEach(o => {
      const dt = new Date(o.createdAt);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].spending += o.totalAmount;
        monthlyMap[key].count += 1;
      }
    });

    const history = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    return res.status(200).json(new ApiResponse(200, history, "Customer spending history compiled successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getInsights,
  getSummary,
  getHistory,
};
