const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/authMiddleware");
const aiRateLimit = require("../middleware/aiRateLimitMiddleware");

// Require authentication and role scoping for all assistant routes
router.use(protect, authorize("admin", "manager", "vendor", "staff"));

// Health statistics
router.get("/health", aiController.getAIHealth);

// Settings (Singleton)
router.get("/settings", aiController.getAISettings);
router.put("/settings", aiController.updateAISettings);

// Analytics scoped by role
router.get("/analytics", aiController.getChatAnalytics);

// Conversations Thread Management
router.get("/conversations", aiController.getConversations);
router.delete("/conversations/:id", aiController.deleteConversation);
router.post("/conversations/bulk-delete", aiController.bulkDeleteConversations);
router.put("/conversations/:id/rename", aiController.renameConversation);
router.put("/conversations/:id/pin", aiController.togglePinConversation);
router.put("/conversations/:id/archive", aiController.toggleArchiveConversation);
router.get("/conversations/:id/messages", aiController.getConversationMessages);

// Feedback
router.post("/feedback", aiController.submitFeedback);
router.delete("/feedback/:messageId", aiController.deleteFeedback);

// Chat execution (Guarded by sliding window rate limiter)
router.post("/", aiRateLimit, aiController.askAIAssistant);

module.exports = router;
