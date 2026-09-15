const Coupon = require("../models/Coupon");
const CustomerCouponUsage = require("../models/CustomerCouponUsage");
const Order = require("../models/Order");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * @desc Validate a coupon against a customer cart/items list
 */
const validateCoupon = async (code, customerId, cartItems, subtotal) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    return { isValid: false, reason: "Coupon is invalid or inactive" };
  }

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    return { isValid: false, reason: "Coupon has expired or is not yet active" };
  }

  const user = await User.findById(customerId);
  if (!user || !coupon.eligibleRoles.includes(user.role)) {
    return { isValid: false, reason: "Your account is not eligible for this coupon" };
  }

  // Check overall usage limit
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, reason: "Coupon usage limit has been reached" };
  }

  // Check usage per customer limit
  const customerUsageCount = await CustomerCouponUsage.countDocuments({ customerId, couponId: coupon._id });
  if (coupon.usagePerCustomer > 0 && customerUsageCount >= coupon.usagePerCustomer) {
    return { isValid: false, reason: "You have reached the maximum usage limit for this coupon" };
  }

  // First order only check
  if (coupon.firstOrderOnly) {
    const orderCount = await Order.countDocuments({ customerId, orderStatus: { $ne: "cancelled" } });
    if (orderCount > 0) {
      return { isValid: false, reason: "This coupon is only valid for your first order" };
    }
  }

  // Filter items based on vendor, category, product inclusions/exclusions
  let applicableSubtotal = 0;
  let totalQuantity = 0;

  for (const item of cartItems) {
    const prod = item.productId;
    if (!prod) continue;

    // Check Vendor restriction
    if (coupon.couponType === "VENDOR" && coupon.vendorId) {
      if (prod.vendorId?.toString() !== coupon.vendorId.toString() && prod.vendor?.toString() !== coupon.vendorId.toString()) {
        continue;
      }
    }

    // Check excluded products
    if (coupon.excludedProducts.some((id) => id.toString() === prod._id.toString())) {
      continue;
    }

    // Check excluded categories
    if (coupon.excludedCategories.some((cat) => cat.toLowerCase() === prod.category?.toLowerCase())) {
      continue;
    }

    // Check applicable products (if specified, item must be in list)
    if (coupon.applicableProducts.length > 0) {
      if (!coupon.applicableProducts.some((id) => id.toString() === prod._id.toString())) {
        continue;
      }
    }

    // Check applicable categories (if specified, item category must match)
    if (coupon.applicableCategories.length > 0) {
      if (!coupon.applicableCategories.some((cat) => cat.toLowerCase() === prod.category?.toLowerCase())) {
        continue;
      }
    }

    applicableSubtotal += (prod.price || item.priceAtAddition || 0) * item.quantity;
    totalQuantity += item.quantity;
  }

  if (applicableSubtotal === 0) {
    return { isValid: false, reason: "No items in your cart are eligible for this coupon" };
  }

  if (applicableSubtotal < coupon.minimumOrderAmount) {
    return {
      isValid: false,
      reason: `Eligible items subtotal must be at least ${coupon.minimumOrderAmount} to apply this coupon`,
    };
  }

  if (totalQuantity < coupon.minimumQuantity) {
    return {
      isValid: false,
      reason: `You must buy at least ${coupon.minimumQuantity} eligible items to apply this coupon`,
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = parseFloat(((applicableSubtotal * coupon.discountValue) / 100).toFixed(2));
    if (coupon.maximumDiscount > 0 && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  // Cap discount to applicable subtotal
  discountAmount = Math.min(discountAmount, applicableSubtotal);

  return {
    isValid: true,
    couponId: coupon._id,
    code: coupon.code,
    discountAmount,
    couponType: coupon.couponType,
  };
};

module.exports = {
  validateCoupon,
};
