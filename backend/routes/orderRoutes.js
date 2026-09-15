const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/checkout", protect, authorize("customer", "admin"), orderController.checkout);
router.get("/", protect, authorize("customer", "vendor", "admin", "manager"), orderController.getOrders);
router.get("/:id", protect, authorize("customer", "vendor", "admin", "manager"), orderController.getOrderById);
router.put("/:id/status", protect, authorize("vendor", "admin", "manager"), orderController.updateOrderStatus);

module.exports = router;
