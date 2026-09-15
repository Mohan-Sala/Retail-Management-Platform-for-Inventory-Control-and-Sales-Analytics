const customerSegmentationService = require("../services/customerSegmentationService");
const CustomerSegment = require("../models/CustomerSegment");
const Vendor = require("../models/Vendor");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc Get customer segmentation history (Admin/Staff only)
 */
const getCustomerSegments = async (req, res, next) => {
  try {
    const list = await CustomerSegment.find().populate("customerId", "name email").sort({ calculatedAt: -1 }).lean();
    res.status(200).json(new ApiResponse(200, list, "Customer segmentations list retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get currently logged-in customer's segment
 */
const getMySegment = async (req, res, next) => {
  try {
    const doc = await customerSegmentationService.getCustomerSegment(req.user._id);
    res.status(200).json(new ApiResponse(200, doc, "Customer segment details retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Recalculate customer segment manually
 */
const recalculateSegment = async (req, res, next) => {
  try {
    const doc = await customerSegmentationService.calculateSegment(req.user._id);
    res.status(200).json(new ApiResponse(200, doc, "Customer segment recalculated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get customer segmentation lists, parameters, filters, and summary stats
 */
const getSegmentationData = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email;
    let vendorId = null;

    if (userRole === "vendor") {
      const vendor = await Vendor.findOne({ email: userEmail });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found for this authenticated user",
        });
      }
      vendorId = vendor._id.toString();
    } else {
      if (req.query.vendorId) {
        vendorId = req.query.vendorId;
      }
    }

    const {
      category = "all",
      city = "all",
      minSpending = null,
      maxSpending = null,
      search = "",
      sortBy = "spending",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const data = await customerSegmentationService.getSegmentationData({
      vendorId,
      category,
      city,
      minSpending,
      maxSpending,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Customer segmentation data compiled successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerSegments,
  getMySegment,
  recalculateSegment,
  getSegmentationData,
};
