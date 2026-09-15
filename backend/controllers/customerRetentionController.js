const customerRetentionService = require("../services/customerRetentionService");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc Get customer retention metrics calculations
 */
const getRetentionMetrics = async (req, res, next) => {
  try {
    const metrics = await customerRetentionService.calculateRetentionMetrics(req.user._id);
    res.status(200).json(new ApiResponse(200, metrics, "Customer retention metrics retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRetentionMetrics,
};
