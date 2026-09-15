const customerBehaviorService = require("../services/customerBehaviorService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get customer behavior logs profile
 */
const getBehavior = async (req, res, next) => {
  try {
    const doc = await customerBehaviorService.getOrCreateBehavior(req.user._id);
    res.status(200).json(new ApiResponse(200, doc, "Behavioral logs retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log page view action, boosting category/vendor affinities
 */
const trackView = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }
    const doc = await customerBehaviorService.trackProductView(req.user._id, productId);
    res.status(200).json(new ApiResponse(200, doc, "View behavior logged successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log search keyword query, tracking query lists
 */
const trackSearch = async (req, res, next) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      throw new ApiError(400, "Keyword is required");
    }
    const doc = await customerBehaviorService.trackSearchKeyword(req.user._id, keyword);
    res.status(200).json(new ApiResponse(200, doc, "Search behavior logged successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log click on recommendation card
 */
const trackClick = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }
    const doc = await customerBehaviorService.trackRecommendationClick(req.user._id, productId);
    res.status(200).json(new ApiResponse(200, doc, "Recommendation click logged successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBehavior,
  trackView,
  trackSearch,
  trackClick,
};
