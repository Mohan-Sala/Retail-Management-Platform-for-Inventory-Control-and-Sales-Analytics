const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Static subroutes (must be mapped first)
router.get("/trending", authorize("admin", "manager", "vendor", "staff"), recommendationController.getTrending);
router.get("/frequently-bought", authorize("admin", "manager", "vendor", "staff"), recommendationController.getFrequentlyBought);
router.post("/feedback", authorize("admin", "manager", "vendor", "staff"), recommendationController.postFeedback);
router.get("/analytics", authorize("admin", "manager", "vendor", "staff"), recommendationController.getAnalytics);
router.get("/explanations/:recommendationId", authorize("admin", "manager", "vendor", "staff"), recommendationController.getExplanations);

// Parameterized subroutes
router.get("/:customerId", authorize("admin", "vendor", "manager", "staff", "customer"), recommendationController.getRecommendations);

module.exports = router;
