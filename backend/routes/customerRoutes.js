const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateCustomer } = require("../middleware/validators");

// GET all customers (Admin and Vendor)
router.get("/", protect, customerController.getCustomers);

// GET single customer by ID (Admin and Vendor)
router.get("/:id", protect, customerController.getCustomer);

// POST create customer (Admin only)
router.post("/", protect, authorize("admin"), validateCustomer, customerController.createCustomer);

// PUT update customer (Admin only)
router.put("/:id", protect, authorize("admin"), validateCustomer, customerController.updateCustomer);

// DELETE customer (Admin only)
router.delete("/:id", protect, authorize("admin"), customerController.deleteCustomer);

module.exports = router;
