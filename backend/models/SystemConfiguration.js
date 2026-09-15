const mongoose = require("mongoose");

const systemConfigurationSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "System is undergoing scheduled maintenance. Please try again later.",
    },
    cacheTTL: {
      type: Number,
      default: 300,
    },
    reportRetentionDays: {
      type: Number,
      default: 30,
    },
    notificationRetentionDays: {
      type: Number,
      default: 14,
    },
    auditRetentionDays: {
      type: Number,
      default: 90,
    },
    aiHistoryRetentionDays: {
      type: Number,
      default: 7,
    },
    maxUploadSize: {
      type: Number,
      default: 5242880,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    allowVendorRegistration: {
      type: Boolean,
      default: true,
    },
    allowReportGeneration: {
      type: Boolean,
      default: true,
    },
    allowAI: {
      type: Boolean,
      default: true,
    },
    allowNotifications: {
      type: Boolean,
      default: true,
    },
    allowBackgroundJobs: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SystemConfiguration", systemConfigurationSchema);
