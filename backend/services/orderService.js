const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Vendor = require("../models/Vendor");
const Cart = require("../models/Cart");
const CustomerClassification = require("../models/CustomerClassification");
const ApiError = require("../utils/ApiError");
const transactionService = require("./transactionService");
const customerClassificationService = require("./customerClassificationService");
const notificationService = require("./notificationService");
const businessInsightsService = require("./businessInsightsService");
const recommendationService = require("./recommendationService");
const dashboardAnalyticsService = require("./dashboardAnalyticsService");
const forecastingService = require("./forecastingService");
const businessIntelligenceService = require("./businessIntelligenceService");
const systemAdminService = require("./systemAdministrationService");

const generateOrderNumber = async (session) => {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await Order.countDocuments({
    createdAt: { $gte: start, $lte: end }
  }).session(session);

  const nextSeq = String(count + 1).padStart(6, "0");
  return `ORD-${todayStr}-${nextSeq}`;
};

/**
 * @desc Coordinates MongoDB transactions for checkouts, inventory stock locks, and notification alerts
 */
const checkout = async (customerId, checkoutData) => {
  const { idempotencyKey, shippingAddress, paymentMethod = "COD", couponCode, pointsToRedeem = 0 } = checkoutData;

  const existingOrders = await Order.find({ idempotencyKey }).lean();
  if (existingOrders.length > 0) {
    return { orders: existingOrders, duplicated: true };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(customerId).session(session);
    if (!user || (user.role !== "customer" && user.role !== "admin")) {
      throw new ApiError(403, "Only customers and admins can perform checkout");
    }

    const cart = await Cart.findOne({ customerId }).session(session);
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your shopping cart is empty");
    }

    let couponValidation = null;
    if (couponCode) {
      const populatedCartForCoupon = await Cart.findOne({ customerId })
        .populate("items.productId")
        .session(session);

      const couponService = require("./couponService");
      const cartSubtotalForCoupon = populatedCartForCoupon.items.reduce(
        (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
        0
      );

      couponValidation = await couponService.validateCoupon(
        couponCode,
        customerId,
        populatedCartForCoupon.items,
        cartSubtotalForCoupon
      );

      if (!couponValidation.isValid) {
        throw new ApiError(400, `Coupon validation failed: ${couponValidation.reason}`);
      }
    }

    let loyaltyPointsApplied = 0;
    if (pointsToRedeem > 0) {
      const loyaltyService = require("./loyaltyService");
      const loyaltyAcc = await loyaltyService.getOrCreateAccount(customerId);
      if (loyaltyAcc.availablePoints < pointsToRedeem) {
        throw new ApiError(400, "Insufficient loyalty points balance");
      }
      loyaltyPointsApplied = pointsToRedeem;
    }

    let customerDoc = await Customer.findOne({ email: user.email }).session(session);
    if (!customerDoc) {
      const adminUser = await User.findOne({ role: "admin" }).session(session);
      const adminId = adminUser ? adminUser._id : user._id;

      customerDoc = await Customer.create(
        [
          {
            name: user.name,
            email: user.email,
            phone: user.phone || "0000000000",
            city: (shippingAddress.city && shippingAddress.city !== "Default City" && shippingAddress.city !== "Update City") ? shippingAddress.city : ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"][Math.floor(Math.random() * 8)],
            address: shippingAddress.addressLine1 || "Default Address",
            createdBy: adminId,
          },
        ],
        { session }
      );
      customerDoc = customerDoc[0];
    }

    const itemsByVendor = {};
    let totalCartSubtotal = 0;
    for (const item of cart.items) {
      const vId = item.vendorId.toString();
      if (!itemsByVendor[vId]) {
        itemsByVendor[vId] = [];
      }
      itemsByVendor[vId].push(item);
      totalCartSubtotal += item.quantity * item.priceAtAddition;
    }
    if (totalCartSubtotal === 0) totalCartSubtotal = 1;

    const createdOrders = [];

    for (const vId of Object.keys(itemsByVendor)) {
      const vendorDoc = await Vendor.findById(vId).session(session);
      if (!vendorDoc) {
        throw new ApiError(400, "Vendor shop not found");
      }
      const vendorUser = await User.findOne({ email: vendorDoc.email }).session(session);

      const orderNumber = await generateOrderNumber(session);
      const orderItems = [];
      let subtotal = 0;

      for (const item of itemsByVendor[vId]) {
        const product = await Product.findById(item.productId).session(session);
        if (!product || product.status !== "active" || product.deletedAt) {
          throw new ApiError(400, `Product ${product?.name || "Selected Item"} is no longer available`);
        }

        if (product.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for product ${product.name}. Available: ${product.stock}`);
        }

        const result = await Product.updateOne(
          { _id: item.productId, __v: product.__v },
          { $inc: { __v: 1 } }
        ).session(session);

        if (result.modifiedCount === 0) {
          throw new ApiError(409, "Product inventory was updated concurrently. Please try checkout again.");
        }

        await transactionService.executeCheckoutTransaction(session, {
          customerId: customerDoc._id,
          vendorId: vendorDoc._id,
          productId: product._id,
          qty: item.quantity,
          paymentMethod: paymentMethod === "COD" ? "cod" : "upi",
          status: paymentMethod === "COD" ? "pending" : "paid",
        });

        const itemSubtotal = item.quantity * product.price;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price,
          subtotal: itemSubtotal,
          snapshot: {
            productName: product.name,
            productSKU: product.sku,
            vendorName: vendorDoc.businessName || "ShopSense Vendor",
            unitPrice: product.price,
            productImage: product.image,
          },
        });
      }

      const proportion = subtotal / totalCartSubtotal;
      
      let couponDiscount = 0;
      if (couponValidation) {
        // If GLOBAL or VENDOR matching the specific vendor of this split
        couponDiscount = Math.round(couponValidation.discountAmount * proportion);
      }

      let loyaltyDiscount = 0;
      if (loyaltyPointsApplied > 0) {
        loyaltyDiscount = Math.round(loyaltyPointsApplied * proportion);
      }

      const orderDiscount = couponDiscount + loyaltyDiscount;
      const finalSubtotal = Math.max(0, subtotal - orderDiscount);
      const tax = parseFloat((finalSubtotal * 0.05).toFixed(2));
      const totalAmount = finalSubtotal + tax;

      const order = new Order({
        customerId: user._id,
        vendorId: vendorUser._id,
        orderNumber,
        idempotencyKey,
        items: orderItems,
        subtotal,
        tax,
        discount: orderDiscount,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
        orderStatus: paymentMethod === "COD" ? "pending" : "completed",
        couponId: couponValidation ? couponValidation.couponId : undefined,
        couponCode: couponValidation ? couponValidation.code : undefined,
        discountBreakdown: {
          couponDiscount,
          loyaltyDiscount,
        },
        loyaltyPointsRedeemed: loyaltyDiscount,
        statusHistory: [
          {
            status: paymentMethod === "COD" ? "pending" : "completed",
            updatedAt: new Date(),
            updatedBy: user._id,
            notes: paymentMethod === "COD" ? "Order placed successfully by customer." : "Order payment processed and completed via UPI/Online.",
          },
        ],
        shippingAddress,
      });

      await order.save({ session });
      createdOrders.push(order);

      if (couponValidation && couponDiscount > 0) {
        const Coupon = require("../models/Coupon");
        const CustomerCouponUsage = require("../models/CustomerCouponUsage");
        await Coupon.updateOne({ _id: couponValidation.couponId }, { $inc: { usageCount: 1 } }).session(session);
        await CustomerCouponUsage.create(
          [{ couponId: couponValidation.couponId, customerId: user._id, orderId: order._id }],
          { session }
        );

        const SystemAudit = require("../models/SystemAudit");
        await SystemAudit.create(
          [{
            userId: user._id,
            action: "COUPON_APPLIED",
            details: `Coupon ${couponValidation.code} applied for order ${order.orderNumber}`,
            timestamp: new Date(),
          }],
          { session }
        );
      }

      if (loyaltyPointsApplied > 0 && loyaltyDiscount > 0) {
        const loyaltyService = require("./loyaltyService");
        await loyaltyService.redeemPoints(user._id, order._id, loyaltyDiscount, session);

        const SystemAudit = require("../models/SystemAudit");
        await SystemAudit.create(
          [{
            userId: user._id,
            action: "LOYALTY_POINTS_REDEEMED",
            details: `Redeemed ${loyaltyDiscount} loyalty points on order ${order.orderNumber}`,
            timestamp: new Date(),
          }],
          { session }
        );
      }

      await customerClassificationService.updateClassification(user._id, vendorUser._id, totalAmount, session);

      const invoiceService = require("./invoiceService");
      const shipmentService = require("./shipmentService");
      await invoiceService.generateInvoice(order._id, session);
      await shipmentService.createShipment(order._id, "ShopSense Logistics", "", "3-5 Business Days", session);
    }

    const totalOrderAmount = createdOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    user.customerProfile.totalOrders += createdOrders.length;
    user.customerProfile.totalSpent += totalOrderAmount;

    const classifications = await CustomerClassification.find({ customerId: user._id }).session(session);
    if (classifications.length > 0) {
      classifications.sort((a, b) => b.totalSpent - a.totalSpent);
      user.customerProfile.favoriteVendor = classifications[0].vendorId;
    }
    await user.save({ session });

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    for (const order of createdOrders) {
      await systemAdminService.logAudit({
        userId: user._id,
        userRole: "customer",
        action: "ORDER_PLACED",
        module: "orders",
        resourceType: "Order",
        resourceId: order._id,
        metadata: {
          orderNumber: order.orderNumber,
          vendorId: order.vendorId,
          totalAmount: order.totalAmount,
          timestamp: new Date()
        }
      });

      await notificationService.createNotification({
        title: "Order Confirmed",
        message: `Your order ${order.orderNumber} has been placed successfully.`,
        type: "order_status",
        category: "order",
        priority: "medium",
        roleVisibility: ["customer"],
        metadata: { orderId: order._id, orderNumber: order.orderNumber, customerId: user._id }
      }).catch(e => console.error("Notification failed:", e));

      await notificationService.createNotification({
        title: "New Order",
        message: `You have received a new order ${order.orderNumber}.`,
        type: "order_status",
        category: "order",
        priority: "high",
        roleVisibility: ["vendor"],
        metadata: { orderId: order._id, orderNumber: order.orderNumber, vendorId: order.vendorId }
      }).catch(e => console.error("Notification failed:", e));

      await notificationService.createNotification({
        title: "New Order Created",
        message: `Customer ${user.name} placed order ${order.orderNumber}.`,
        type: "order_status",
        category: "order",
        priority: "medium",
        roleVisibility: ["admin", "manager"],
        metadata: { orderId: order._id, orderNumber: order.orderNumber }
      }).catch(e => console.error("Notification failed:", e));
    }

    businessInsightsService.invalidateBusinessInsightsCache();
    dashboardAnalyticsService.invalidateDashboardCache();
    forecastingService.clearForecastCache();
    recommendationService.clearRecommendationCache();
    businessIntelligenceService.invalidateBusinessIntelligenceCache();

    return { orders: createdOrders, duplicated: false };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getOrders = async (userId, role) => {
  const filter = {};
  if (role === "customer") {
    filter.customerId = userId;
  } else if (role === "vendor") {
    filter.vendorId = userId;
  }
  return Order.find(filter).sort({ createdAt: -1 }).lean();
};

const getOrderById = async (id, userId, role) => {
  const order = await Order.findById(id).populate("customerId", "name email").lean();
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (role === "customer" && order.customerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized to view this order");
  }
  if (role === "vendor" && order.vendorId.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized to view this order");
  }
  return order;
};

const updateOrderStatus = async (orderId, updaterId, newStatus, notes = "") => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const oldStatus = order.orderStatus;
  order.orderStatus = newStatus;
  order.statusHistory.push({
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: updaterId,
    notes,
  });

  if (newStatus === "delivered" && oldStatus !== "delivered") {
    const loyaltyService = require("./loyaltyService");
    const pointsAwarded = Math.floor(order.totalAmount / 100);
    order.loyaltyPointsEarned = pointsAwarded;

    await loyaltyService.awardPoints(order.customerId, order._id, order.totalAmount);

    await notificationService.createNotification({
      title: "Loyalty Points Earned!",
      message: `You earned ${pointsAwarded} loyalty points on order ${order.orderNumber}.`,
      type: "loyalty",
      category: "general",
      priority: "medium",
      roleVisibility: ["customer"],
      metadata: { orderId: order._id, points: pointsAwarded }
    }).catch(e => console.error("Notification failed:", e));

    const SystemAudit = require("../models/SystemAudit");
    await SystemAudit.create({
      userId: order.customerId,
      action: "LOYALTY_POINTS_EARNED",
      details: `Earned ${pointsAwarded} loyalty points on order ${order.orderNumber}`,
      timestamp: new Date(),
    });
  }

  await order.save();

  dashboardAnalyticsService.invalidateDashboardCache();
  businessInsightsService.invalidateBusinessInsightsCache();
  recommendationService.clearRecommendationCache();

  await notificationService.createNotification({
    title: "Order Status Updated",
    message: `Your order ${order.orderNumber} is now ${newStatus}.`,
    type: "order_status",
    category: "order",
    priority: "medium",
    roleVisibility: ["customer"],
    metadata: { orderId: order._id, orderNumber: order.orderNumber, customerId: order.customerId }
  }).catch(e => console.error("Notification failed:", e));

  return order;
};

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
