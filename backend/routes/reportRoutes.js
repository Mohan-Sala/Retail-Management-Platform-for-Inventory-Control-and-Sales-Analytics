const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Shared link public gateway (does not require dashboard login auth)
router.get("/shared/:token", reportController.getSharedReport);

// Core reporting routes guarded by user auth
router.use(protect, authorize("admin", "manager", "vendor", "staff"));

router.post("/generate", reportController.generateReport);
router.get("/queue/:jobId", reportController.getJobStatus);
router.post("/queue/:jobId/cancel", reportController.cancelJob);

router.get("/history", reportController.getReportHistory);
router.delete("/history/:id", reportController.deleteHistoryItem);
router.get("/history/:id/versions", reportController.getReportVersions);
router.get("/download/:id", reportController.downloadReport);

router.post("/share/:id", reportController.shareReport);
router.put("/share/:id/revoke", reportController.revokeShare);

// Recurrent Schedules
router.post("/schedules", reportController.createSchedule);
router.get("/schedules", reportController.getSchedules);
router.put("/schedules/:id", reportController.toggleSchedule);
router.delete("/schedules/:id", reportController.deleteSchedule);

// Saved Templates
router.post("/templates", reportController.createTemplate);
router.get("/templates", reportController.getTemplates);
router.delete("/templates/:id", reportController.deleteTemplate);

// Scoped Usage Analytics
router.get("/analytics", reportController.getReportsStats);

module.exports = router;
