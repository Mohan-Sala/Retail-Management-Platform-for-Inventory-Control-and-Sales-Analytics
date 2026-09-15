const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(shipmentController.getShipments);

router.put("/:id/status", authorize("admin", "vendor"), shipmentController.updateShipmentStatus);

module.exports = router;
