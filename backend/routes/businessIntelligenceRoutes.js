const express = require("express");
const router = express.Router();
const businessIntelligenceController = require("../controllers/businessIntelligenceController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All business intelligence routes guarded by standard auth
router.use(protect, authorize("admin", "manager", "vendor", "staff"));

router.get("/", businessIntelligenceController.getUnifiedDashboard);
router.get("/drilldown", businessIntelligenceController.getDrilldown);
router.get("/preferences", businessIntelligenceController.getPreferences);
router.put("/preferences", businessIntelligenceController.updatePreferences);
router.get("/export", businessIntelligenceController.exportDashboard);

module.exports = router;
