const express = require("express");
const router = express.Router();
const dashboardAnalyticsController = require("../controllers/dashboardAnalyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "vendor"), dashboardAnalyticsController.getDashboardAnalytics);

module.exports = router;
