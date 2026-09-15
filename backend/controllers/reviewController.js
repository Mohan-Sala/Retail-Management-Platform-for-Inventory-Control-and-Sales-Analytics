const reviewService = require("../services/reviewService");
const ApiResponse = require("../utils/ApiResponse");

const getReviewsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await reviewService.getReviewsByProduct(productId);
    return res.status(200).json(new ApiResponse(200, reviews, "Product reviews fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user._id, req.body);
    return res.status(201).json(new ApiResponse(201, review, "Product review submitted successfully"));
  } catch (e) {
    next(e);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.user._id, req.body);
    return res.status(200).json(new ApiResponse(200, review, "Product review updated successfully"));
  } catch (e) {
    next(e);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.deleteReview(id, req.user._id, req.user.role);
    return res.status(200).json(new ApiResponse(200, review, "Product review deleted successfully"));
  } catch (e) {
    next(e);
  }
};

const restoreReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.restoreReview(id, req.user._id, req.user.role);
    return res.status(200).json(new ApiResponse(200, review, "Product review restored successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getReviewsByProduct,
  createReview,
  updateReview,
  deleteReview,
  restoreReview,
};
