const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require user authentication & matching roles
router.use(protect, authorize("admin", "manager", "vendor", "staff", "customer"));

router.get("/stream", notificationController.streamNotifications);
router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/read-all", notificationController.markAllRead);
router.put("/:id/read", notificationController.markRead);
router.put("/:id/archive", notificationController.archiveNotification);
router.delete("/:id", notificationController.deleteNotification);
router.put("/:id/restore", notificationController.restoreNotification);

router.get("/preferences", notificationController.getPreferences);
router.put("/preferences", notificationController.updatePreferences);
router.get("/analytics", notificationController.getAnalytics);
router.post("/test", notificationController.sendTestNotification);

module.exports = router;
