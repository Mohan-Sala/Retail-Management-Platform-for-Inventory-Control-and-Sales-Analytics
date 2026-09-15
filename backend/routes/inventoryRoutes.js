const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET /api/inventory - retrieve inventory (scoping by vendor if role is vendor)
router.get("/", protect, inventoryController.getInventory);

// POST /api/inventory - create inventory record (Admin only)
router.post("/", protect, authorize("admin"), inventoryController.createInventory);

// PUT /api/inventory/:id - update inventory configuration (Admin only)
router.put("/:id", protect, authorize("admin"), inventoryController.updateInventory);

module.exports = router;
