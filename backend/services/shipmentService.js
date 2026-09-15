const Shipment = require("../models/Shipment");
const Order = require("../models/Order");
const User = require("../models/User");
const Notification = require("../models/Notification");
const SystemAudit = require("../models/SystemAudit");
const dashboardAnalyticsService = require("./dashboardAnalyticsService");
const businessInsightsService = require("./businessInsightsService");
const recommendationService = require("./recommendationService");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

/**
 * @desc Initialize shipment tracking logs for a newly placed order
 */
const createShipment = async (orderId, carrier = "ShopSense Logistics", trackingNumber = "", estimatedDeliveryWindow = "3-5 Business Days", session = null) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const shipmentNumber = `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const resolvedTracking = trackingNumber || `TRK${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const estDelivery = new Date();
  estDelivery.setDate(estDelivery.getDate() + 4);

  const shipment = new Shipment({
    shipmentNumber,
    orderId,
    vendorId: order.vendorId,
    customerId: order.customerId,
    carrier,
    trackingNumber: resolvedTracking,
    estimatedDelivery: estDelivery,
    estimatedDeliveryWindow,
    shipmentStatus: "Pending",
    statusHistory: [
      {
        status: "Pending",
        location: "Vendor Warehouse",
        notes: "Shipment details registered. Awaiting packing.",
        updatedBy: order.vendorId,
      },
    ],
  });

  await shipment.save({ session });
  return shipment;
};

/**
 * @desc Transition shipment logistics status, synchronizing order status and dispatching notification events
 */
const updateShipmentStatus = async (shipmentId, updaterId, newStatus, location = "", notes = "") => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shipment = await Shipment.findById(shipmentId).session(session);
    if (!shipment) {
      throw new ApiError(404, "Shipment record not found");
    }

    const updater = await User.findById(updaterId).session(session);
    if (!updater) {
      throw new ApiError(404, "Updater profile not found");
    }

    shipment.shipmentStatus = newStatus;
    shipment.currentLocation = location || shipment.currentLocation;
    shipment.statusHistory.push({
      status: newStatus,
      location,
      notes,
      updatedBy: updaterId,
      updatedAt: new Date(),
    });

    // Handle timestamps mapping
    if (newStatus === "Packed") {
      shipment.packedAt = new Date();
    } else if (newStatus === "Dispatched" || newStatus === "In Transit") {
      shipment.shippedAt = new Date();
    } else if (newStatus === "Out For Delivery") {
      shipment.outForDeliveryAt = new Date();
    } else if (newStatus === "Delivered") {
      shipment.deliveredAt = new Date();
      shipment.actualDelivery = new Date();
    } else if (newStatus === "Failed") {
      shipment.failedAt = new Date();
      shipment.deliveryAttempts += 1;
    } else if (newStatus === "Returned") {
      shipment.returnedAt = new Date();
    }

    await shipment.save({ session });

    // Sync Order Status
    const order = await Order.findById(shipment.orderId).session(session);
    if (order) {
      let mappedOrderStatus = "pending";
      if (newStatus === "Packed") mappedOrderStatus = "packed";
      else if (newStatus === "Dispatched" || newStatus === "In Transit" || newStatus === "Out For Delivery") mappedOrderStatus = "shipped";
      else if (newStatus === "Delivered") mappedOrderStatus = "delivered";
      else if (newStatus === "Returned") mappedOrderStatus = "cancelled";

      const orderService = require("./orderService");
      await orderService.updateOrderStatus(order._id, updaterId, mappedOrderStatus, `Shipment status transition to ${newStatus}. ${notes}`);
    }

    // Write Audit log
    await SystemAudit.create([{
      userId: updaterId,
      action: `SHIPMENT_${newStatus.toUpperCase()}`,
      details: `Shipment ${shipment.shipmentNumber} transitioned to ${newStatus}. Notes: ${notes}`,
      timestamp: new Date(),
    }], { session });

    // Send notifications
    await Notification.create([{
      userId: shipment.customerId,
      title: `Shipment ${newStatus}`,
      message: `Your package with tracking number ${shipment.trackingNumber} is now ${newStatus}.`,
      type: "order_status",
    }], { session });

    await session.commitTransaction();
    session.endSession();

    dashboardAnalyticsService.invalidateDashboardCache();
    businessInsightsService.invalidateBusinessInsightsCache();
    recommendationService.clearRecommendationCache();

    return shipment;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getShipments = async (userId, role) => {
  if (role === "admin") {
    return Shipment.find().populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else if (role === "vendor") {
    const Vendor = require("../models/Vendor");
    const vendorUser = await User.findById(userId);
    const vendorProfile = await Vendor.findOne({ email: vendorUser.email });
    const vendorId = vendorProfile ? vendorProfile._id : userId;
    return Shipment.find({ vendorId }).populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else {
    return Shipment.find({ customerId: userId }).sort({ createdAt: -1 }).lean();
  }
};

module.exports = {
  createShipment,
  updateShipmentStatus,
  getShipments,
};
