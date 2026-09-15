const LoyaltyAccount = require("../models/LoyaltyAccount");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const StoreSettings = require("../models/StoreSettings");
const Notification = require("../models/Notification");
const recommendationService = require("./recommendationService");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

const getOrCreateAccount = async (customerId) => {
  let acc = await LoyaltyAccount.findOne({ customerId });
  if (!acc) {
    acc = await LoyaltyAccount.create({
      customerId,
      totalPoints: 0,
      availablePoints: 0,
      redeemedPoints: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      totalOrders: 0,
      currentTier: "Bronze",
      nextTier: "Silver",
      progressPercentage: 0,
    });
  }
  return acc;
};

/**
 * @desc Get configuration thresholds from StoreSettings
 */
const getTiersConfig = async () => {
  const settings = await StoreSettings.findOne();
  return settings?.loyaltyTiers || { Silver: 100, Gold: 500 };
};

const calculateProgress = (points, currentTier, thresholds) => {
  if (points >= thresholds.Gold) {
    return { currentTier: "Gold", nextTier: "Maxed", progressPercentage: 100 };
  } else if (points >= thresholds.Silver) {
    const range = thresholds.Gold - thresholds.Silver;
    const progress = Math.min(99, Math.round(((points - thresholds.Silver) / range) * 100));
    return { currentTier: "Silver", nextTier: "Gold", progressPercentage: progress };
  } else {
    const progress = Math.min(99, Math.round((points / thresholds.Silver) * 100));
    return { currentTier: "Bronze", nextTier: "Silver", progressPercentage: progress };
  }
};

/**
 * @desc Award points upon order delivery status
 */
const awardPoints = async (customerId, orderId, orderAmount, session = null) => {
  const acc = await LoyaltyAccount.findOne({ customerId }).session(session);
  const targetAcc = acc || new LoyaltyAccount({ customerId });

  const pointsToAward = Math.floor(orderAmount / 100);
  if (pointsToAward <= 0) return targetAcc;

  const thresholds = await getTiersConfig();
  const balanceBefore = targetAcc.availablePoints;
  const balanceAfter = balanceBefore + pointsToAward;

  const oldTier = targetAcc.currentTier;

  targetAcc.totalPoints += pointsToAward;
  targetAcc.availablePoints = balanceAfter;
  targetAcc.lifetimeEarned += pointsToAward;
  targetAcc.totalOrders += 1;
  targetAcc.lastUpdated = new Date();

  const progress = calculateProgress(targetAcc.lifetimeEarned, oldTier, thresholds);
  targetAcc.currentTier = progress.currentTier;
  targetAcc.nextTier = progress.nextTier;
  targetAcc.progressPercentage = progress.progressPercentage;

  await targetAcc.save({ session });

  const tx = new LoyaltyTransaction({
    customerId,
    orderId,
    points: pointsToAward,
    balanceBefore,
    balanceAfter,
    type: "earned",
    referenceType: "ORDER",
    reason: `Points earned on order checkout total ${orderAmount}`,
    createdBy: customerId,
  });
  await tx.save({ session });

  // Trigger tier upgrade notification if applicable
  if (targetAcc.currentTier !== oldTier) {
    await Notification.create([{
      userId: customerId,
      title: "Loyalty Tier Upgraded!",
      message: `Congratulations! You have been upgraded to the ${targetAcc.currentTier} membership tier!`,
      type: "alert",
    }], { session });
  }

  recommendationService.clearRecommendationCache();
  return targetAcc;
};

/**
 * @desc Deduct points on order checkout redemption
 */
const redeemPoints = async (customerId, orderId, pointsToRedeem, session = null) => {
  const acc = await getOrCreateAccount(customerId);
  if (acc.availablePoints < pointsToRedeem) {
    throw new ApiError(400, "Insufficient loyalty points balance");
  }

  const balanceBefore = acc.availablePoints;
  const balanceAfter = balanceBefore - pointsToRedeem;

  acc.availablePoints = balanceAfter;
  acc.redeemedPoints += pointsToRedeem;
  acc.lastUpdated = new Date();
  await acc.save({ session });

  const tx = new LoyaltyTransaction({
    customerId,
    orderId,
    points: pointsToRedeem,
    balanceBefore,
    balanceAfter,
    type: "redeemed",
    referenceType: "ORDER",
    reason: `Points redeemed on order checkout discount`,
    createdBy: customerId,
  });
  await tx.save({ session });

  recommendationService.clearRecommendationCache();
  return acc;
};

/**
 * @desc Reverse points on return/refund request approval
 */
const reversePoints = async (customerId, orderId, refundedAmount, session = null) => {
  const acc = await LoyaltyAccount.findOne({ customerId }).session(session);
  if (!acc) return null;

  const pointsToReverse = Math.floor(refundedAmount / 100);
  if (pointsToReverse <= 0) return acc;

  const balanceBefore = acc.availablePoints;
  const balanceAfter = Math.max(0, balanceBefore - pointsToReverse);

  const oldTier = acc.currentTier;
  const thresholds = await getTiersConfig();

  acc.totalPoints = Math.max(0, acc.totalPoints - pointsToReverse);
  acc.availablePoints = balanceAfter;
  acc.lifetimeEarned = Math.max(0, acc.lifetimeEarned - pointsToReverse);
  acc.lastUpdated = new Date();

  const progress = calculateProgress(acc.lifetimeEarned, oldTier, thresholds);
  acc.currentTier = progress.currentTier;
  acc.nextTier = progress.nextTier;
  acc.progressPercentage = progress.progressPercentage;

  await acc.save({ session });

  const tx = new LoyaltyTransaction({
    customerId,
    orderId,
    points: pointsToReverse,
    balanceBefore,
    balanceAfter,
    type: "refunded",
    referenceType: "RETURN",
    reason: `Points reversed on return refund request total ${refundedAmount}`,
    createdBy: customerId,
  });
  await tx.save({ session });

  recommendationService.clearRecommendationCache();
  return acc;
};

module.exports = {
  getOrCreateAccount,
  awardPoints,
  redeemPoints,
  reversePoints,
  getTiersConfig,
};
