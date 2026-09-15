const SupportTicket = require("../models/SupportTicket");
const Order = require("../models/Order");
const User = require("../models/User");
const Notification = require("../models/Notification");
const SystemAudit = require("../models/SystemAudit");
const ApiError = require("../utils/ApiError");

/**
 * @desc Submit a support ticket, auto assigning to admins if vendor is unavailable
 */
const createTicket = async (customerId, ticketData) => {
  const { orderId, category, priority, subject, description, attachments = [] } = ticketData;

  const ticketNumber = `TCK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  let vendorId = customerId; // fallback
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      vendorId = order.vendorId;
    }
  }

  // Find active admin users for auto assignment fallback
  const adminUser = await User.findOne({ role: "admin" });
  const defaultAssignee = adminUser ? adminUser._id : null;

  const ticket = new SupportTicket({
    ticketNumber,
    orderId,
    customerId,
    vendorId,
    category,
    priority,
    subject,
    description,
    attachments,
    status: "Open",
    assignedTo: defaultAssignee,
  });

  await ticket.save();

  await Notification.create({
    userId: customerId,
    title: "Support Ticket Raised",
    message: `Your ticket ${ticketNumber} has been received and opened.`,
    type: "system",
  });

  await SystemAudit.create({
    userId: customerId,
    action: "SUPPORT_TICKET_CREATED",
    details: `Ticket ${ticketNumber} created for category ${category}`,
    timestamp: new Date(),
  });

  return ticket;
};

/**
 * @desc Assign a ticket to a staff member
 */
const assignTicket = async (ticketId, assigneeId) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  ticket.assignedTo = assigneeId;
  ticket.status = "Assigned";
  await ticket.save();

  await Notification.create({
    userId: ticket.customerId,
    title: "Support Ticket Assigned",
    message: `Your ticket ${ticket.ticketNumber} is now assigned and in progress.`,
    type: "system",
  });

  return ticket;
};

/**
 * @desc Post a message reply in support thread, tracking SLA first response metrics
 */
const addReply = async (ticketId, senderId, message, attachments = []) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const sender = await User.findById(senderId);
  if (!sender) {
    throw new ApiError(404, "Sender not found");
  }

  ticket.messages.push({
    senderId,
    message,
    sentAt: new Date(),
    attachments,
  });

  // Track first response SLA metrics when vendor/admin replies to customer
  if (sender.role !== "customer" && !ticket.firstResponseAt) {
    ticket.firstResponseAt = new Date();
  }

  // Update Status
  if (sender.role === "customer") {
    ticket.status = "Open";
  } else {
    ticket.status = "Waiting Customer";
  }

  await ticket.save();

  // Notify recipient
  const recipientId = sender.role === "customer" ? ticket.assignedTo || ticket.vendorId : ticket.customerId;
  if (recipientId) {
    await Notification.create({
      userId: recipientId,
      title: "New Ticket Reply",
      message: `A new message was added to ticket ${ticket.ticketNumber}.`,
      type: "system",
    });
  }

  return ticket;
};

/**
 * @desc Mark support ticket as closed, logging resolution SLA parameters
 */
const closeTicket = async (ticketId, resolverId, resolution = "") => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  ticket.status = "Closed";
  ticket.resolution = resolution;
  ticket.closedAt = new Date();
  ticket.resolvedAt = new Date();
  await ticket.save();

  await Notification.create({
    userId: ticket.customerId,
    title: "Support Ticket Closed",
    message: `Your ticket ${ticket.ticketNumber} has been resolved and closed.`,
    type: "system",
  });

  await SystemAudit.create({
    userId: resolverId,
    action: "SUPPORT_TICKET_CLOSED",
    details: `Ticket ${ticket.ticketNumber} closed by user ${resolverId}`,
    timestamp: new Date(),
  });

  return ticket;
};

const getTickets = async (userId, role) => {
  if (role === "admin") {
    return SupportTicket.find().populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else if (role === "vendor") {
    return SupportTicket.find({ vendorId: userId }).populate("customerId", "name email").sort({ createdAt: -1 }).lean();
  } else {
    return SupportTicket.find({ customerId: userId }).sort({ createdAt: -1 }).lean();
  }
};

module.exports = {
  createTicket,
  assignTicket,
  addReply,
  closeTicket,
  getTickets,
};
