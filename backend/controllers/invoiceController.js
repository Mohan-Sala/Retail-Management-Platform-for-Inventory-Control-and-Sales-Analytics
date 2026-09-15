const invoiceService = require("../services/invoiceService");
const Invoice = require("../models/Invoice");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get invoices list matching user role scope
 */
const getInvoices = async (req, res, next) => {
  try {
    const list = await invoiceService.getInvoices(req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, list, "Invoices retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get details of a single invoice by ID
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    if (req.user.role === "customer" && invoice.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to view this invoice");
    }
    if (req.user.role === "vendor" && invoice.vendorId.toString() !== req.user._id.toString()) {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      if (!vendorProfile || invoice.vendorId.toString() !== vendorProfile._id.toString()) {
        throw new ApiError(403, "Not authorized to view this invoice");
      }
    }

    res.status(200).json(new ApiResponse(200, invoice, "Invoice retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Return printable HTML layout format invoice for download
 */
const downloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    if (req.user.role === "customer" && invoice.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to access this invoice");
    }
    if (req.user.role === "vendor" && invoice.vendorId.toString() !== req.user._id.toString()) {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      if (!vendorProfile || invoice.vendorId.toString() !== vendorProfile._id.toString()) {
        throw new ApiError(403, "Not authorized to access this invoice");
      }
    }

    const html = invoiceService.getInvoiceHtml(invoice);
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  downloadInvoice,
};
