const AIRateLimit = require("../models/AIRateLimit");
const ApiError = require("../utils/ApiError");

/**
 * @desc Persistent sliding-window rate limiter middleware
 */
const aiRateLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    // Resolve request limits per role
    let limit = 30;
    if (role === "admin") limit = 100;
    else if (role === "vendor") limit = 50;
    else if (role === "manager") limit = 50;

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    let rateLimitDoc = await AIRateLimit.findOne({ userId });
    if (!rateLimitDoc) {
      rateLimitDoc = new AIRateLimit({ userId, timestamps: [] });
    }

    // Clean up timestamps older than 1 hour
    rateLimitDoc.timestamps = rateLimitDoc.timestamps.filter(
      (t) => new Date(t).getTime() > oneHourAgo
    );

    if (rateLimitDoc.timestamps.length >= limit) {
      const oldestTimestamp = new Date(rateLimitDoc.timestamps[0]).getTime();
      const retryAfterMs = oldestTimestamp + 60 * 60 * 1000 - now;
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      return next(
        new ApiError(
          429,
          `Too many AI requests. You have reached your limit of ${limit} requests per hour. Please retry after ${retryAfterSec} seconds.`
        )
      );
    }

    rateLimitDoc.timestamps.push(new Date(now));
    await rateLimitDoc.save();
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = aiRateLimit;
