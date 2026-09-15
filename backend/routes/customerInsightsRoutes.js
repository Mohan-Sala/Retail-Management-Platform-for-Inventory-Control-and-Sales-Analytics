const express = require("express");
const router = express.Router();
const customerInsightsController = require("../controllers/customerInsightsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("customer"));

router.get("/", customerInsightsController.getInsights);
router.get("/summary", customerInsightsController.getSummary);
router.get("/history", customerInsightsController.getHistory);

module.exports = router;
