const Coupon = require("../models/Coupon");
const couponService = require("../services/couponService");
const Cart = require("../models/Cart");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Retrieve active coupons list
 */
const getCoupons = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "vendor") {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      const vendorId = vendorProfile ? vendorProfile._id : req.user._id;
      filter.$or = [{ vendorId }, { couponType: "GLOBAL" }];
    } else if (req.user.role === "customer") {
      filter.isActive = true;
      filter.eligibleRoles = req.user.role;
    }
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json(new ApiResponse(200, coupons, "Coupons retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin or Vendor creates a coupon
 */
const createCoupon = async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "vendor") {
      throw new ApiError(403, "Not authorized to create coupons");
    }

    const data = { ...req.body };
    if (req.user.role === "vendor") {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      data.couponType = "VENDOR";
      data.vendorId = vendorProfile ? vendorProfile._id : req.user._id;
    }

    const coupon = new Coupon(data);
    await coupon.save();

    res.status(201).json(new ApiResponse(201, coupon, "Coupon created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Validates the given coupon code against the current user's active cart items
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new ApiError(400, "Coupon code is required");
    }

    const cart = await Cart.findOne({ customerId: req.user._id }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    const subtotal = cart.items.reduce((sum, item) => sum + (item.productId?.price || item.priceAtAddition || 0) * item.quantity, 0);

    const validation = await couponService.validateCoupon(code, req.user._id, cart.items, subtotal);
    if (!validation.isValid) {
      throw new ApiError(400, validation.reason);
    }

    res.status(200).json(new ApiResponse(200, validation, "Coupon is valid"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  validateCoupon,
};
