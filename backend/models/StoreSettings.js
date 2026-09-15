const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "ShopSense Store",
    },
    storeLogo: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    gstNumber: String,
    currency: {
      type: String,
      default: "USD",
    },
    currencySymbol: {
      type: String,
      default: "$",
    },
    decimalPrecision: {
      type: Number,
      default: 2,
    },
    thousandsSeparator: {
      type: String,
      default: ",",
    },
    gstTaxPercentage: {
      type: Number,
      default: 18,
    },
    vatTaxPercentage: {
      type: Number,
      default: 5,
    },
    salesTaxPercentage: {
      type: Number,
      default: 8,
    },
    defaultTaxType: {
      type: String,
      default: "GST",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    dateFormat: {
      type: String,
      default: "YYYY-MM-DD",
    },
    language: {
      type: String,
      default: "en",
    },
    fiscalYearStart: {
      type: String,
      default: "04-01",
    },
    businessHours: {
      type: String,
      default: "09:00 - 18:00",
    },
    theme: {
      type: String,
      default: "system",
    },
    defaultDashboard: {
      type: String,
      default: "executive",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "System is undergoing scheduled maintenance.",
    },
    companyLogo: String,
    emailSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notificationDefaults: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    retentionDays: {
      type: Number,
      default: 90,
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

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
