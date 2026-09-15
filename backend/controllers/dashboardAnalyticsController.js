const dashboardAnalyticsService = require("../services/dashboardAnalyticsService");
const Vendor = require("../models/Vendor");

const getDashboardAnalytics = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email;
    let vendorId = null;

    if (userRole === "vendor") {
      const vendor = await Vendor.findOne({ email: userEmail });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found for this authenticated user",
        });
      }
      vendorId = vendor._id.toString();
    } else {
      if (req.query.vendor) {
        vendorId = req.query.vendor;
      }
    }

    const {
      startDate = null,
      endDate = null,
      category = "all",
      city = "all",
      forecastDays = 30,
      historyDays = 30,
    } = req.query;

    const data = await dashboardAnalyticsService.getDashboardAnalytics({
      vendorId,
      startDate,
      endDate,
      category,
      city,
      forecastDays: parseInt(String(forecastDays)) || 30,
      historyDays: parseInt(String(historyDays)) || 30,
    });

    return res.status(200).json({
      success: true,
      message: "Centralized dashboard analytics compiled successfully",
      data,
    });
  } catch (error) {
    console.error("Error generating dashboard analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while compiling dashboard analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardAnalytics,
};
