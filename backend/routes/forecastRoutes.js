const express = require("express");
const router = express.Router();
const forecastController = require("../controllers/forecastController");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET /api/forecast - retrieve dynamic inventory forecasts (accessible to Admins and Vendors)
router.get("/", protect, authorize("admin", "vendor"), forecastController.getForecast);

module.exports = router;
