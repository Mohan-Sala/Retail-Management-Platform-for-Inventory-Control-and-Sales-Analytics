const customerAnalyticsService = require("../services/customerAnalyticsService");
const Vendor = require("../models/Vendor");

const getCustomerAnalytics = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userEmail = req.user.email;
    let vendorId = null;

    if (userRole === "vendor") {
      // Find vendor corresponding to the user email
      const vendor = await Vendor.findOne({ email: userEmail });
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found for this authenticated user",
        });
      }
      vendorId = vendor._id.toString();
    } else {
      // Admin can specify a vendor via query params if they wish
      if (req.query.vendorId) {
        vendorId = req.query.vendorId;
      }
    }

    const {
      startDate,
      endDate,
      category = "all",
      city = "all",
      search = "",
      page = 1,
      limit = 10,
      sortBy = "revenue",
      sortOrder = "desc",
    } = req.query;

    const analytics = await customerAnalyticsService.getCustomerAnalytics({
      vendorId,
      startDate,
      endDate,
      category,
      city,
      search,
    });

    // Pagination and sorting for topCustomers block
    let topCustomers = [...(analytics.topCustomers || [])];
    const sOrder = sortOrder === "asc" ? 1 : -1;

    topCustomers.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        return valA.localeCompare(valB) * sOrder;
      }
      if (valA instanceof Date) {
        return (+valA - +valB) * sOrder;
      }
      return ((valA || 0) - (valB || 0)) * sOrder;
    });

    const totalCount = topCustomers.length;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedTopCustomers = topCustomers.slice(startIdx, startIdx + limitNum);

    // Swap topCustomers list in payload to be sorted and paginated
    analytics.topCustomers = paginatedTopCustomers;
    
    // Add pagination headers
    analytics.pagination = {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(totalCount / limitNum) || 1,
      total: totalCount,
    };

    return res.status(200).json({
      success: true,
      message: "Customer analytics compiled successfully",
      data: analytics,
    });
  } catch (error) {
    console.error("Error generating customer analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while compiling customer analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerAnalytics,
};
