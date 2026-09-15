const express = require("express");
const router = express.Router();
const customerSegmentationController = require("../controllers/customerSegmentationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin", "vendor"), customerSegmentationController.getSegmentationData);

module.exports = router;
