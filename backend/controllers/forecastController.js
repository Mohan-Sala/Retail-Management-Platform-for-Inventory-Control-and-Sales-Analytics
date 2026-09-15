const forecastingService = require("../services/forecastingService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Vendor = require("../models/Vendor");

/**
 * @desc Get dynamic inventory forecasting analytics
 * @route GET /api/forecast
 */
const getForecast = async (req, res, next) => {
  try {
    const queryOptions = { ...req.query };

    // Scoping for Vendor role
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        throw new ApiError(404, "Vendor profile not found for this user");
      }
      queryOptions.vendorId = vendor._id.toString();
      delete queryOptions.vendor; // ignore client vendor filters
    } else if (queryOptions.vendor) {
      queryOptions.vendorId = queryOptions.vendor;
    }

    const result = await forecastingService.getForecastData(queryOptions);
    res.status(200).json(new ApiResponse(200, result, "Forecasting analytics compiled successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getForecast,
};
