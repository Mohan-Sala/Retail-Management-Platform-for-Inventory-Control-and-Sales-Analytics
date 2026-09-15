const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

// @route GET /api/analytics
// Protected dashboard analytics API (scopes results automatically based on role)
router.get("/", protect, analyticsController.getAnalytics);

module.exports = router;
