const supportService = require("../services/supportService");
const SupportTicket = require("../models/SupportTicket");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Create support ticket
 */
const createTicket = async (req, res, next) => {
  try {
    const ticket = await supportService.createTicket(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, ticket, "Support ticket submitted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List support tickets based on user role permission limits
 */
const getTickets = async (req, res, next) => {
  try {
    const list = await supportService.getTickets(req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, list, "Support tickets retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Add a message reply in the support chat thread
 */
const addReply = async (req, res, next) => {
  try {
    const { message, attachments = [] } = req.body;
    if (!message) {
      throw new ApiError(400, "Message content is required");
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (req.user.role === "customer" && ticket.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to reply to this ticket");
    }
    if (req.user.role === "vendor" && ticket.vendorId.toString() !== req.user._id.toString()) {
      const Vendor = require("../models/Vendor");
      const vendorProfile = await Vendor.findOne({ email: req.user.email });
      if (!vendorProfile || ticket.vendorId.toString() !== vendorProfile._id.toString()) {
        throw new ApiError(403, "Not authorized to reply to this ticket");
      }
    }

    const updated = await supportService.addReply(req.params.id, req.user._id, message, attachments);
    res.status(200).json(new ApiResponse(200, updated, "Message reply added successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Assign a ticket to a support staff member
 */
const assignTicket = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    if (!assigneeId) {
      throw new ApiError(400, "Assignee ID is required");
    }

    const updated = await supportService.assignTicket(req.params.id, assigneeId);
    res.status(200).json(new ApiResponse(200, updated, "Ticket assigned successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Close a support ticket with a final resolution note
 */
const closeTicket = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const updated = await supportService.closeTicket(req.params.id, req.user._id, resolution);
    res.status(200).json(new ApiResponse(200, updated, "Ticket closed successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getTickets,
  addReply,
  assignTicket,
  closeTicket,
};
