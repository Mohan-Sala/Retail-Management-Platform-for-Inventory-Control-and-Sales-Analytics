const express = require("express");
const router = express.Router();
const customerAnalyticsController = require("../controllers/customerAnalyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "vendor"), customerAnalyticsController.getCustomerAnalytics);

module.exports = router;
