const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

router.use(protect);

router.get("/", requirePermission("settings.read"), settingsController.getSettings);
router.put("/store", requirePermission("settings.write"), settingsController.updateStore);
router.put("/theme", requirePermission("settings.write"), settingsController.updateTheme);
router.put("/security", requirePermission("settings.write"), settingsController.updateSecurity);
router.put("/currency", requirePermission("settings.write"), settingsController.updateCurrency);
router.put("/tax", requirePermission("settings.write"), settingsController.updateTax);
router.put("/notifications", requirePermission("settings.write"), settingsController.updateNotifications);

module.exports = router;
