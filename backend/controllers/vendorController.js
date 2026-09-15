const vendorService = require("../services/vendorService");
const ApiResponse = require("../utils/ApiResponse");
const dashboardAnalyticsService = require("../services/dashboardAnalyticsService");

/**
 * @desc Get all vendors
 * @route GET /api/vendors
 */
const getVendors = async (req, res, next) => {
  try {
    const { search, status, sortBy, order, page, limit } = req.query;
    const result = await vendorService.getAllVendors({ search, status, sortBy, order, page, limit });
    res.status(200).json(new ApiResponse(200, result, "Vendors retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single vendor by ID
 * @route GET /api/vendors/:id
 */
const getVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    res.status(200).json(new ApiResponse(200, vendor, "Vendor retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

const getAuditTimestamp = () => new Date().toISOString().replace('T', ' ').split('.')[0];

/**
 * @desc Create vendor
 * @route POST /api/vendors
 */
const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    dashboardAnalyticsService.invalidateDashboardCache();

    // Audit Logging
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: CREATE\nEntity: Vendor\nID: ${vendor.id}`);

    res.status(201).json(new ApiResponse(201, vendor, "Vendor created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update vendor
 * @route PUT /api/vendors/:id
 */
const updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);
    dashboardAnalyticsService.invalidateDashboardCache();
    res.status(200).json(new ApiResponse(200, vendor, "Vendor updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete vendor
 * @route DELETE /api/vendors/:id
 */
const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.deleteVendor(req.params.id);
    dashboardAnalyticsService.invalidateDashboardCache();
    res.status(200).json(new ApiResponse(200, vendor, "Vendor deleted successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
};
