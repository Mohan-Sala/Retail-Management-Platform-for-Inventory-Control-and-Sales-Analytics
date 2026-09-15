const inventoryService = require("../services/inventoryService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Vendor = require("../models/Vendor");

const getAuditTimestamp = () => new Date().toISOString().replace('T', ' ').split('.')[0];

/**
 * @desc Get all inventory records
 * @route GET /api/inventory
 */
const getInventory = async (req, res, next) => {
  try {
    const queryOptions = { ...req.query };

    // Role scoping for Vendors
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        throw new ApiError(404, "Vendor profile not found for this user");
      }
      // Force vendorId and override any client input
      queryOptions.vendorId = vendor._id.toString();
      delete queryOptions.vendor; // ignore vendor filters
    }

    const result = await inventoryService.getAllInventory(queryOptions);
    res.status(200).json(new ApiResponse(200, result, "Inventory records retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create inventory record (Admin only)
 * @route POST /api/inventory
 */
const createInventory = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Only Administrators can create inventory records");
    }

    const { productId, minimumStock, maximumStock } = req.body;

    const result = await inventoryService.createInventory({
      productId,
      minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : undefined,
      maximumStock: maximumStock !== undefined ? parseInt(maximumStock) : undefined,
    });

    // Audit Trail Log
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: CREATE\nInventory: ${result.id}`);

    res.status(201).json(new ApiResponse(201, result, "Inventory record created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update inventory record parameters (Admin only)
 * @route PUT /api/inventory/:id
 */
const updateInventory = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Only Administrators can modify inventory records");
    }

    const { minimumStock, maximumStock } = req.body;

    const result = await inventoryService.updateInventory(req.params.id, {
      minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : undefined,
      maximumStock: maximumStock !== undefined ? parseInt(maximumStock) : undefined,
    });

    // Audit Trail Log
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: UPDATE\nInventory: ${result.id}`);

    res.status(200).json(new ApiResponse(200, result, "Inventory record updated successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  createInventory,
  updateInventory,
};
