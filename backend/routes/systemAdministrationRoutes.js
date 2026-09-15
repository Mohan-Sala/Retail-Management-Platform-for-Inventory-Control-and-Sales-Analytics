const express = require("express");
const router = express.Router();
const systemAdministrationController = require("../controllers/systemAdministrationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.get("/dashboard", systemAdministrationController.getDashboard);
router.get("/configuration", systemAdministrationController.getConfiguration);
router.put("/configuration", systemAdministrationController.updateConfiguration);
router.get("/audit", systemAdministrationController.getAuditLogs);
router.get("/audit/:id", systemAdministrationController.getAuditLogById);
router.get("/api-usage", systemAdministrationController.getApiUsageMetrics);
router.get("/background-jobs", systemAdministrationController.getBackgroundJobs);
router.put("/background-jobs/:job/pause", systemAdministrationController.pauseBackgroundJob);
router.put("/background-jobs/:job/resume", systemAdministrationController.resumeBackgroundJob);
router.post("/cleanup", systemAdministrationController.runCleanup);
router.get("/statistics", systemAdministrationController.getStatistics);
router.get("/health", systemAdministrationController.getHealthStatus);

module.exports = router;
