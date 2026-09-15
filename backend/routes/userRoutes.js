const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

router.use(protect);

router.get("/", requirePermission("users.read"), userController.getUsers);
router.post("/", requirePermission("users.write"), userController.createUser);
router.get("/activity", requirePermission("users.read"), userController.getUserActivities);
router.get("/sessions", requirePermission("users.read"), userController.getUserSessions);
router.delete("/sessions", requirePermission("users.write"), userController.revokeAllUserSessions);
router.delete("/sessions/:sessionId", requirePermission("users.write"), userController.revokeUserSession);

router.get("/:id", requirePermission("users.read"), userController.getUserById);
router.put("/:id", requirePermission("users.write"), userController.updateUser);
router.delete("/:id", requirePermission("users.write"), userController.deleteUser);
router.put("/:id/restore", requirePermission("users.write"), userController.restoreUser);
router.put("/:id/status", requirePermission("users.write"), userController.updateUserStatus);
router.put("/:id/reset-password", requirePermission("users.write"), userController.resetUserPassword);
router.put("/:id/role", requirePermission("users.write"), userController.updateUserRole);
router.put("/:id/permissions", requirePermission("users.write"), userController.updateUserPermissions);

module.exports = router;
