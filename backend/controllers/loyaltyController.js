const loyaltyService = require("../services/loyaltyService");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get current user loyalty account summary details
 */
const getLoyaltyAccount = async (req, res, next) => {
  try {
    const account = await loyaltyService.getOrCreateAccount(req.user._id);
    res.status(200).json(new ApiResponse(200, account, "Loyalty account retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current customer points history log list
 */
const getLoyaltyHistory = async (req, res, next) => {
  try {
    const history = await LoyaltyTransaction.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(new ApiResponse(200, history, "Loyalty transaction history retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Explicit points redemption endpoint
 */
const redeemPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    if (!points || points <= 0) {
      throw new ApiError(400, "Points value must be greater than zero");
    }

    const account = await loyaltyService.redeemPoints(req.user._id, null, points);
    res.status(200).json(new ApiResponse(200, account, "Loyalty points redeemed successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoyaltyAccount,
  getLoyaltyHistory,
  redeemPoints,
};
