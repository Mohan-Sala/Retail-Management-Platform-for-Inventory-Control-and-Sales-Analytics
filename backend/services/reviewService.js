const ProductReview = require("../models/ProductReview");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const recommendationService = require("./recommendationService");
const dashboardAnalyticsService = require("./dashboardAnalyticsService");

const recalculateProductRating = async (productId, session) => {
  const result = await ProductReview.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), isDeleted: false } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]).session(session);

  const avg = result.length > 0 ? parseFloat(result[0].averageRating.toFixed(2)) : 0;
  const count = result.length > 0 ? result[0].reviewCount : 0;

  await Product.updateOne(
    { _id: productId },
    { $set: { averageRating: avg, reviewCount: count } }
  ).session(session);
};

const getReviewsByProduct = async (productId) => {
  return ProductReview.find({ productId, isDeleted: false })
    .populate("customerId", "name avatar")
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * @desc Create review ensuring verified purchase check and recalculating rating aggregates
 */
const createReview = async (customerId, reviewData) => {
  const { productId, rating, title, review, images = [] } = reviewData;

  const product = await Product.findOne({ _id: productId, deletedAt: null });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const completedOrder = await Order.findOne({
    customerId,
    "items.productId": productId,
    orderStatus: "delivered",
  });
  if (!completedOrder) {
    throw new ApiError(400, "Only customers who purchased this product may submit a review.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingActive = await ProductReview.findOne({
      customerId,
      productId,
      isDeleted: false,
    }).session(session);
    if (existingActive) {
      throw new ApiError(400, "You have already reviewed this product. You can update your existing review instead.");
    }

    const newReview = new ProductReview({
      customerId,
      vendorId: product.vendorId,
      productId,
      orderId: completedOrder._id,
      rating,
      title,
      review,
      images,
      isVerifiedPurchase: true,
    });

    await newReview.save({ session });
    await recalculateProductRating(productId, session);

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    dashboardAnalyticsService.invalidateDashboardCache();

    return newReview;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * @desc Update review rating or feedback text
 */
const updateReview = async (reviewId, customerId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rev = await ProductReview.findById(reviewId).session(session);
    if (!rev || rev.isDeleted) {
      throw new ApiError(404, "Review not found");
    }

    if (rev.customerId.toString() !== customerId.toString()) {
      throw new ApiError(403, "You do not own this review");
    }

    const { rating, title, review, images } = updateData;
    rev.rating = rating;
    rev.title = title;
    rev.review = review;
    if (images) rev.images = images;
    rev.isEdited = true;
    rev.editedAt = new Date();

    await rev.save({ session });
    await recalculateProductRating(rev.productId, session);

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    dashboardAnalyticsService.invalidateDashboardCache();

    return rev;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * @desc Soft-delete product review mapping
 */
const deleteReview = async (reviewId, userId, role) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rev = await ProductReview.findById(reviewId).session(session);
    if (!rev || rev.isDeleted) {
      throw new ApiError(404, "Review not found");
    }

    if (role !== "admin" && rev.customerId.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to delete this review");
    }

    rev.isDeleted = true;
    await rev.save({ session });
    await recalculateProductRating(rev.productId, session);

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    dashboardAnalyticsService.invalidateDashboardCache();

    return rev;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * @desc Restore soft-deleted product review mapping
 */
const restoreReview = async (reviewId, userId, role) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rev = await ProductReview.findById(reviewId).session(session);
    if (!rev || !rev.isDeleted) {
      throw new ApiError(404, "Deleted review not found");
    }

    if (role !== "admin" && rev.customerId.toString() !== userId.toString()) {
      throw new ApiError(403, "You are not authorized to restore this review");
    }

    const activeExists = await ProductReview.findOne({
      customerId: rev.customerId,
      productId: rev.productId,
      isDeleted: false,
    }).session(session);
    if (activeExists) {
      throw new ApiError(400, "Cannot restore: another active review already exists for this product.");
    }

    rev.isDeleted = false;
    await rev.save({ session });
    await recalculateProductRating(rev.productId, session);

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    dashboardAnalyticsService.invalidateDashboardCache();

    return rev;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = {
  getReviewsByProduct,
  createReview,
  updateReview,
  deleteReview,
  restoreReview,
  recalculateProductRating,
};
