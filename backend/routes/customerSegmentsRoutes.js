const express = require("express");
const router = express.Router();
const customerSegmentationController = require("../controllers/customerSegmentationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(customerSegmentationController.getMySegment);

router.route("/all")
  .get(authorize("admin", "manager", "staff"), customerSegmentationController.getCustomerSegments);

router.post("/recalculate", customerSegmentationController.recalculateSegment);

module.exports = router;
