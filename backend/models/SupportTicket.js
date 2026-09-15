const mongoose = require("mongoose");

const ticketMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  attachments: [
    {
      type: String,
    },
  ],
});

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["Billing", "Return", "Shipping", "Other"],
      required: true,
      default: "Other",
    },
    ticketType: {
      type: String,
      enum: ["Question", "Issue", "Claim"],
      required: true,
      default: "Question",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Open", "Assigned", "In Progress", "Waiting Customer", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolution: {
      type: String,
    },
    internalNotes: {
      type: String, // Admin only notes
    },
    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    customerSatisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    messages: [ticketMessageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
