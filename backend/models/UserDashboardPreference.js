const mongoose = require("mongoose");

const userDashboardPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    widgetOrder: {
      type: [String],
      default: ["kpis", "revenue", "profit", "sales", "inventory", "forecast", "heatmap", "ai-insights"],
    },
    widgetVisibility: {
      type: Map,
      of: Boolean,
      default: {
        kpis: true,
        revenue: true,
        profit: true,
        sales: true,
        inventory: true,
        forecast: true,
        heatmap: true,
        "ai-insights": true,
      },
    },
    widgetSizes: {
      type: Map,
      of: String,
      default: {
        kpis: "col-span-4",
        revenue: "col-span-2",
        profit: "col-span-2",
        sales: "col-span-2",
        inventory: "col-span-2",
        forecast: "col-span-2",
        heatmap: "col-span-2",
        "ai-insights": "col-span-4",
      },
    },
    collapsedWidgets: {
      type: [String],
      default: [],
    },
    favoriteWidgets: {
      type: [String],
      default: [],
    },
    hiddenWidgets: {
      type: [String],
      default: [],
    },
    defaultDashboard: {
      type: String,
      default: "executive",
    },
    theme: {
      type: String,
      default: "system",
    },
    refreshInterval: {
      type: Number,
      default: 0,
    },
    lastViewedFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserDashboardPreference", userDashboardPreferenceSchema);
