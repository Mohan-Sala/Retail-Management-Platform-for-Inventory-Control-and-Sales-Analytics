const businessIntelligenceService = require("../services/businessIntelligenceService");
const UserDashboardPreference = require("../models/UserDashboardPreference");
const Vendor = require("../models/Vendor");
const reportQueue = require("../services/reportQueue");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get Unified BI Dashboard payload (KPIs, charts, heatmaps, and scores)
 * @route GET /api/business-intelligence
 */
const getUnifiedDashboard = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      vendor: req.query.vendor,
      dateStart: req.query.dateStart,
      dateEnd: req.query.dateEnd,
      product: req.query.product,
      city: req.query.city,
      customerSegment: req.query.customerSegment,
    };

    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) filters.vendor = v._id.toString();
    }

    const payload = await businessIntelligenceService.getUnifiedPayload(req.user, filters);

    res.status(200).json({
      success: true,
      message: "Unified BI Dashboard data compiled",
      data: payload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Retrieve granular subcategory lists
 * @route GET /api/business-intelligence/drilldown
 */
const getDrilldown = async (req, res, next) => {
  try {
    const { field, value, level } = req.query;
    if (!field) throw new ApiError(400, "Field parameter is required for drilldown operations");

    const filters = {
      category: req.query.category,
      vendor: req.query.vendor,
    };

    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) filters.vendor = v._id.toString();
    }

    const data = await businessIntelligenceService.resolveDrilldown(req.user, field, value, level, filters);

    res.status(200).json({
      success: true,
      message: "Drilldown details resolved",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch widget layout preferences
 * @route GET /api/business-intelligence/preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    let pref = await UserDashboardPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = await UserDashboardPreference.create({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      message: "User dashboard settings retrieved",
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update layout customizations settings
 * @route PUT /api/business-intelligence/preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { widgetOrder, widgetVisibility, widgetSizes, collapsedWidgets, favoriteWidgets, hiddenWidgets, theme, refreshInterval, lastViewedFilters } = req.body;

    const pref = await UserDashboardPreference.findOneAndUpdate(
      { userId: req.user._id },
      { widgetOrder, widgetVisibility, widgetSizes, collapsedWidgets, favoriteWidgets, hiddenWidgets, theme, refreshInterval, lastViewedFilters, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "User dashboard settings updated",
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Export dashboard current states (Triggers reports generator job)
 * @route GET /api/business-intelligence/export
 */
const exportDashboard = async (req, res, next) => {
  try {
    const { format = "pdf", type = "sales" } = req.query;

    const filters = {
      category: req.query.category,
      vendor: req.query.vendor,
    };

    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) filters.vendor = v._id.toString();
    }

    const job = await reportQueue.addJobToQueue({
      title: `BI Export - ${type.toUpperCase()} (${format.toUpperCase()})`,
      type,
      format,
      filters,
      creatorId: req.user._id,
      version: 1,
    });

    res.status(200).json({
      success: true,
      message: "Export compiled job dispatched",
      data: { jobId: job._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnifiedDashboard,
  getDrilldown,
  getPreferences,
  updatePreferences,
  exportDashboard,
};
