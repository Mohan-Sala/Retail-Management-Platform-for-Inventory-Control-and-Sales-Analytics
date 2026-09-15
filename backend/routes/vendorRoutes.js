const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateVendor } = require("../middleware/validators");

// Vendor CRUD endpoints
// GET /api/vendors - fetch all vendors (supports query options like search, page, status)
router.get("/", vendorController.getVendors);

// GET /api/vendors/:id - fetch vendor by ID
router.get("/:id", vendorController.getVendor);

// POST /api/vendors - onboard vendor (protected, Admin only)
router.post("/", protect, authorize("admin"), validateVendor, vendorController.createVendor);

// PUT /api/vendors/:id - edit vendor (protected, Admin or owner Vendor)
router.put("/:id", protect, validateVendor, vendorController.updateVendor);

// DELETE /api/vendors/:id - delete vendor (protected, Admin only)
router.delete("/:id", protect, authorize("admin"), vendorController.deleteVendor);

module.exports = router;
