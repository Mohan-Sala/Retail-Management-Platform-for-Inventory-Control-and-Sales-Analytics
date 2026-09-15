const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const LoyaltyAccount = require("../models/LoyaltyAccount");
const Notification = require("../models/Notification");
const SystemAudit = require("../models/SystemAudit");
const loyaltyService = require("./loyaltyService");
const recommendationService = require("./recommendationService");
const dashboardAnalyticsService = require("./dashboardAnalyticsService");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

/**
 * @desc Create return request and log audit activity
 */
const createReturnRequest = async (customerId, returnData) => {
  const { orderId, reason, description, images = [], returnType = "Refund" } = returnData;

  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.orderStatus !== "delivered") {
    throw new ApiError(400, "Only delivered orders are eligible for return requests");
  }

  const deliveryStatus = order.statusHistory.find((h) => h.status === "delivered");
  const deliveryDate = deliveryStatus ? new Date(deliveryStatus.updatedAt) : new Date(order.updatedAt);
  const diffDays = Math.ceil((Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 7) {
    throw new ApiError(400, "The 7-day return eligibility period has expired for this order");
  }

  const existingRequest = await ReturnRequest.findOne({ orderId });
  if (existingRequest) {
    throw new ApiError(400, "A return request has already been submitted for this order");
  }

  const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const request = new ReturnRequest({
    returnNumber,
    orderId,
    customerId,
    vendorId: order.vendorId,
    returnReasonCategory: reason,
    returnType,
    description,
    images,
    status: "pending",
    refundAmount: order.totalAmount,
  });

  await request.save();

  await SystemAudit.create({
    userId: customerId,
    action: "RETURN_CREATED",
    details: `Return request ${returnNumber} submitted for order ${order.orderNumber}`,
    timestamp: new Date(),
  });

  await Notification.create({
    userId: customerId,
    title: "Return Request Submitted",
    message: `Your return request ${returnNumber} has been received and is pending review.`,
    type: "system",
  });

  recommendationService.clearRecommendationCache();
  return request;
};

/**
 * @desc Approve return request, calculate point reversals and restock if applicable
 */
const approveReturnRequest = async (requestId, resolverId, role) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await ReturnRequest.findById(requestId).session(session);
    if (!request) {
      throw new ApiError(404, "Return request not found");
    }

    if (request.status !== "pending") {
      throw new ApiError(400, `Return request is already ${request.status}`);
    }

    if (role === "vendor" && request.vendorId.toString() !== resolverId.toString()) {
      const Vendor = require("../models/Vendor");
      const vendorUser = await User.findById(resolverId).session(session);
      const vendorProfile = await Vendor.findOne({ email: vendorUser.email }).session(session);
      if (!vendorProfile || request.vendorId.toString() !== vendorProfile._id.toString()) {
        throw new ApiError(403, "You can only approve return requests for your own products");
      }
    }

    request.status = "approved";
    request.approvedAt = new Date();
    request.resolvedBy = resolverId;
    await request.save({ session });

    const order = await Order.findById(request.orderId).session(session);
    if (order) {
      order.orderStatus = "cancelled";
      await order.save({ session });

      if (request.inventoryRestock) {
        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { stock: item.quantity } }
          ).session(session);
        }
      }

      await loyaltyService.reversePoints(request.customerId, order._id, request.refundAmount, session);
    }

    await SystemAudit.create([{
      userId: resolverId,
      action: "RETURN_APPROVED",
      details: `Return request ${request.returnNumber} approved`,
      timestamp: new Date(),
    }], { session });

    await SystemAudit.create([{
      userId: resolverId,
      action: "REFUND_COMPLETED",
      details: `Refund of ${request.refundAmount} completed for return request ${request.returnNumber}`,
      timestamp: new Date(),
    }], { session });

    await Notification.create([{
      userId: request.customerId,
      title: "Return Request Approved",
      message: `Your return request ${request.returnNumber} was approved. Refund value ${request.refundAmount} has been processed.`,
      type: "alert",
    }], { session });

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    dashboardAnalyticsService.invalidateDashboardCache();

    return request;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * @desc Reject return request
 */
const rejectReturnRequest = async (requestId, resolverId, role) => {
  const request = await ReturnRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Return request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, `Return request is already ${request.status}`);
  }

  request.status = "rejected";
  request.rejectedAt = new Date();
  request.resolvedBy = resolverId;
  await request.save();

  await SystemAudit.create({
    userId: resolverId,
    action: "RETURN_REJECTED",
    details: `Return request ${request.returnNumber} rejected`,
    timestamp: new Date(),
  });

  await Notification.create({
    userId: request.customerId,
    title: "Return Request Rejected",
    message: `Your return request ${request.returnNumber} has been rejected.`,
    type: "system",
  });

  return request;
};

/**
 * @desc Complete return request
 */
const completeReturnRequest = async (requestId) => {
  const request = await ReturnRequest.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Return request not found");
  }

  request.status = "completed";
  request.completedAt = new Date();
  await request.save();

  return request;
};

/**
 * @desc List return requests based on user role
 */
const getReturnRequests = async (userId, role) => {
  if (role === "admin") {
    return ReturnRequest.find().populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else if (role === "vendor") {
    const Vendor = require("../models/Vendor");
    const vendorUser = await User.findById(userId);
    const vendorProfile = await Vendor.findOne({ email: vendorUser.email });
    const vendorId = vendorProfile ? vendorProfile._id : userId;
    return ReturnRequest.find({ vendorId }).populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else {
    return ReturnRequest.find({ customerId: userId }).sort({ createdAt: -1 }).lean();
  }
};

module.exports = {
  createReturnRequest,
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnRequest,
  getReturnRequests,
};
