const mongoose = require("mongoose");
const recommendationService = require("../services/recommendationService");
const recommendationAnalyticsService = require("../services/recommendationAnalyticsService");
const Customer = require("../models/Customer");
const Vendor = require("../models/Vendor");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get recommendations for a customer
 * @route GET /api/recommendations/:customerId
 */
const getRecommendations = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID parameter format" });
    }

    const User = require("../models/User");
    let targetCustomerId = customerId;
    let customer = await Customer.findOne({ _id: customerId, isActive: true });
    
    if (!customer) {
      const user = await User.findById(customerId);
      if (user) {
        customer = await Customer.findOne({ email: user.email, isActive: true });
        if (customer) {
          targetCustomerId = customer._id.toString();
        }
      }
    }

    if (!customer) {
      return res.status(200).json({ success: true, data: [] });
    }

    const userRole = req.user.role;
    let vendorId = null;

    if (userRole === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor profile not found" });
      }
      vendorId = vendor._id.toString();

      // Vendor scoping check
      const txCount = await Transaction.countDocuments({
        customerId: targetCustomerId,
        vendorId: vendor._id,
        status: "paid",
      });

      if (txCount === 0) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Vendor isolated to bought customers only",
        });
      }
    } else if (req.query.vendorId) {
      vendorId = req.query.vendorId;
    }

    const { category = "all", sortBy = "recommendationScore", sortOrder = "desc", page = 1, limit = 10 } = req.query;

    const data = await recommendationService.getRecommendations(targetCustomerId, {
      vendorId,
      category,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Personalized product recommendations compiled successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get trending products
 * @route GET /api/recommendations/trending
 */
const getTrending = async (req, res, next) => {
  try {
    const trending = await recommendationService.getTrendingProducts();
    res.status(200).json({
      success: true,
      message: "Trending products retrieved successfully",
      data: trending,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get frequently bought together
 * @route GET /api/recommendations/frequently-bought
 */
const getFrequentlyBought = async (req, res, next) => {
  try {
    const fbt = await recommendationService.getFrequentlyBoughtTogether();
    res.status(200).json({
      success: true,
      message: "Frequently bought together combinations retrieved",
      data: fbt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Save recommendation interaction feedback
 * @route POST /api/recommendations/feedback
 */
const postFeedback = async (req, res, next) => {
  try {
    const { customerId, productId, recommendationId, action } = req.body;
    if (!customerId || !productId || !recommendationId || !action) {
      return res.status(400).json({ success: false, message: "Missing required feedback fields" });
    }

    const feedback = await recommendationService.saveRecommendationFeedback({
      customerId,
      productId,
      recommendationId,
      action,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Recommendation feedback recorded successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get recommendation analytics dashboard stats
 * @route GET /api/recommendations/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const stats = await recommendationAnalyticsService.getRecommendationAnalytics(req.user);
    res.status(200).json({
      success: true,
      message: "Recommendation analytics compiled",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get detailed explanations for recommendations
 * @route GET /api/recommendations/explanations/:recommendationId
 */
const getExplanations = async (req, res, next) => {
  try {
    const { recommendationId } = req.params;
    const explanation = await recommendationService.getExplanations(recommendationId);
    res.status(200).json({
      success: true,
      message: "Recommendation explanation fetched",
      data: explanation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getTrending,
  getFrequentlyBought,
  postFeedback,
  getAnalytics,
  getExplanations,
};
