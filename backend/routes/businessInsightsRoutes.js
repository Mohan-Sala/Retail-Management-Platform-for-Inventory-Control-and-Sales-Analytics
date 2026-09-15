const express = require("express");
const router = express.Router();
const businessInsightsController = require("../controllers/businessInsightsController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getInsights);
router.get("/summary", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getSummary);
router.get("/categories", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getCategories);
router.get("/trends", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getTrends);
router.get("/analytics", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getAnalytics);

router.post("/regenerate", authorize("admin", "manager", "vendor"), businessInsightsController.regenerateInsights);

router.get("/:id", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.getInsightById);
router.put("/:id/read", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.markAsRead);
router.put("/:id/archive", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.markAsArchived);
router.put("/:id/dismiss", authorize("admin", "manager", "vendor", "staff"), businessInsightsController.markAsDismissed);

module.exports = router;
