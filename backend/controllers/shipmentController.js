const shipmentService = require("../services/shipmentService");
const Shipment = require("../models/Shipment");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get shipments list matching user role scope
 */
const getShipments = async (req, res, next) => {
  try {
    const list = await shipmentService.getShipments(req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, list, "Shipments retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update status of shipment, updating corresponding Order status
 */
const updateShipmentStatus = async (req, res, next) => {
  try {
    const { status, location, notes } = req.body;
    if (!status) {
      throw new ApiError(400, "Shipment status is required");
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      throw new ApiError(404, "Shipment not found");
    }

    if (req.user.role === "vendor" && shipment.vendorId.toString() !== req.user._id.toString()) {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      if (!vendorProfile || shipment.vendorId.toString() !== vendorProfile._id.toString()) {
        throw new ApiError(403, "You can only update status for your own store shipments");
      }
    }

    const updated = await shipmentService.updateShipmentStatus(req.params.id, req.user._id, status, location, notes);
    res.status(200).json(new ApiResponse(200, updated, "Shipment status updated successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShipments,
  updateShipmentStatus,
};
