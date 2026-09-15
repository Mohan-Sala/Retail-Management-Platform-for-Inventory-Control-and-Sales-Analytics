const analyticsService = require("../services/analyticsService");
const Vendor = require("../models/Vendor");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc Get analytics dashboard metrics
 * @route GET /api/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    let vendorId = null;

    // Route-level security: scope analytics to vendor if logged-in user is a vendor
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (vendor) {
        vendorId = vendor._id.toString();
      }
    } else {
      // Admin can request analytics for a specific vendor via query parameter
      vendorId = req.query.vendorId || null;
    }

    const data = await analyticsService.getAnalytics(vendorId);
    res.status(200).json(new ApiResponse(200, data, "Analytics retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
